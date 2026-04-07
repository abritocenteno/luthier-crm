import type { Metadata } from "next";
import { Geist, Geist_Mono, Domine } from "next/font/google";
import "./globals.css";

import { ConditionalClerkProvider } from "@/components/ConditionalClerkProvider";
import ConvexClientProvider from "@/components/ConvexClientProvider";
import { ThemeProvider } from "@/components/ThemeProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const domine = Domine({
  variable: "--font-domine",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "FretOps — CRM for Luthiers",
  description: "The complete workshop management platform for independent luthiers and repair technicians.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Anti-flash: apply dark class before first paint */}
        <script dangerouslySetInnerHTML={{ __html: `
  (function() {
    try {
      var t = localStorage.getItem('accent-theme');
      if (t && t !== 'zinc') document.documentElement.classList.add('theme-' + t);
      var d = localStorage.getItem('theme');
      var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (d === 'dark' || (d === null && prefersDark)) document.documentElement.classList.add('dark');
    } catch(e) {}
  })();
` }} />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} ${domine.variable} antialiased`}>
        <ThemeProvider>
          <ConditionalClerkProvider>
            <ConvexClientProvider>{children}</ConvexClientProvider>
          </ConditionalClerkProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
