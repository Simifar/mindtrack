/**
 * MindTrack seed: ConditionTag + TestDefinition (PHQ-9, GAD-7, MDQ, ASRS).
 * Запуск: bun prisma/seed.ts (или bun run db:seed)
 *
 * Тесты хранятся как generic-данные: варианты ответов в TestQuestion.optionsJson,
 * правило подсчёта в TestDefinition.scoringRuleJson. UI прохождения — единый.
 *
 * Дисклеймер: шкалы и пороги взяты из стандартных публичных версий опросников.
 * Это НЕ диагноз — только инструмент самонаблюдения.
 */
import { PrismaClient, Prisma } from "@prisma/client";

const db = new PrismaClient();

const YESNO = [
  { value: 0, label: "Нет" },
  { value: 1, label: "Да" },
] as Prisma.InputJsonValue;

// ---------- PHQ-9 ----------
const phq9Options = [
  { value: 0, label: "Совсем не беспокоило" },
  { value: 1, label: "Несколько дней" },
  { value: 2, label: "Более половины дней" },
  { value: 3, label: "Почти каждый день" },
] as Prisma.InputJsonValue;
const phq9Questions = [
  "Снижение интереса или удовольствия от привычных занятий",
  "Подавленность, депрессивность, безнадёжность",
  "Трудности с засыпанием/сном или, наоборот, слишком долгий сон",
  "Утомляемость, нехватка энергии",
  "Снижение или, наоборот, усиление аппетита",
  "Недовольство собой, ощущение, что вы подвели себя или близких",
  "Трудности с концентрацией внимания (чтение, просмотр ТВ)",
  "Замедленность движений/речи либо, наоборот, суетливость и неусидчивость",
  "Мысли о том, что было бы лучше не жить, или мысли о причинении себе вреда",
];
const phq9Scoring = {
  mode: "sum" as const,
  sumIndexes: "all" as const,
  scaleLabel: "PHQ-9: 0–27",
  bands: [
    { max: 4, severity: "none", label: "Минимум / нет депрессивной симптоматики" },
    { max: 9, severity: "mild", label: "Лёгкая" },
    { max: 14, severity: "moderate", label: "Умеренная" },
    { max: 19, severity: "moderately_severe", label: "Умеренно тяжёлая" },
    { max: 27, severity: "severe", label: "Тяжёлая" },
  ],
  // Вопрос 9 (индекс 8) — о мыслях причинить себе вред → кризис-триггер.
  crisisQuestionIndexes: [8],
};

// ---------- GAD-7 ----------
const gad7Options = phq9Options;
const gad7Questions = [
  "Чувствовали нервозность, тревогу или напряжение",
  "Не могли остановить или контролировать беспокойство",
  "Чрезмерно беспокоились о разных вещах",
  "Трудно было расслабиться",
  "Были настолько неусидчивы, что трудно было усидеть на месте",
  "Легко раздражались или выходили из себя",
  "Испытывали страх, будто может случиться что-то ужасное",
];
const gad7Scoring = {
  mode: "sum" as const,
  sumIndexes: "all" as const,
  scaleLabel: "GAD-7: 0–21",
  bands: [
    { max: 4, severity: "none", label: "Минимальная тревожность" },
    { max: 9, severity: "mild", label: "Лёгкая" },
    { max: 14, severity: "moderate", label: "Умеренная" },
    { max: 21, severity: "severe", label: "Тяжёлая" },
  ],
  crisisQuestionIndexes: [],
};

// ---------- MDQ (Mood Disorder Questionnaire) ----------
const mdqQ1Questions = [
  "Был ли период, когда Вы чувствовали себя необычно счастливыми или возбуждёнными, но не в себе?",
  "…настолько раздражительными, что кричали на людей или затевали ссоры?",
  "…более самоуверенными, чем обычно?",
  "…спали меньше обычного и не чувствовали усталости?",
  "…более разговорчивыми или говорили быстрее обычного?",
  "…с мыслями, быстро сменяющими друг друга?",
  "…легко отвлекались, переключаясь с одного на другое?",
  "…намного более энергичными и продуктивными?",
  "…более социально активными (звонили друзьям посреди ночи и т.п.)?",
  "…с обострённым интересом к сексу?",
  "…совершали необдуманные поступки, тратили много денег?",
  "…вели себя так, что это казалось необычным для Вас?",
  "…поступали так, что это вызывало проблемы у семьи/на работе?",
];
const mdqQ2Options = [
  { value: 0, label: "Проблем не было" },
  { value: 1, label: "Незначительные проблемы" },
  { value: 2, label: "Умеренные проблемы" },
  { value: 3, label: "Серьёзные проблемы" },
] as Prisma.InputJsonValue;
const mdqQuestions = [
  ...mdqQ1Questions,
  "Если Вы отмечали что-то из перечисленного: насколько это было проблемой для Вас или окружающих?",
  "Есть ли у Ваших кровных родственников биполярное расстройство (БАР)?",
];
// MDQ: индексы 0..12 — Q1 (yes=1). Индекс 13 — Q2 (проблема 0-3). Индекс 14 — Q3 (родственник).
// Положительный скрининг: ≥3 «да» в Q1 И Q2 ≥ 2 (умеренные/серьёзные проблемы).
// Q3 — информативно, не входит в критерий.
const mdqScoring = {
  mode: "composite" as const,
  matchMode: "all" as const,
  compositeScoreFrom: "sumAll" as const,
  conditions: [
    { type: "countAbove" as const, indexes: [0,1,2,3,4,5,6,7,8,9,10,11,12], threshold: 0, minCount: 3 },
    { type: "valueAbove" as const, indexes: [13], threshold: 2 },
  ],
  positiveSeverity: "positive",
  positiveLabel: "Скрининг положительный — стоит обсудить с врачом",
  negativeSeverity: "negative",
  negativeLabel: "Скрининг отрицательный",
  scaleLabel: "MDQ: скрининг БАР",
  crisisQuestionIndexes: [],
};

// ---------- ASRS (Adult ADHD Self-Report Scale, 6-item) ----------
const asrsOptions = [
  { value: 0, label: "Никогда" },
  { value: 1, label: "Редко" },
  { value: 2, label: "Иногда" },
  { value: 3, label: "Часто" },
  { value: 4, label: "Очень часто" },
] as Prisma.InputJsonValue;
const asrsQuestions = [
  "Допускаете невнимательность или ошибки из-за недостатка концентрации",
  "Трудно удерживать внимание при длинных задачах",
  "Не слушаете, когда к Вам обращаются напрямую",
  "Не доводите дела до конца (отвлекаетесь)",
  "Трудно организовать задачи и activities",
  "Избегаете задач, требующих длительного умственного усилия",
];
const asrsScoring = {
  mode: "threshold" as const,
  minValuePerItem: 2, // Иногда и выше
  minItemsMeetingThreshold: 4,
  positiveSeverity: "positive",
  positiveLabel: "Скрининг положительный — стоит обсудить с врачом",
  negativeSeverity: "negative",
  negativeLabel: "Скрининг отрицательный",
  scaleLabel: "ASRS-v1.1: скрининг СДВГ у взрослых",
  crisisQuestionIndexes: [],
};

// ---------- ConditionTag справочник ----------
const conditionTags = [
  {
    code: "depression",
    name: "Депрессивные состояния",
    description: "Периоды подавленности, потери интереса, упадка сил.",
    recommendedTestCodes: ["PHQ9"] as Prisma.InputJsonValue,
  },
  {
    code: "anxiety",
    name: "Тревожность",
    description: "Повышенная тревога, напряжение, беспокойство.",
    recommendedTestCodes: ["GAD7"] as Prisma.InputJsonValue,
  },
  {
    code: "bipolar",
    name: "Колебания настроения (БАР)",
    description: "Эпизоды подъёма и спада настроения, импульсивность.",
    recommendedTestCodes: ["MDQ", "PHQ9"] as Prisma.InputJsonValue,
  },
  {
    code: "adhd",
    name: "Внимание и концентрация (СДВГ)",
    description: "Трудности с фокусом, организацией, завершением задач.",
    recommendedTestCodes: ["ASRS"] as Prisma.InputJsonValue,
  },
  {
    code: "bpd",
    name: "Эмоциональная нестабильность (ПРЛ)",
    description: "Выраженные перепады настроения, чувствительность в отношениях.",
    recommendedTestCodes: ["PHQ9", "GAD7"] as Prisma.InputJsonValue,
  },
  {
    code: "sleep",
    name: "Сон и восстановление",
    description: "Качество сна, бодрость в течение дня.",
    recommendedTestCodes: ["PHQ9", "GAD7"] as Prisma.InputJsonValue,
  },
  {
    code: "general",
    name: "Общее самочувствие",
    description: "Базовый self-tracking без конкретной темы.",
    recommendedTestCodes: ["PHQ9", "GAD7"] as Prisma.InputJsonValue,
  },
];

async function upsertTest(
  code: string,
  name: string,
  description: string,
  periodicityDays: number,
  scoringRule: object,
  questions: { text: string; options: Prisma.InputJsonValue; isFreeText?: boolean }[]
) {
  const existing = await db.testDefinition.findUnique({ where: { code } });
  const data = {
    code,
    name,
    description,
    periodicityDays,
    category: "screening",
    version: existing ? existing.version + 1 : 1,
    scoringRuleJson: scoringRule as Prisma.InputJsonValue,
  };
  const def = existing
    ? await db.testDefinition.update({ where: { code }, data })
    : await db.testDefinition.create({ data });

  // Пересоздаём вопросы (простой подход для seed).
  await db.testQuestion.deleteMany({ where: { testDefinitionId: def.id } });
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    await db.testQuestion.create({
      data: {
        testDefinitionId: def.id,
        order: i,
        text: q.text,
        optionsJson: q.options,
        isFreeText: q.isFreeText ?? false,
      },
    });
  }
  console.log(`✓ ${code} — ${questions.length} вопросов`);
}

async function main() {
  console.log("Seeding MindTrack...");

  // ConditionTag
  for (const t of conditionTags) {
    await db.conditionTag.upsert({
      where: { code: t.code },
      update: t,
      create: t,
    });
  }
  console.log(`✓ ${conditionTags.length} ConditionTag`);

  await upsertTest(
    "PHQ9",
    "PHQ-9 — шкала депрессии",
    "Опросник пациентa о депрессивной симптоматике за последние 2 недели. Не диагноз.",
    14,
    phq9Scoring,
    phq9Questions.map((text) => ({ text, options: phq9Options }))
  );

  await upsertTest(
    "GAD7",
    "GAD-7 — шкала тревожности",
    "Опросник генерализованной тревожности за последние 2 недели. Не диагноз.",
    14,
    gad7Scoring,
    gad7Questions.map((text) => ({ text, options: gad7Options }))
  );

  await upsertTest(
    "MDQ",
    "MDQ — скрининг биполярного расстройства",
    "Опросник для скрининга биполярного спектра (жизненный анамнез). Не диагноз.",
    90,
    mdqScoring,
    mdqQuestions.map((text, i) => ({
      text,
      options: i < 13 ? YESNO : i === 13 ? mdqQ2Options : YESNO,
    }))
  );

  await upsertTest(
    "ASRS",
    "ASRS-v1.1 — скрининг СДВГ у взрослых",
    "Краткий скрининг синдрома дефицита внимания у взрослых (за 6 месяцев). Не диагноз.",
    90,
    asrsScoring,
    asrsQuestions.map((text) => ({ text, options: asrsOptions }))
  );

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
