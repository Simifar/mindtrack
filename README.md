# MindTrack

MindTrack — русскоязычный статический справочник о самонаблюдении, настроении,
тревоге, сне и внимании. Проект не требует регистрации, не хранит персональные
данные и не является медицинским ПО.

## Запуск

```bash
bun install --frozen-lockfile
bun dev
```

## Проверки и сборка

```bash
bun run validate-content
bunx tsc --noEmit
bun run lint
bun test
bun run build
bun run check-bundle
bun run build:pages --base-path /MindTrack --site-url https://example.github.io/MindTrack/
bun run check:pages
```

Подробности модели данных и публикации находятся в `docs/`.
