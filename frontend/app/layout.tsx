import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AccountNav } from "@/components/account-nav";

export const metadata: Metadata = {
  title: "Boundaries",
  description: "社交化問卷工具，快速找出群體共識與衝突",
  applicationName: "Boundaries",
  appleWebApp: { capable: true, title: "Boundaries", statusBarStyle: "default" },
  icons: { apple: "/icons/apple-touch-icon.png" },
  other: { "apple-mobile-web-app-capable": "yes" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hant">
      <body className="antialiased"><AccountNav />{children}</body>
    </html>
  );
}
