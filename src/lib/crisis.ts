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

/** Контакт кризисной поддержки (Российские линии). Меняется под локаль пользователя. */
export const CRISIS_RESOURCES = {
  title: "Если вам тяжело — вы не одни",
  body: "Если у вас есть мысли о причинении себе вреда, пожалуйста, обратитесь за поддержкой прямо сейчас. Это анонимно и бесплатно.",
  lines: [
    {
      name: "Телефон доверия (РФ, круглосуточно)",
      phone: "8-800-2000-122",
      href: "tel:88002000122",
    },
    {
      name: "Московская служба психологической помощи",
      phone: "+7 (495) 051",
      href: "tel:+7495051",
    },
    {
      name: "Экстренные службы",
      phone: "112",
      href: "tel:112",
    },
  ],
};
