import type { MetadataRoute } from "next";
import { screeningScales } from "@/data/scales";
import { topics } from "@/data/topics";
export const dynamic = "force-static";
const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://example.github.io/MindTrack";
export default function sitemap(): MetadataRoute.Sitemap { return [{ url: `${base}/`, changeFrequency: "monthly", priority: 1 }, { url: `${base}/topics`, changeFrequency: "monthly", priority: .8 }, ...topics.map((item) => ({ url: `${base}/topics/${item.slug}`, changeFrequency: "monthly" as const, priority: .7 })), ...screeningScales.map((item) => ({ url: `${base}/scales/${item.slug}`, changeFrequency: "monthly" as const, priority: .8 }))]; }
