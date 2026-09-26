/**
 * A small on-device phrase prompt. This is not a risk assessment and can miss
 * indirect wording or match text without its context; the Help page stays available.
 */
const CRISIS_PATTERNS: RegExp[] = [
  /(?:^|[^\p{L}])я\s+не\s+хочу\s+жить(?:$|[^\p{L}])/iu,
  /(?:^|[^\p{L}])я\s+хочу\s+(?:умереть|покончить\s+с\s+собой|убить\s+себя)(?:$|[^\p{L}])/iu,
  /(?:^|[^\p{L}])я\s+(?:думаю|размышляю)\s+о\s+(?:том,?\s+чтобы\s+)?(?:умереть|покончить\s+с\s+собой|убить\s+себя)(?:$|[^\p{L}])/iu,
  /(?:^|[^\p{L}])я\s+(?:планирую|собираюсь)\s+(?:покончить\s+с\s+собой|убить\s+себя|причинить\s+себе\s+вред)(?:$|[^\p{L}])/iu,
  /(?:^|[^\p{L}])я\s+(?:могу|боюсь,?\s+что\s+могу)\s+(?:причинить|сделать)\s+себе\s+вред(?:$|[^\p{L}])/iu,
  /(?:^|[^\p{L}])я\s+(?:причиняю|причинил(?:а)?)\s+себе\s+вред(?:$|[^\p{L}])/iu,
  /(?:^|[^\p{L}])я\s+(?:режу|резал(?:а)?)\s+себя(?:$|[^\p{L}])/iu,
  /(?:^|[^\p{L}])я\s+(?:хочу|планирую|собираюсь)\s+(?:проглотить\s+таблетки|выброситься|повеситься)(?:$|[^\p{L}])/iu,
  /\b(?:i\s+)?(?:want\s+to|plan\s+to)\s+(?:kill\s+myself|end\s+my\s+life)\b/i,
  /\b(?:i\s+)?(?:might|may)\s+(?:hurt|harm)\s+myself\b/i,
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

/** Shared prompt policy. Boolean inputs are explicit screening answers; text matching is approximate. */
export function getCrisisPolicy(source: CrisisSource, input: string | boolean | null | undefined): CrisisPolicy {
  const detection = typeof input === "boolean" ? { detected: input, matched: [] } : detectCrisis(input);
  return { ...detection, source, shouldOpenDialog: detection.detected };
}

/** Контакт кризисной поддержки (Российские линии). Меняется под локаль пользователя. */
export const CRISIS_RESOURCES = {
  title: "Если вам тяжело — вы не одни",
  body: "MindTrack не оценивает риск. Если опасность непосредственная — звоните 112. Если вы можете, попросите человека, которому доверяете, побыть рядом и обратитесь за поддержкой.",
  lines: [
    {
      name: "Экстренные службы",
      detail: "Россия · непосредственная опасность",
      phone: "112",
      href: "tel:112",
      source: "МЧС России: https://mchs.gov.ru/deyatelnost/bezopasnost-grazhdan/kak-pravilno-vyzvat-skoruyu_5",
      checkedAt: "2026-09-26",
    },
    {
      name: "Детский телефон доверия",
      detail: "Россия · для детей, подростков и родителей · бесплатно и круглосуточно",
      phone: "8-800-2000-122",
      href: "tel:88002000122",
      source: "Росдетство: https://deti.gov.ru/Press-Centr/region-news/22348",
      checkedAt: "2026-09-26",
    },
    {
      name: "Детский телефон доверия — короткий номер",
      detail: "Россия · для детей, подростков и родителей · бесплатно и круглосуточно",
      phone: "124",
      href: "tel:124",
      source: "Росдетство: https://deti.gov.ru/Press-Centr/region-news/22348",
      checkedAt: "2026-09-26",
    },
    {
      name: "Московская служба психологической помощи",
      detail: "Москва · городская служба",
      phone: "+7 (495) 051",
      href: "tel:+7495051",
      source: "МСППН: https://msph.ru/8-uslugi",
      checkedAt: "2026-09-26",
    },
  ],
};
