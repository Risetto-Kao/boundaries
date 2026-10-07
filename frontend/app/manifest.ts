import { getI18n } from "@/lib/i18n/server";
import type { MetadataRoute } from "next";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const { t, locale } = await getI18n();
  return {
    id: "/",
    name: "Boundaries",
    short_name: "Boundaries",
    description: t("siteDescription"),
    lang: locale,
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
