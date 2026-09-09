# Публикация на GitHub Pages

1. В настройках репозитория включите Pages через **GitHub Actions**.
2. Проверьте, что `NEXT_PUBLIC_SITE_URL` соответствует адресу Pages, включая
   путь репозитория. Для `https://user.github.io/MindTrack/` используйте
   `--base-path /MindTrack`.
3. Локально выполните:

```bash
bun install --frozen-lockfile
bun run build:pages --base-path /MindTrack --site-url https://user.github.io/MindTrack/
bun run check:pages
bun run preview:pages
```

Workflow `pages.yml` публикует только папку `out`. Серверные файлы в неё не
попадают; избранное хранится локально в браузере.
