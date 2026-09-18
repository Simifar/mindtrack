import type { Metadata } from "next";
import { AppRouter } from "@/components/app/app-router";
import { ALL_TESTS, getTest } from "@/data/tests";
import { testCodeFromSlug, testSlug } from "@/lib/routes";

export function generateStaticParams() {
  return ALL_TESTS.map((test) => ({ slug: testSlug(test.code) }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const code = testCodeFromSlug(slug);
  const test = code ? getTest(code) : undefined;
  return { title: test ? `Прохождение: ${test.name} — MindTrack` : "Тест не найден — MindTrack" };
}

export default function TestRunPage() {
  return <AppRouter />;
}
