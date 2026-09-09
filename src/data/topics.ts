import type { Topic } from "./types";

export const topics: Topic[] = [
  { id: "topic-anxiety", slug: "trevoga", title: "Тревога", description: "О беспокойстве, напряжении и способах наблюдать за ними.", status: "assessed" },
  { id: "topic-mood", slug: "nastroenie", title: "Настроение", description: "Материалы о подавленности, интересе и эмоциональных изменениях.", status: "assessed" },
  { id: "topic-attention", slug: "vnimanie", title: "Внимание", description: "Самонаблюдение за концентрацией и организацией задач.", status: "pending" },
  { id: "topic-sleep", slug: "son", title: "Сон и восстановление", description: "Наблюдение за сном, энергией и восстановлением.", status: "pending" },
];
