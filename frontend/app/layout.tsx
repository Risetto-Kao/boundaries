import type { Metadata } from "next";
import "./globals.css";
import { AccountNav } from "@/components/account-nav";

export const metadata: Metadata = {
  title: "Boundaries",
  description: "社交化問卷工具，快速找出群體共識與衝突",
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
