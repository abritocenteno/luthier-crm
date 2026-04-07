import { ImageResponse } from "next/og";

export const size        = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
    return new ImageResponse(
        <div
            style={{
                width: 32,
                height: 32,
                background: "#402A1B",
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#C9914C",
                fontSize: 22,
                fontWeight: 700,
            }}
        >
            F
        </div>,
        { ...size },
    );
}
