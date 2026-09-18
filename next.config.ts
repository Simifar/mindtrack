import type { NextConfig } from "next";

// Для GitHub Pages проект-сайта задаём basePath через переменную окружения
// (устанавливается в deploy-workflow: PAGES_BASE_PATH=/mindtrack).
// Локально и на обычном хостинге переменная не задана — basePath отсутствует.
const basePath = process.env.PAGES_BASE_PATH || "";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  ...(basePath ? { basePath } : {}),
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
  images: { unoptimized: true },
};

export default nextConfig;
