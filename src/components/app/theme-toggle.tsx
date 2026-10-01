"use client";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";

type ThemeChoice = "system" | "light" | "dark";

const NEXT_CHOICE: Record<ThemeChoice, ThemeChoice> = {
  system: "light",
  light: "dark",
  dark: "system",
};

const HINT: Record<ThemeChoice, string> = {
  system: "Тема: как в системе. Переключить на светлую",
  light: "Тема: светлая. Переключить на тёмную",
  dark: "Тема: тёмная. Вернуть как в системе",
};

export function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  // `next-themes` resolves the actual theme only in the browser. This keeps the
  // first server render deterministic without a synchronous state update in an
  // effect (which the React hooks lint rule correctly rejects).
  const mounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );

  const choice: ThemeChoice = mounted && (theme === "light" || theme === "dark") ? theme : "system";
  const isDark = mounted && resolvedTheme === "dark";
  const Icon = choice === "system" ? Monitor : isDark ? Sun : Moon;
  const label = HINT[choice];

  return (
    <Button
      variant="ghost"
      size="icon"
      className="min-h-11 min-w-11 rounded-xl"
      aria-label={label}
      title={label}
      onClick={() => setTheme(NEXT_CHOICE[choice])}
    >
      <Icon aria-hidden="true" className="h-4 w-4" />
    </Button>
  );
}
