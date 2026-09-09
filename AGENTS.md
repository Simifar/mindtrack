# Инструкции для разработки

- MindTrack — статический русскоязычный справочник без регистрации, аккаунтов,
  серверной БД и персонального серверного состояния.
- Справочный контент изменяйте только в `src/data`; React-компоненты не должны
  содержать факты каталога.
- Сохраняйте стабильные `id` и `slug`. Перед изменением URL обновляйте
  `PROJECT_REVIEW.md` и добавляйте redirect/совместимый маршрут.
- Запускайте `bun install --frozen-lockfile`, `bun run validate-content`,
  `bunx tsc --noEmit`, `bun run lint` и `bun test`.
- Для GitHub Pages используйте `bun run build:pages --base-path ... --site-url ...`
  и `bun run check:pages`. Не добавляйте второй Pages workflow.
