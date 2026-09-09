"use client";

import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";

const STORAGE_KEY = "mindtrack:last-checkin";

type FieldKey = "feeling" | "location" | "duration" | "intensity" | "trigger" | "need";

type FormState = Record<FieldKey, string>;

type CheckinResult = {
  title: string;
  summary: string;
  suggestions: string[];
  caution: string;
};

const initialState: FormState = {
  feeling: "",
  location: "",
  duration: "",
  intensity: "",
  trigger: "",
  need: "",
};

const steps = [
  {
    key: "feeling" as const,
    title: "Что ты сейчас замечаешь?",
    description: "Выбери то, что кажется ближе всего к твоему состоянию.",
    options: [
      "Напряжение и внутреннее ожидание",
      "Сильная усталость или истощение",
      "Пониженное настроение или пустота",
      "Раздражение и быстрое утомление",
      "Потеря ясности и сосредоточения",
      "Чувство одиночества или отдалённости",
    ],
  },
  {
    key: "location" as const,
    title: "Где это ощущается: в мыслях, теле или поведении?",
    description: "Иногда состояние читается не только в эмоции, но и в привычках, теле, реакции.",
    options: [
      "В мыслях и переживаниях",
      "В теле: напряжение/тяжесть/дрожь",
      "В поведении: избегание, раздражение, замирание",
      "Сразу во всём вместе",
    ],
  },
  {
    key: "duration" as const,
    title: "Как давно это происходит?",
    description: "Это помогает понять, насколько это уже стало регулярным.",
    options: [
      "Несколько минут",
      "В течение дня",
      "Несколько дней",
      "Недели и дольше",
    ],
  },
  {
    key: "intensity" as const,
    title: "Насколько сильно это мешает прямо сейчас?",
    description: "Важно не искать диагноз, а понять, нужна ли поддержка в ближайший период.",
    options: ["Лёгко — можно справиться самому", "Средне — хочется замедлиться", "Сильно — сложно концентрироваться", "Очень сильно — нужна поддержка"],
  },
  {
    key: "trigger" as const,
    title: "Что могло повлиять?",
    description: "Может быть нагрузка, тревога, конфликт, усталость, сон, одиночество, события в жизни.",
    options: [
      "Перегрузка и усталость",
      "Тревога и напряжение",
      "Конфликт или отношение с людьми",
      "Проблемы со сном или восстановлением",
      "Не знаю / не могу определить",
    ],
  },
  {
    key: "need" as const,
    title: "Что тебе сейчас нужнее?",
    description: "Это подскажет, куда идти дальше: понимать, успокаиваться, действовать или просить помощи.",
    options: [
      "Понять, что со мной происходит",
      "Успокоиться и снизить напряжение",
      "Начать действовать шаг за шагом",
      "Попросить поддержки и помощи",
    ],
  },
];

function buildCheckinResult(state: FormState): CheckinResult {
  const feeling = state.feeling || "есть внутренний дискомфорт";
  const need = state.need || "сделать шаг к восстановлению";
  const feelingText = feeling.toLowerCase();
  const needText = need.toLowerCase();

  if (feelingText.includes("напряжение") || needText.includes("успокоиться")) {
    return {
      title: "Вероятно, есть тревожное напряжение",
      summary: "Ты замечаешь нарастающее внутреннее напряжение, которое трудно назвать сразу. Это не диагноз, а сигнал, что сейчас стоит замедлиться и понять, что именно усиливает состояние.",
      suggestions: [
        "Сделать 2–3 минуты заземления: назвать 5 вещей вокруг, почувствовать опору ног и опустить плечи.",
        "Проверить, есть ли перегрузка, нехватка сна или слишком много стимулов за короткое время.",
        "Вместо «почему я так реагирую?» начать с более точного вопроса: «Что сейчас ощущается и что усиливает?»",
      ],
      caution: "Если тревога становится очень сильной, трудно дышать, есть мысли о немедленной опасности или невозможность успокоиться — важно обратиться за поддержкой.",
    };
  }

  if (feelingText.includes("усталость") || needText.includes("действовать")) {
    return {
      title: "Скорее всего, это перегрузка или истощение",
      summary: "Похоже, ресурсы снижены, а задача требует больше, чем обычно. В таком состоянии сильнее заметны раздражение, трудность с выбором и ощущение пустоты.",
      suggestions: [
        "Сократить список дел до 1–3 обязательных шагов.",
        "Сделать короткий перерыв и проверить воду, еду и сон за последние 24–48 часов.",
        "Разделить задачу на маленькие шаги, чтобы снизить ощущение давления.",
      ],
      caution: "Если состояние длится несколько дней и мешает жизни, полезно обсудить это с врачом или психологом.",
    };
  }

  if (feelingText.includes("пониженное настроение") || needText.includes("понять")) {
    return {
      title: "Возможна подавленность или эмоциональная тяжесть",
      summary: "Сейчас больше заметны пустота, снижение интереса, тяжёлые мысли или невозможность вовлечься в привычное. Это может быть сигналом, что ресурсы не восстанавливаются.",
      suggestions: [
        "Отделить факт от мысли: «что случилось» и «что я о чём-то думаю сейчас» — это разные вещи.",
        "Проверить, нет ли хронической перегрузки, потери, одиночества или сильного стресса.",
        "Подумать, что сейчас поддерживает: общение, движение, сон, люди, ритуал, простая задача.",
      ],
      caution: "Если состояние не проходит, ухудшается или есть мысли о самоповреждении, нужна срочная помощь и поддержка специалиста.",
    };
  }

  if (feelingText.includes("одиночества") || needText.includes("помощи")) {
    return {
      title: "Похоже, сейчас нужна поддержка и возможность быть услышанным",
      summary: "Состояние может усиливаться от ощущения отдалённости, нехватки контакта или невозможности рассказать о своём переживании. Это не слабость, а важный сигнал о потребности.",
      suggestions: [
        "Написать одному человеку короткое сообщение: «Мне сейчас тяжело, мне нужна поддержка».",
        "Попробовать выбрать безопасный, понятный формат общения: голосом, текстом или разговором в спокойной обстановке.",
        "Проверить, есть ли безопасные источники поддержки: близкий, родственник, психолог, кризисная линия.",
      ],
      caution: "Если чувство изоляции сопровождается невыносимой тревогой, угрозой или невозможностью справиться, важно попросить вокруг помощи немедленно.",
    };
  }

  return {
    title: "Сейчас важно не навешивать ярлык, а замедлиться",
    summary: `Ты описал ${feeling}, и это может быть сигналом о том, что сейчас нужна мягкая поддержка и точное наблюдение. Важно не ставить себе диагноз автоматически, а посмотреть, что помогает именно тебе.`,
    suggestions: [
      "Назвать, в чём именно сейчас дискомфорт: в теле, мыслях, ритме жизни или отношениях.",
      "Выбрать одну опору на ближайшие 20 минут: дыхание, отдых, разговор, шаги или помощь.",
      "Оставить вопрос «что со мной?» на время, вместо него задавать вопрос «что сейчас помогает?»",
    ],
    caution: "Если есть риск для жизни, опасность, сильная дезориентация или невыносимое состояние — срочно обращайтесь за помощью.",
  };
}

export function CheckInFlow() {
  const [stepIndex, setStepIndex] = useState(0);
  const [form, setForm] = useState<FormState>(initialState);
  const [result, setResult] = useState<CheckinResult | null>(() => {
    if (typeof window === "undefined") return null;

    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    try {
      const parsed = JSON.parse(stored) as CheckinResult;
      return parsed?.title ? parsed : null;
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
      return null;
    }
  });

  const currentStep = steps[stepIndex];
  const progress = useMemo(() => ((stepIndex + 1) / steps.length) * 100, [stepIndex]);

  function updateField(field: FieldKey, value: string) {
    setForm((previous) => ({ ...previous, [field]: value }));
  }

  function handleNext() {
    if (stepIndex < steps.length - 1) {
      setStepIndex((previous) => previous + 1);
      return;
    }

    const nextResult = buildCheckinResult(form);
    setResult(nextResult);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextResult));
  }

  function resetFlow() {
    setForm(initialState);
    setStepIndex(0);
    setResult(null);
    window.localStorage.removeItem(STORAGE_KEY);
  }

  if (result) {
    return (
      <div className="checkin-result"> 
        <div className="notice success-notice">
          <Sparkles size={18} aria-hidden="true" />
          <div>
            <strong>{result.title}</strong>
            <p>{result.summary}</p>
          </div>
        </div>

        <div className="result-actions">
          <h3>Что можно попробовать прямо сейчас</h3>
          <ul>
            {result.suggestions.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <div className="result-warning">
          <strong>Когда важно попросить помощи</strong>
          <p>{result.caution}</p>
        </div>

        <div className="button-row">
          <button className="button button-primary" type="button" onClick={resetFlow}>Пройти ещё раз</button>
          <Link className="button button-secondary" href="/help">
            К справке по помощи <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="checkin-panel">
      <div className="checkin-progress" aria-label="Прогресс опроса">
        <span style={{ width: `${progress}%` }} />
      </div>
      <p className="eyebrow">Самонаблюдение</p>
      <h2>{currentStep.title}</h2>
      <p className="lead narrow">{currentStep.description}</p>

      <div className="choice-grid">
        {currentStep.options.map((option) => {
          const selected = form[currentStep.key] === option;
          return (
            <button
              key={option}
              type="button"
              className={`choice-button ${selected ? "is-selected" : ""}`}
              onClick={() => updateField(currentStep.key, option)}
            >
              {option}
            </button>
          );
        })}
      </div>

      <div className="button-row">
        <button
          className="button button-primary"
          type="button"
          onClick={handleNext}
          disabled={!form[currentStep.key]}
        >
          {stepIndex === steps.length - 1 ? "Посмотреть результат" : "Дальше"}
        </button>
      </div>
    </div>
  );
}
