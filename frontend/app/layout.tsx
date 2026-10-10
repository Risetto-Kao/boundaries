/* eslint-disable @next/next/no-page-custom-font -- App Router root layout loads the shared stylesheet on every route. */
import { getI18n } from "@/lib/i18n/server";
import { I18nProvider } from "@/components/i18n-provider";
import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AccountNav } from "@/components/account-nav";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return {
    title: "Boundaries",
    description: t("siteDescription"),
    applicationName: "Boundaries",
    appleWebApp: { capable: true, title: "Boundaries", statusBarStyle: "default" },
    icons: {
      icon: [{ url: "/assets/brand/favicon.ico", sizes: "16x16 32x32 48x48" }, { url: "/assets/brand/favicon.svg", type: "image/svg+xml" }],
      apple: "/assets/brand/apple-touch-icon-180.png",
    },
    other: { "apple-mobile-web-app-capable": "yes" },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#FAF9FF",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { locale } = await getI18n();
  return (
    <html lang={locale}>
      <head><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;700;800&family=Noto+Sans+TC:wght@400;500;700;800&family=Noto+Sans+JP:wght@400;500;700;800&family=Noto+Sans+KR:wght@400;500;700;800&display=swap" /></head>
      <body className="antialiased"><I18nProvider initialLocale={locale}><AccountNav />{children}</I18nProvider></body>
    </html>
  );
}
