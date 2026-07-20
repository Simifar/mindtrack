# MindTrack — Worklog

Проект: персональный self-tracker психического состояния (НЕ медицинское ПО).

## Архитектурные решения (главное)

- **БД**: SQLite (окружение sandbox не поддерживает PostgreSQL). Схема спроектирована так, что перенос на PostgreSQL/Neon тривиален: JSON-поля хранятся как String в SQLite, на PG станут `@db.JsonB`. Шифрование чувствительных полей — прикладной AES-256-GCM (в SQLite нет pgcrypto).
- **Аутентификация**: кастомный JWT-слой на `jose` + `bcryptjs` вместо NextAuth. Причина: NextAuth v4 имеет неопределённую совместимость с Next.js 16. Слой структурирован так, что замена на NextAuth/OAuth в будущем — точечная. Сессии — JWT в http-only cookie `mt_session`.
- **PDF**: `@react-pdf/renderer` (server-side, API-роут возвращает бинарный PDF). Обоснование: чистый программный PDF без headless-браунра, работает в serverless (Vercel), графики рисуются примитивами (Rect/Line/Text) — достаточно для медицинского отчёта.
- **Single-route**: согласно окружению, вся пользовательская поверхность рендерится на `/` (client-side view-routing через Zustand). API-роуты — стандартные `/api/*`.
- **Шифрование**: AES-256-GCM, ключ из `ENCRYPTION_KEY` (env). Шифруются `DiaryEntry.notes` и `TestResponse.answersJson`. `iv` + `tag` хранятся вместе с шифртекстом в одном поле.
- **Кризис-сценарий**: детекция ключевых фраз (суицид/самоповреждение) в notes и открытых ответах тестов → ненавязчивый блок с горячей линией. Без автоуведомлений третьим лицам.

## Структура Prisma-схемы

Сущности: User, ConditionTag, UserConditionTag, TestDefinition, TestQuestion, TestResponse, DiaryEntry, Medication, MedicationLog, ExportLog. Каскадное удаление по userId (право на забвение).

---
Task ID: 1
Agent: main (Z.ai Code)
Task: Установить пакеты и спроектировать структуру проекта + Prisma-схему

Work Log:
- Изучил существующий scaffold (Next.js 16, shadcn new-york, SQLite, Prisma).
- Установил bcryptjs, jose, @react-pdf/renderer, @types/bcryptjs.
- Спроектировал Prisma-схему под SQLite с заделом под PostgreSQL.
- Зафиксировал архитектурные решения выше.

Stage Summary:
- Пакеты готовы. Далее: schema.prisma → db:push → lib-слой → API → seed → frontend.

---
Task ID: 4-7
Agent: main (Z.ai Code)
Task: Реализовать весь backend (API + seed) и frontend (вью + shell)

Work Log:
- API: auth (register/login/logout/me), consent, onboarding (get/complete).
- API: tests (definitions, [id], submit с серверным подсчётом, history с расшифровкой).
- API: dashboard (moodSeries, latestTests, reminders, stats), diary (list/get/upsert с crisis-детекцией).
- API: export (PDF через @react-pdf/renderer + share-link с TTL), account (delete с подтверждением, export-data JSON).
- Seed: 7 ConditionTag + 4 теста (PHQ-9, GAD-7, MDQ, ASRS) с generic questions и scoringRuleJson.
- test-scoring.ts расширен режимом composite (для MDQ).
- Frontend: api-client, Zustand store, app-shell (sidebar+bottom-nav), app-router (определяет ?share=token).
- Frontend вью: auth (tabs), consent, onboarding (выбор тегов), dashboard (график+статы+напоминания), tests (library), test-runner (пошаговый 1 вопрос/экран), diary (слайдеры+история), charts (multi-metric), export (PDF+share), settings (privacy), shared-report (публичный).
- crisis-banner (ненавязчивый блок с горячими линиями), disclaimer-footer (обязательный дисклеймер).
- Layout: lang=ru, шрифт с кириллицей.

Stage Summary:
- Lint чист. API smoke-тест пройден: register→consent→onboarding→diary→PHQ-9 submit (score 18→"Умеренно тяжёлая", crisis-триггер)→PDF (валидный 6468 байт)→share-link. Все эндпоинты 200.
- Проблема окружения: dev-сервер умирает между вызовами bash (sandbox чистит процессы). Решение: стартовать сервер и браузер в параллельных tool-calls.

---
Task ID: 8-11
Agent: main (Z.ai Code)
Task: Frontend-верификация через Agent Browser

Work Log:
- Найден и исправлен критический баг: api.dashboard был функцией, а вызывался как api.dashboard.get() → TypeError на дашборде. Сделан объектом {get}.
- Consent-чекбокс: заменён <label> на <div role=checkbox onClick> — теперь весь блок кликабелен (Radix Checkbox не реагировал на синтетические клики).
- Test-runner: Radix RadioGroup заменён на button[role=radio] с собственным состоянием — теперь выбор ответа работает под автоматизацией и реальными кликами.
- Agent Browser e2e (всё проверено): register→consent→onboarding→dashboard(с данными: 3 дня, ср.настроение 5)→diary(сохранение)→test-runner(PHQ-9/ASRS: выбор radio, навигация, экран результата с интерпретацией)→charts→export→settings.
- Публичный share-отчёт (/?share=token, без авторизации): рендерится со статами, таблицей тестов, дисклеймером, кнопкой PDF.
- Mobile viewport 390x844: bottom-nav присутствует, sticky footer с дисклеймером "не медицинское ПО" и горячей линией 8-800-2000-122.
- Console errors: пусто на всех экранах.

Stage Summary:
- MVP полностью рабочий и проверенный в браузере. Lint чист.
- Кризис-детекция и PDF-генерация проверены через curl (PHQ-9 q9>0→crisisDetected, PDF валиден).
