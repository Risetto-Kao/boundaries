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
  themeColor: "#F1EEF8",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { locale } = await getI18n();
  return (
    <html lang={locale}>
      <body className="antialiased"><I18nProvider initialLocale={locale}><AccountNav />{children}</I18nProvider></body>
    </html>
  );
}
