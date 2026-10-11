import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return ["/forms/:path*", "/api/forms/:path*", "/account"].map(source => ({ source, headers: [
      { key: "Cache-Control", value: "private, no-store, max-age=0" },
      { key: "Referrer-Policy", value: "no-referrer" },
      { key: "X-Robots-Tag", value: "noindex, nofollow" },
    ] }));
  },
};

export default nextConfig;
