import type { MetadataRoute } from "next";

const basePath = process.env.PAGES_BASE_PATH || "";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MindTrack",
    short_name: "MindTrack",
    description: "Локальный справочник тестов и самонаблюдения.",
    start_url: `${basePath}/`,
    scope: `${basePath}/`,
    display: "standalone",
    background_color: "#f7f7fb",
    theme_color: "#5b55d6",
    lang: "ru",
    icons: [
      {
        src: `${basePath}/icon.svg`,
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: `${basePath}/apple-touch-icon.png`,
        sizes: "180x180",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
