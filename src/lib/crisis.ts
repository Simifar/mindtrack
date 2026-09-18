/**
 * Детекция кризисных формулировок (суицидальные мысли / самоповреждение).
 * НЕ ставит диагноз и НЕ уведомляет третьих лиц. Только показывает блок поддержки.
 *
 * Список ключевых фраз намеренно консервативный, чтобы минимизировать ложные срабатывания,
 * но поймать явные формулировки.
 */
const CRISIS_PATTERNS: RegExp[] = [
  /хочу\s+(умереть|покончить|убить\s+себя)/i,
  /покончить\s+с\s+собой/i,
  /суицид/i,
  /самоубийств/i,
  /не\s+хочу\s+жить/i,
  /надоела\s+жизнь/i,
  /причин(ю|ить)\s+(себе|себя)\s+вред/i,
  /режу\s+себя/i,
  /порез(ы|ов)\s+на\s+(руках|венах|теле)/i,
  /мысли\s+(о\s+смерти|убить\s+себя|самоубийстве)/i,
  /план\s+(убить|покончить)/i,
  /проглочу\s+таблетки/i,
  /выброшусь/i,
  /повешусь/i,
  /no\s+reason\s+to\s+live/i,
  /kill\s+myself/i,
  /end\s+my\s+life/i,
  /suicid/i,
  /self[- ]?harm/i,
  /cut\s+myself/i,
];

export interface CrisisDetectionResult {
  detected: boolean;
  matched: string[];
}

export type CrisisSource = "screening" | "diary" | "visit";

export interface CrisisPolicy extends CrisisDetectionResult {
  source: CrisisSource;
  shouldOpenDialog: boolean;
}

export function detectCrisis(text: string | null | undefined): CrisisDetectionResult {
  if (!text) return { detected: false, matched: [] };
  const matched: string[] = [];
  for (const pattern of CRISIS_PATTERNS) {
    if (pattern.test(text)) {
      matched.push(pattern.source);
    }
  }
  return { detected: matched.length > 0, matched };
}

/** Единая policy-точка для всех форм, которые могут показать кризисный dialog. */
export function getCrisisPolicy(source: CrisisSource, input: string | boolean | null | undefined): CrisisPolicy {
  const detection = typeof input === "boolean" ? { detected: input, matched: [] } : detectCrisis(input);
  return { ...detection, source, shouldOpenDialog: detection.detected };
}

/** Контакт кризисной поддержки (Российские линии). Меняется под локаль пользователя. */
export const CRISIS_RESOURCES = {
  title: "Если вам тяжело — вы не одни",
  body: "Это не оценка риска и не диагноз. Если опасность непосредственная — звоните 112. Если вы можете, оставайтесь рядом с человеком, которому доверяете, и обратитесь за поддержкой прямо сейчас.",
  lines: [
    {
      name: "Экстренные службы",
      detail: "Россия · непосредственная опасность",
      phone: "112",
      href: "tel:112",
      source: "Единый номер экстренных служб РФ",
      checkedAt: "2026-09-18",
    },
    {
      name: "Детский телефон доверия",
      detail: "РФ · для детей, подростков и родителей · круглосуточно",
      phone: "8-800-2000-122",
      href: "tel:88002000122",
      source: "Росдетство: https://deti.gov.ru/Press-Centr/region-news/22348",
      checkedAt: "2026-09-18",
    },
    {
      name: "Московская служба психологической помощи",
      detail: "Москва · городская служба",
      phone: "+7 (495) 051",
      href: "tel:+7495051",
      source: "МСППН: https://msph.ru/",
      checkedAt: "2026-09-18",
    },
  ],
};
