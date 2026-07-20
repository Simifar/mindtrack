/**
 * Generic-логика подсчёта тестов по scoringRuleJson из TestDefinition.
 * Поддерживает два режима:
 *   - "sum": сумма значений ответов + диапазоны (bands) → severity/label
 *   - "threshold": сколько пунктов достигли порога → positive/negative
 *
 * scoringRuleJson примеры:
 * {
 *   "mode": "sum",
 *   "sumIndexes": "all" | [0,1,2,...],
 *   "bands": [{ "max": 4, "severity": "none", "label": "Минимум/нет" }, ...],
 *   "crisisQuestionIndexes": [8]
 * }
 * {
 *   "mode": "threshold",
 *   "minValuePerItem": 2,
 *   "minItemsMeetingThreshold": 4,
 *   "positiveSeverity": "positive", "positiveLabel": "Скрининг положительный",
 *   "negativeSeverity": "negative", "negativeLabel": "Скрининг отрицательный",
 *   "crisisQuestionIndexes": []
 * }
 */

export interface ScoringBand {
  max: number;
  severity: string;
  label: string;
}

export interface CompositeCondition {
  /** "countAbove": сколько пунктов из indexes >= threshold; "valueAbove": value[index] >= threshold. */
  type: "countAbove" | "valueAbove";
  indexes: number[];
  threshold: number;
  minCount?: number; // для countAbove
}

export interface ScoringRule {
  mode: "sum" | "threshold" | "composite";
  sumIndexes?: "all" | number[];
  bands?: ScoringBand[];
  minValuePerItem?: number;
  minItemsMeetingThreshold?: number;
  /** Для composite: условия, объединяемые matchMode. */
  conditions?: CompositeCondition[];
  matchMode?: "all" | "any";
  positiveSeverity?: string;
  positiveLabel?: string;
  negativeSeverity?: string;
  negativeLabel?: string;
  /** Какое значение показывать как totalScore для composite (например, счёт yes). */
  compositeScoreFrom?: "countConditionsMet" | "sumAll";
  crisisQuestionIndexes?: number[];
  /** Краткое описание шкалы для отображения. */
  scaleLabel?: string;
}

export interface AnswerValue {
  questionId: string;
  value: number | string;
}

export interface QuestionOption {
  value: number;
  label: string;
}

export interface TestQuestionData {
  id: string;
  order: number;
  text: string;
  optionsJson: string; // JSON: QuestionOption[]
  isFreeText: boolean;
}

export interface ScoreResult {
  totalScore: number;
  severity: string;
  label: string;
  crisisDetected: boolean;
}

function parseRule(ruleJson: string): ScoringRule {
  try {
    return JSON.parse(ruleJson) as ScoringRule;
  } catch {
    return { mode: "sum", bands: [] };
  }
}

function num(v: number | string): number {
  if (typeof v === "number") return v;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Считает результат теста по правилу и ответам.
 * @param ruleJson scoringRuleJson из TestDefinition
 * @param answers ответы пользователя (в порядке questions? — нет, по questionId)
 * @param questions вопросы теста (для порядка и crisis-индексов)
 */
export function scoreTest(
  ruleJson: string,
  answers: AnswerValue[],
  questions: TestQuestionData[]
): ScoreResult {
  const rule = parseRule(ruleJson);
  // Сортируем вопросы по order для корректной индексации crisisQuestionIndexes.
  const sorted = [...questions].sort((a, b) => a.order - b.order);
  const answerByQuestionId = new Map(answers.map((a) => [a.questionId, a.value]));

  // Подсчёт суммы числовых ответов.
  const numericValues = sorted.map((q, idx) => {
    const raw = answerByQuestionId.get(q.id);
    if (raw === undefined) return { idx, value: 0, q };
    return { idx, value: num(raw), q };
  });

  let totalScore = 0;
  let severity = "none";
  let label = "—";

  if (rule.mode === "threshold") {
    const minVal = rule.minValuePerItem ?? 2;
    const minItems = rule.minItemsMeetingThreshold ?? 4;
    const itemsMeeting = numericValues.filter((v) => v.value >= minVal).length;
    totalScore = itemsMeeting;
    if (itemsMeeting >= minItems) {
      severity = rule.positiveSeverity ?? "positive";
      label = rule.positiveLabel ?? "Скрининг положительный";
    } else {
      severity = rule.negativeSeverity ?? "negative";
      label = rule.negativeLabel ?? "Скрининг отрицательный";
    }
  } else if (rule.mode === "composite") {
    const conditions = rule.conditions ?? [];
    const matchMode = rule.matchMode ?? "all";
    const results = conditions.map((c) => {
      if (c.type === "countAbove") {
        const count = c.indexes.filter((i) => numericValues[i]?.value >= c.threshold).length;
        return count >= (c.minCount ?? 1);
      }
      // valueAbove
      return c.indexes.some((i) => numericValues[i]?.value >= c.threshold);
    });
    const positive =
      matchMode === "all" ? results.every(Boolean) : results.some(Boolean);
    if (rule.compositeScoreFrom === "sumAll") {
      totalScore = numericValues.reduce((acc, v) => acc + v.value, 0);
    } else {
      totalScore = results.filter(Boolean).length;
    }
    if (positive) {
      severity = rule.positiveSeverity ?? "positive";
      label = rule.positiveLabel ?? "Скрининг положительный";
    } else {
      severity = rule.negativeSeverity ?? "negative";
      label = rule.negativeLabel ?? "Скрининг отрицательный";
    }
  } else {
    // sum mode
    const indexesToSum =
      rule.sumIndexes === "all" || !rule.sumIndexes
        ? numericValues.map((v) => v.idx)
        : rule.sumIndexes;
    totalScore = numericValues
      .filter((v) => indexesToSum.includes(v.idx))
      .reduce((acc, v) => acc + v.value, 0);

    const bands = rule.bands ?? [];
    const matched =
      bands.find((b) => totalScore <= b.max) ?? bands[bands.length - 1] ?? {
        severity: "none",
        label: "—",
      };
    severity = matched.severity;
    label = matched.label;
  }

  // Crisis-детекция по конкретным индексам вопросов.
  const crisisIdx = rule.crisisQuestionIndexes ?? [];
  let crisisDetected = false;
  for (const idx of crisisIdx) {
    const v = numericValues[idx];
    if (v && v.value > 0) {
      crisisDetected = true;
      break;
    }
  }

  return { totalScore, severity, label, crisisDetected };
}

/** Цвет для отображения severity в UI. */
export function severityColor(severity: string): string {
  switch (severity) {
    case "none":
    case "negative":
      return "var(--chart-2)"; // зелёный
    case "mild":
      return "var(--chart-4)"; // жёлтый
    case "moderate":
      return "var(--chart-5)"; // оранжевый
    case "moderately_severe":
    case "positive":
      return "var(--chart-1)"; // красно-оранжевый
    case "severe":
      return "var(--destructive)"; // красный
    default:
      return "var(--muted-foreground)";
  }
}
