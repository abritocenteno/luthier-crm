import jsPDF from "jspdf";
import { toPng } from "html-to-image";

/**
 * Splits an invoice image into A4 pages, finding whitespace rows
 * near each page boundary so lines are never cut mid-row.
 */
export async function splitIntoPages(dataUrl: string, compress = false): Promise<jsPDF> {
    const A4W = 210, A4H = 297; // mm

    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const i = new Image();
        i.onload = () => resolve(i);
        i.onerror = reject;
        i.src = dataUrl;
    });

    // Full-image canvas for pixel scanning
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);

    const totalHeightMm = (img.height / img.width) * A4W;
    const pageHeightPx = Math.round((A4H / totalHeightMm) * img.height);
    const searchRadius = Math.round(pageHeightPx * 0.06); // scan ±6% of page height

    // Find the best split point by detecting a horizontal divider line near the ideal boundary.
    // Dividers are rows where a large portion of pixels are noticeably darker than white.
    // Falls back to the nearest white gap if no divider is found.
    const findSplit = (ideal: number): number => {
        const top = Math.max(0, ideal - searchRadius);
        const bottom = Math.min(img.height, ideal + Math.round(searchRadius * 0.3));
        const height = bottom - top;
        if (height <= 0) return ideal;
        const strip = ctx.getImageData(0, top, img.width, height).data;

        const isDivider = (row: number): boolean => {
            const base = row * img.width * 4;
            let dark = 0;
            for (let i = 0; i < img.width; i++) {
                const o = base + i * 4;
                // A divider pixel is noticeably darker than white (zinc-50/100 range)
                if (strip[o] < 220 || strip[o + 1] < 220 || strip[o + 2] < 220) dark++;
            }
            // At least 60% of the row must be non-white to count as a divider
            return dark / img.width >= 0.6;
        };

        const isWhite = (row: number): boolean => {
            const base = row * img.width * 4;
            let whites = 0;
            for (let i = 0; i < img.width; i++) {
                const o = base + i * 4;
                if (strip[o] > 235 && strip[o + 1] > 235 && strip[o + 2] > 235) whites++;
            }
            return whites / img.width >= 0.97;
        };

        // How many px to back up before the divider so it appears at the top of the next page with breathing room
        const topPad = Math.round(pageHeightPx * 0.018); // ~1.8% of page height ≈ 5mm

        // 1. Look for the closest divider line, preferring above the ideal cut
        for (let d = 0; d <= searchRadius; d++) {
            const rowAbove = ideal - top - d;
            if (rowAbove >= 0 && isDivider(rowAbove)) return Math.max(0, ideal - d - topPad);
            const rowBelow = ideal - top + d;
            if (d > 0 && rowBelow < height && isDivider(rowBelow)) return Math.max(0, ideal + d - topPad);
        }

        // 2. Fallback: largest white gap (original logic)
        type Run = { start: number; end: number };
        const runs: Run[] = [];
        let inRun = false, runStart = 0;
        for (let r = 0; r < height; r++) {
            if (isWhite(r)) {
                if (!inRun) { inRun = true; runStart = r; }
            } else {
                if (inRun) { runs.push({ start: runStart, end: r - 1 }); inRun = false; }
            }
        }
        if (inRun) runs.push({ start: runStart, end: height - 1 });
        if (runs.length === 0) return ideal;
        const best = runs.reduce((a, b) => (b.end - b.start > a.end - a.start ? b : a));
        return top + Math.round((best.start + best.end) / 2);
    };

    // Build split points
    const splits: number[] = [0];
    let pos = 0;
    while (pos + pageHeightPx < img.height) {
        const split = findSplit(pos + pageHeightPx);
        splits.push(split);
        pos = split;
    }
    splits.push(img.height);

    // Build PDF — one slice per page
    const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4', compress });
    const sliceCanvas = document.createElement('canvas');
    sliceCanvas.width = img.width;

    for (let i = 0; i < splits.length - 1; i++) {
        const startPx = splits[i];
        const sliceH = splits[i + 1] - startPx;
        const sliceHMm = (sliceH / img.width) * A4W;

        sliceCanvas.height = sliceH;
        const sc = sliceCanvas.getContext('2d')!;
        sc.fillStyle = '#ffffff';
        sc.fillRect(0, 0, sliceCanvas.width, sliceH);
        sc.drawImage(canvas, 0, startPx, img.width, sliceH, 0, 0, img.width, sliceH);

        if (i > 0) pdf.addPage();
        pdf.addImage(
            sliceCanvas.toDataURL('image/png'),
            'PNG', 0, 0, A4W, sliceHMm,
            undefined,
            compress ? 'FAST' : 'NONE'
        );
    }

    return pdf;
}

/** Snapshot an invoice DOM node to a PNG data URL at desktop width. */
export function captureInvoicePng(
    node: HTMLElement,
    { quality, pixelRatio }: { quality: number; pixelRatio: number }
): Promise<string> {
    // html-to-image relies on the browser's native SVG foreignObject support,
    // which fully understands oklch, lab, color-mix, and Tailwind 4.
    return toPng(node, {
        quality,
        pixelRatio,
        backgroundColor: '#ffffff',
        style: {
            transform: 'scale(1)',
            transformOrigin: 'top left',
            width: '1100px', // Ensure capture stays at desktop width
            margin: '0',
        },
    });
}

/** Wait for every <img> inside a node to finish loading (or error) before snapshotting. */
export async function waitForImages(node: HTMLElement, timeoutMs = 8000): Promise<void> {
    const imgs = Array.from(node.querySelectorAll("img"));
    await Promise.all(
        imgs.map((img) => {
            if (img.complete && img.naturalWidth > 0) return Promise.resolve();
            return new Promise<void>((resolve) => {
                const done = () => resolve();
                img.addEventListener("load", done, { once: true });
                img.addEventListener("error", done, { once: true });
                setTimeout(done, timeoutMs);
            });
        })
    );
}
