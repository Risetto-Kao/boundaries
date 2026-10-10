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
    background_color: "#FAF9FF",
    theme_color: "#FAF9FF",
    icons: [
      { src: "/assets/brand/boundaries-app-icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/assets/brand/boundaries-app-icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
