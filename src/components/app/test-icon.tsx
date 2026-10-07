import { Brain, ClipboardList, CloudRain, HeartPulse, MoonStar, Sparkles, Timer, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

const TEST_ICONS: Record<string, React.ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" }>> = {
  PHQ9: CloudRain,
  GAD7: Zap,
  MDQ: HeartPulse,
  ASRS: Timer,
  PSS10: Brain,
  ISI: MoonStar,
  WHO5: Sparkles,
};

export function TestIcon({ code, className }: { code: string; className?: string }) {
  const Icon = TEST_ICONS[code] ?? ClipboardList;
  return <Icon aria-hidden="true" className={className} />;
}

/** Иконка методики в мягкой плашке. Цвет — только акцент, не носитель смысла. */
export function TestBadgeIcon({ code, size = "md", className }: { code: string; size?: "sm" | "md" | "lg"; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex shrink-0 items-center justify-center bg-primary-soft text-primary",
        size === "sm" && "h-9 w-9 rounded-xl",
        size === "md" && "h-11 w-11 rounded-2xl",
        size === "lg" && "h-14 w-14 rounded-[1.1rem]",
        className,
      )}
    >
      <TestIcon code={code} className={size === "lg" ? "h-6 w-6" : size === "sm" ? "h-4 w-4" : "h-5 w-5"} />
    </span>
  );
}
