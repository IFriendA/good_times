import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "美好时光日志",
    short_name: "美好时光",
    description: "记录投入、能量与心流，从真实体验中找到人生方向。",
    start_url: "/",
    display: "standalone",
    background_color: "#f6f0e5",
    theme_color: "#61745a",
    orientation: "portrait",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
