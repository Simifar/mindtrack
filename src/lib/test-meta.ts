/** Период, о котором спрашивают вопросы методики (формулировки из инструкций форм). */
export function recallPeriod(code: string): string {
  if (code === "PSS10") return "Последний месяц";
  if (code === "ASRS") return "Последние 6 месяцев";
  if (code === "MDQ") return "За всю жизнь";
  return "Последние 2 недели";
}

/** Тематические группы каталога. Порядок внутри группы — порядок показа. */
export const TEST_GROUPS: { id: string; title: string; description: string; codes: string[] }[] = [
  {
    id: "mood",
    title: "Настроение и самочувствие",
    description: "Короткие формы, которые удобно повторять раз в две недели.",
    codes: ["PHQ9", "GAD7", "WHO5"],
  },
  {
    id: "sleep-stress",
    title: "Сон и стресс",
    description: "Помогают заметить, как нагрузка и сон меняются со временем.",
    codes: ["ISI", "PSS10"],
  },
  {
    id: "screening",
    title: "Дополнительные скрининги",
    description: "Проходят реже; результат стоит обсуждать со специалистом.",
    codes: ["MDQ", "ASRS"],
  },
];

/** С чего начать, если истории ещё нет: самые короткие и общие формы. */
export const STARTER_CODES = ["WHO5", "PHQ9", "GAD7"];
