import { z } from "zod";
import { screeningScales } from "@/data/scales";
import { topics } from "@/data/topics";

export const safeUrlSchema = z.string().url().refine((value) => {
  const url = new URL(value);
  return (url.protocol === "https:" || url.protocol === "http:") && !url.username && !url.password;
}, "URL должен использовать http/https без credentials");

export const scaleSchema = z.object({
  id: z.string().regex(/^scale-[a-z0-9-]+$/),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string().min(1),
  shortTitle: z.string().min(1),
  summary: z.string().min(1),
  description: z.string().min(1),
  topicIds: z.array(z.string().min(1)),
  audience: z.string().min(1),
  durationMinutes: z.number().int().positive(),
  sourceUrl: safeUrlSchema.nullable(),
  reviewStatus: z.enum(["assessed", "pending", "unassessed"]),
  tags: z.array(z.string().min(1)),
});

export function findScale(slug: string) {
  return screeningScales.find((scale) => scale.slug === slug);
}

export function validateContent() {
  const ids = new Set<string>();
  const slugs = new Set<string>();
  for (const scale of screeningScales) {
    scaleSchema.parse(scale);
    if (ids.has(scale.id) || slugs.has(scale.slug)) throw new Error(`Duplicate content identifier: ${scale.id}/${scale.slug}`);
    ids.add(scale.id);
    slugs.add(scale.slug);
    for (const topicId of scale.topicIds) if (!topics.some((topic) => topic.id === topicId)) throw new Error(`Unknown topic: ${topicId}`);
  }
  for (const topic of topics) {
    if (ids.has(topic.id) || slugs.has(topic.slug)) throw new Error(`Duplicate topic identifier: ${topic.id}/${topic.slug}`);
    ids.add(topic.id);
    slugs.add(topic.slug);
  }
  return { scaleCount: screeningScales.length, topicCount: topics.length };
}
