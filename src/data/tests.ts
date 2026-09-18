/**
 * MindTrack — статический справочник тестов (без аккаунтов, без БД).
 * Данные локальные: прохождение в браузере, история в localStorage,
 * экспорт текстом в буфер обмена / файл.
 *
 * Дисклеймер: шкалы и пороги из стандартных публичных версий опросников.
 * Это НЕ диагноз — только инструмент самонаблюдения.
 */

export interface TestOption {
  value: number;
  label: string;
}

export interface TestBand {
  max: number;
  severity: string;
  label: string;
  advice: string;
}

export interface TestScoring {
  mode: "sum" | "threshold";
  minValuePerItem?: number;
  minItemsMeetingThreshold?: number;
  positiveSeverity?: string;
  positiveLabel?: string;
  positiveAdvice?: string;
  negativeSeverity?: string;
  negativeLabel?: string;
  negativeAdvice?: string;
  bands?: TestBand[];
  /** Индексы вопросов (0-based) — триггеры кризисного баннера. */
  crisisQuestionIndexes?: number[];
}

export interface TestDefinition {
  code: string;
  name: string;
  short: string;
  description: string;
  /** За какой период спрашивают (подсказка на экране прохождения). */
  timeframe: string;
  periodicity: string;
  questions: string[];
  options: TestOption[];
  scoring: TestScoring;
  source: string;
}

export const FREQUENCY_4 = [
  { value: 0, label: "Совсем не беспокоило" },
  { value: 1, label: "Несколько дней" },
  { value: 2, label: "Более половины дней" },
  { value: 3, label: "Почти каждый день" },
];

export const STRESS_5 = [
  { value: 0, label: "Никогда" },
  { value: 1, label: "Почти никогда" },
  { value: 2, label: "Иногда" },
  { value: 3, label: "Довольно часто" },
  { value: 4, label: "Очень часто" },
];

export const SLEEP_5 = [
  { value: 0, label: "Нет" },
  { value: 1, label: "Лёгкая" },
  { value: 2, label: "Умеренная" },
  { value: 3, label: "Тяжёлая" },
  { value: 4, label: "Очень тяжёлая" },
];

export const WELLBEING_6 = [
  { value: 0, label: "Никогда" },
  { value: 1, label: "Время от времени" },
  { value: 2, label: "Меньше половины времени" },
  { value: 3, label: "Больше половины времени" },
  { value: 4, label: "Большую часть времени" },
  { value: 5, label: "Постоянно" },
];

export const TESTS: TestDefinition[] = [
  {
    code: "PHQ9",
    name: "PHQ-9 — шкала депрессии",
    short: "Депрессия",
    description:
      "Опросник из 9 пунктов о депрессивной симптоматике за последние 2 недели. Не диагноз — результат обсудите со специалистом.",
    timeframe: "Как часто за последние 2 недели вас беспокоило следующее:",
    periodicity: "раз в 2 недели",
    questions: [
      "Снижение интереса или удовольствия от привычных занятий",
      "Подавленность, депрессивность, безнадёжность",
      "Трудности с засыпанием/сном или, наоборот, слишком долгий сон",
      "Утомляемость, нехватка энергии",
      "Снижение или, наоборот, усиление аппетита",
      "Недовольство собой, ощущение, что вы подвели себя или близких",
      "Трудности с концентрацией внимания (чтение, просмотр ТВ)",
      "Замедленность движений/речи либо, наоборот, суетливость и неусидчивость",
      "Мысли о том, что было бы лучше не жить, или мысли о причинении себе вреда",
    ],
    options: FREQUENCY_4,
    scoring: {
      mode: "sum",
      bands: [
        { max: 4, severity: "none", label: "Минимум / нет симптоматики", advice: "Продолжайте наблюдение в обычном режиме." },
        { max: 9, severity: "mild", label: "Лёгкая", advice: "Следите за динамикой, повторите через 2 недели." },
        { max: 14, severity: "moderate", label: "Умеренная", advice: "Рекомендуется обсудить результат с врачом или психологом." },
        { max: 19, severity: "moderately_severe", label: "Умеренно тяжёлая", advice: "Обратитесь к специалисту в ближайшее время." },
        { max: 27, severity: "severe", label: "Тяжёлая", advice: "Обратитесь к специалисту как можно скорее." },
      ],
      crisisQuestionIndexes: [8],
    },
    source: "Kroenke K. et al., PHQ-9 (публичная версия)",
  },
  {
    code: "GAD7",
    name: "GAD-7 — шкала тревожности",
    short: "Тревога",
    description:
      "Опросник из 7 пунктов о генерализованной тревожности за последние 2 недели. Не диагноз — результат обсудите со специалистом.",
    timeframe: "Как часто за последние 2 недели вас беспокоило следующее:",
    periodicity: "раз в 2 недели",
    questions: [
      "Чувствовали нервозность, тревогу или напряжение",
      "Не могли остановить или контролировать беспокойство",
      "Чрезмерно беспокоились о разных вещах",
      "Трудно было расслабиться",
      "Были настолько неусидчивы, что трудно было усидеть на месте",
      "Легко раздражались или выходили из себя",
      "Испытывали страх, будто может случиться что-то ужасное",
    ],
    options: FREQUENCY_4,
    scoring: {
      mode: "sum",
      bands: [
        { max: 4, severity: "none", label: "Минимальная тревожность", advice: "Продолжайте наблюдение в обычном режиме." },
        { max: 9, severity: "mild", label: "Лёгкая", advice: "Следите за динамикой, повторите через 2 недели." },
        { max: 14, severity: "moderate", label: "Умеренная", advice: "Рекомендуется обсудить результат с врачом или психологом." },
        { max: 21, severity: "severe", label: "Тяжёлая", advice: "Обратитесь к специалисту как можно скорее." },
      ],
    },
    source: "Spitzer R.L. et al., GAD-7 (публичная версия)",
  },
];

export const TESTS_MDQ: TestDefinition = {
  code: "MDQ",
  name: "MDQ — скрининг биполярного спектра",
  short: "Биполярный спектр",
  description:
    "Скрининг жизненного анамнеза: бывали ли у вас периоды необычных состояний. Положительный скрининг — повод, а не диагноз.",
  timeframe: "Бывал ли у вас период, когда вы:",
  periodicity: "раз в 3 месяца",
  questions: [
    "Чувствовали себя необычно счастливыми или возбуждёнными?",
    "Были раздражительными, кричали на людей или затевали ссоры?",
    "Были более самоуверенными, чем обычно?",
    "Спали меньше обычного и не чувствовали усталости?",
    "Были более разговорчивыми или говорили быстрее обычного?",
    "Мысли быстро сменяли друг друга?",
    "Легко отвлекались, переключаясь с одного на другое?",
    "Были намного более энергичными и продуктивными?",
  ],
  options: [
    { value: 0, label: "Нет" },
    { value: 1, label: "Да" },
  ],
  scoring: {
    mode: "threshold",
    minValuePerItem: 1,
    minItemsMeetingThreshold: 7,
    positiveSeverity: "positive",
    positiveLabel: "Положительный скрининг (7+ «да»)",
    positiveAdvice: "Обсудите результат с психиатром — нужна очная оценка анамнеза.",
    negativeSeverity: "negative",
    negativeLabel: "Отрицательный скрининг",
    negativeAdvice: "Признаков биполярного спектра по MDQ не выявлено.",
  },
  source: "Hirschfeld R.M.W. et al., MDQ (сокращённая версия)",
};

export const TESTS_WHO5: TestDefinition = {
  code: "WHO5",
  name: "WHO-5 — индекс благополучия",
  short: "Благополучие",
  description:
    "5 пунктов о самочувствии за последние 2 недели. Низкий балл — повод обсудить состояние со специалистом. Не диагноз.",
  timeframe: "Как вы себя чувствовали за последние 2 недели:",
  periodicity: "раз в 2 недели",
  questions: [
    "Я чувствовал(а) себя бодрым(ой) и в хорошем настроении",
    "Я чувствовал(а) себя спокойным(ой) и расслабленным(ой)",
    "Я чувствовал(а) себя активным(ой) и энергичным(ой)",
    "Я просыпался(ась) свежим(ей) и отдохнувшим(ей)",
    "Повседневная жизнь была наполнена интересными делами",
  ],
  options: WELLBEING_6,
  scoring: {
    mode: "sum",
    bands: [
      { max: 12, severity: "severe", label: "Низкое благополучие", advice: "Рекомендуется обсудить состояние со специалистом." },
      { max: 17, severity: "moderate", label: "Пониженное благополучие", advice: "Следите за динамикой, повторите через 2 недели." },
      { max: 25, severity: "none", label: "Хорошее благополучие", advice: "Продолжайте наблюдение в обычном режиме." },
    ],
  },
  source: "WHO-5 Well-Being Index (сырой балл 0–25)",
};

export const TESTS_ISI: TestDefinition = {
  code: "ISI",
  name: "ISI — индекс тяжести бессонницы",
  short: "Сон",
  description:
    "7 пунктов о трудностях сна за последние 2 недели. Не диагноз — результат обсудите со специалистом.",
  timeframe: "Оцените тяжесть проблем за последние 2 недели:",
  periodicity: "раз в 2 недели",
  questions: [
    "Трудности с засыпанием",
    "Пробуждения ночью, трудности с поддержанием сна",
    "Слишком ранние пробуждения",
    "Удовлетворённость режимом сна (0 — доволен, 4 — недоволен)",
    "Насколько проблемы со сном заметны окружающим",
    "Насколько вы обеспокоены проблемами со сном",
    "Насколько сон мешает дневному функционированию",
  ],
  options: SLEEP_5,
  scoring: {
    mode: "sum",
    bands: [
      { max: 7, severity: "none", label: "Нет клинически значимой бессонницы", advice: "Продолжайте соблюдать гигиену сна." },
      { max: 14, severity: "mild", label: "Подпороговая бессонница", advice: "Следите за режимом, повторите через 2 недели." },
      { max: 21, severity: "moderate", label: "Умеренная бессонница", advice: "Рекомендуется обсудить результат с врачом." },
      { max: 28, severity: "severe", label: "Тяжёлая бессонница", advice: "Обратитесь к врачу как можно скорее." },
    ],
  },
  source: "Morin C.M., ISI (публичная версия)",
};

export const TESTS_PSS10: TestDefinition = {
  code: "PSS10",
  name: "PSS-10 — шкала воспринимаемого стресса",
  short: "Стресс",
  description:
    "10 пунктов о том, насколько непредсказуемой и перегруженной ощущалась жизнь за последний месяц. Не диагноз.",
  timeframe: "Как часто за последний месяц вы:",
  periodicity: "раз в месяц",
  questions: [
    "Расстраивались из-за чего-то неожиданного?",
    "Чувствовали, что не можете контролировать важные вещи?",
    "Чувствовали нервозность и напряжение?",
    "Чувствовали, что не справляетесь со всеми делами?",
    "Злились из-за вещей, которые выходили из-под контроля?",
    "Чувствовали, что трудности накапливаются?",
    "Не могли справиться с раздражением?",
    "Чувствовали напряжение из-за дедлайнов?",
    "Чувствовали усталость от неопределённости?",
    "Чувствовали, что проблемы растут быстрее решений?",
  ],
  options: STRESS_5,
  scoring: {
    mode: "sum",
    bands: [
      { max: 13, severity: "none", label: "Низкий стресс", advice: "Уровень стресса в пределах нормы." },
      { max: 26, severity: "moderate", label: "Умеренный стресс", advice: "Обратите внимание на отдых и восстановление." },
      { max: 40, severity: "severe", label: "Высокий стресс", advice: "Рекомендуется снизить нагрузку и обсудить состояние со специалистом." },
    ],
  },
  source: "Cohen S. et al., PSS-10 (публичная версия)",
};

export const TESTS_ASRS: TestDefinition = {
  code: "ASRS",
  name: "ASRS-v1.1 — скрининг СДВГ у взрослых",
  short: "СДВГ",
  description:
    "Краткий скрининг из 6 пунктов о симптомах дефицита внимания за последние 6 месяцев. Не диагноз.",
  timeframe: "Как часто за последние 6 месяцев у вас было следующее:",
  periodicity: "раз в 3 месяца",
  questions: [
    "Трудности с завершением мелких деталей проекта",
    "Трудности с организацией дел и планированием",
    "Трудности с запоминанием назначений и обязательств",
    "Откладываете задачи, требующие длительных умственных усилий",
    "Дёргаетесь или ёрзаете, когда нужно долго сидеть",
    "Чувствуете чрезмерную активность, как будто «заведённые»",
  ],
  options: [
    { value: 0, label: "Никогда" },
    { value: 1, label: "Редко" },
    { value: 2, label: "Иногда" },
    { value: 3, label: "Часто" },
    { value: 4, label: "Очень часто" },
  ],
  scoring: {
    mode: "threshold",
    minValuePerItem: 2,
    minItemsMeetingThreshold: 4,
    positiveSeverity: "positive",
    positiveLabel: "Положительный скрининг (4+ пункта ≥ «Иногда»)",
    positiveAdvice: "Обсудите результат с психиатром или неврологом.",
    negativeSeverity: "negative",
    negativeLabel: "Отрицательный скрининг",
    negativeAdvice: "Признаков СДВГ по ASRS не выявлено.",
  },
  source: "Kessler R.C. et al., ASRS-v1.1 Screener (WHO)",
};

export function getTest(code: string): TestDefinition | undefined {
  return ALL_TESTS.find((t) => t.code === code);
}

/** Все тесты одним списком (порядок каталога). */
export const ALL_TESTS: TestDefinition[] = [
  ...TESTS,
  TESTS_MDQ,
  TESTS_ASRS,
  TESTS_PSS10,
  TESTS_ISI,
  TESTS_WHO5,
];

export interface ScoreResult {
  totalScore: number;
  severity: string;
  label: string;
  advice: string;
  crisisDetected: boolean;
}

/** Чистый подсчёт результата по ответам (индекс вопроса → значение). */
export function scoreTest(def: TestDefinition, answers: Record<number, number>): ScoreResult {
  const values = def.questions.map((_, i) => answers[i] ?? 0);
  const crisisDetected = (def.scoring.crisisQuestionIndexes ?? []).some((i) => (values[i] ?? 0) > 0);

  if (def.scoring.mode === "threshold") {
    const minVal = def.scoring.minValuePerItem ?? 1;
    const count = values.filter((v) => v >= minVal).length;
    const positive = count >= (def.scoring.minItemsMeetingThreshold ?? 1);
    return {
      totalScore: count,
      severity: positive ? (def.scoring.positiveSeverity ?? "positive") : (def.scoring.negativeSeverity ?? "negative"),
      label: positive ? (def.scoring.positiveLabel ?? "Положительный") : (def.scoring.negativeLabel ?? "Отрицательный"),
      advice: positive ? (def.scoring.positiveAdvice ?? "") : (def.scoring.negativeAdvice ?? ""),
      crisisDetected,
    };
  }

  const total = values.reduce((s, v) => s + v, 0);
  const bands = def.scoring.bands ?? [];
  const band = bands.find((b) => total <= b.max) ?? bands[bands.length - 1] ?? {
    severity: "none",
    label: "—",
    advice: "",
  };
  return { totalScore: total, severity: band.severity, label: band.label, advice: band.advice, crisisDetected };
}

/** Максимально возможный балл теста (для подписи «12 / 27»). */
export function maxScore(def: TestDefinition): number {
  const optMax = Math.max(...def.options.map((o) => o.value));
  return optMax * def.questions.length;
}

/** Текстовый экспорт результата — для отправки врачу / себе. */
export function formatResultText(opts: {
  def: TestDefinition;
  answers: Record<number, number>;
  result: ScoreResult;
  date: Date;
}): string {
  const { def, answers, result, date } = opts;
  const lines: string[] = [];
  lines.push(`MindTrack — результат самонаблюдения (НЕ диагноз)`);
  lines.push(`${def.name}`);
  lines.push(`Дата: ${date.toLocaleString("ru-RU")}`);
  lines.push(`Балл: ${result.totalScore} / ${maxScore(def)} — ${result.label}`);
  if (result.advice) lines.push(`Рекомендация: ${result.advice}`);
  lines.push(``);
  lines.push(`Ответы:`);
  def.questions.forEach((q, i) => {
    const opt = def.options.find((o) => o.value === answers[i]);
    lines.push(`${i + 1}. ${q} — ${opt ? `${opt.label} (${opt.value})` : "—"}`);
  });
  lines.push(``);
  lines.push(`Источник шкалы: ${def.source}`);
  lines.push(`Обсудите результат с врачом или психологом. В кризисе: 8-800-2000-122 (круглосуточно).`);
  return lines.join("\n");
}
