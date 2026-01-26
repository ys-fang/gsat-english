import type { Metadata, Viewport } from "next";
import { Noto_Sans_TC } from "next/font/google";
import "./globals.css";

const notoSansTC = Noto_Sans_TC({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-noto-sans-tc",
});

export const metadata: Metadata = {
  title: "LearnGASAT - 學測英文沈浸式學習",
  description: "臺南市立大灣高中影音教學頻道 - 學測英文文意字彙沈浸式學習平台",
  keywords: ["學測", "英文", "文意字彙", "大灣高中", "學習"],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW" suppressHydrationWarning>
      <body className={`${notoSansTC.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
