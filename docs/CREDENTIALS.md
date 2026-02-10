# Инструкция: получение кредов для SemeynoYeda

Для деплоя и интеграций нужны учётные записи и ключи перечисленных ниже сервисов. План: общий семейный аккаунт для Notebook LM и Google Drive; остальные инструменты — по списку ниже.

---

## 1. Vercel (деплой)

**Что нужно:** аккаунт Vercel и подключение репозитория. Переменные окружения: Neon (раздел 2), Supabase (раздел 3) и при необходимости Google (раздел 4).

### Шаги

1. Зайти на [vercel.com](https://vercel.com) и войти (через GitHub удобнее).
2. **New Project** → **Import Git Repository** → выбрать репозиторий SemeynoYeda.
3. Настроить сборку:
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Root Directory:** оставить пустым.
4. Переменные окружения добавить после создания проекта (Project → **Settings** → **Environment Variables**):
   - `DATABASE_URL` — из Neon (раздел 2).
   - `VITE_SUPABASE_URL` — из Supabase (раздел 3).
   - `VITE_SUPABASE_ANON_KEY` — из Supabase (раздел 3).

Дополнительные креды (например, для Google Drive) тоже задаются здесь, с префиксом `VITE_` только для тех, что должны быть доступны в браузере. Для Serverless API на Vercel нужна переменная **без** префикса `VITE_`: `DATABASE_URL` (см. раздел 2).

**Итог:** репозиторий подключён, сборка и деплой работают, env-переменные подставлены в билд.

---

## 2. Neon (PostgreSQL для API)

**Что нужно:** connection string к базе Neon. Его использует только бэкенд (Vercel Serverless Functions в `api/`), во фронтенд не попадает.

**Текущий проект SemeynoYeda:**
- **Organization:** `org-polished-dew-77895240`
- **Project:** `twilight-star-96642684`

### Шаги

1. Зайти в [Neon Console](https://console.neon.tech/), выбрать организацию и проект выше.
2. В дашборде проекта открыть **Connection details** (или **Dashboard** → ветка по умолчанию).
3. Скопировать **Connection string** (формат `postgresql://user:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require`).
4. Задать переменную окружения:
   - **Vercel:** Project → **Settings** → **Environment Variables** → добавить `DATABASE_URL` со значением connection string (отметить **Sensitive**).
   - **Локально:** в корне проекта в `.env` добавить строку `DATABASE_URL=postgresql://...` (тот же URL).

**Итог:** API (`api/_lib/db.ts`) подключается к Neon через `DATABASE_URL`; seed и все запросы к данным идут в эту БД.

---

## 3. Supabase (БД и авторизация)

> **Примечание:** Supabase в текущей реализации **не используется**. Основная БД — Neon PostgreSQL. Этот раздел сохранён на случай, если потребуется Supabase Auth в будущем.

**Что нужно:** URL проекта и anon (public) key для клиента. Service role key не использовать во фронтенде — только в Dashboard или Edge Functions для инвайтов и админ-операций.

### Шаги

1. Зайти на [supabase.com](https://supabase.com), войти (или зарегистрироваться).
2. **New Project**:
   - Organization (создать при необходимости).
   - Имя проекта, пароль БД (сохранить в надёжном месте), регион.
3. После создания перейти в **Project Settings** (иконка шестерёнки) → **API**:
   - **Project URL** — скопировать в `VITE_SUPABASE_URL` в Vercel и в `.env` локально.
   - **Project API keys** → **anon public** — скопировать в `VITE_SUPABASE_ANON_KEY`.
4. **Auth → Providers → Email:** включить Email; при желании отключить «Confirm email» для magic link.
5. **Auth → Providers:** отключить регистрацию по умолчанию (invite-only): в настройках проекта можно оставить только приглашения через **Auth → Users → Invite user** или через админ-скрипт с `supabase.auth.admin.inviteUserByEmail()`.

**Локальная разработка:** в корне проекта создать `.env` (и добавить в `.gitignore`, если ещё нет):

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Итог:** есть `VITE_SUPABASE_URL` и `VITE_SUPABASE_ANON_KEY` для Vercel и локального запуска.

---

## 4. Google Drive API (экспорт рецептов для Notebook LM)

**Что нужно:** OAuth 2.0 Client ID (тип «Web application») для доступа к Google Drive от имени пользователя (семейного аккаунта). Тогда кнопка «Выгрузить в Google Drive» в приложении сможет создавать/обновлять документы в папке «рецепты».

### Шаги

1. Зайти в [Google Cloud Console](https://console.cloud.google.com/).
2. Создать проект или выбрать существующий (например, «SemeynoYeda»).
3. **APIs & Services → Library** → найти **Google Drive API** → **Enable**.
4. **APIs & Services → OAuth consent screen**:
   - User Type: **External** (если приложение только для семьи, потом можно оставить в тестовом режиме).
   - Заполнить: App name, User support email, Developer contact.
   - **Scopes** → Add or Remove Scopes → добавить:
     - `https://www.googleapis.com/auth/drive.file` (создание/редактирование файлов, созданных приложением),
     - при необходимости `https://www.googleapis.com/auth/drive.appdata` (если нужна папка приложения).
   - **Test users** (в тестовом режиме): добавить email семейного аккаунта (и других пользователей, кто будет входить).
5. **APIs & Services → Credentials** → **Create Credentials** → **OAuth client ID**:
   - Application type: **Web application**.
   - Name: например «SemeynoYeda Web».
   - **Authorized JavaScript origins:**
     - для разработки: `http://localhost:5173` (или порт из `vite.config.ts`);
     - для продакшена: `https://ваш-домен.vercel.app` (и кастомный домен, если будет).
   - **Authorized redirect URIs:**
     - для разработки: `http://localhost:5173` (или страница, куда возвращает OAuth после входа);
     - для продакшена: `https://ваш-домен.vercel.app` (тот же путь, который обрабатывает callback).
   - Создать → скопировать **Client ID** и **Client Secret**.

6. В приложении и в Vercel задать (только то, что должно быть на клиенте):
   - `VITE_GOOGLE_CLIENT_ID` — Client ID из OAuth client.
   - Client Secret **не** выкладывать во фронтенд: если понадобится обмен code → token на бэкенде, использовать Edge Function или другой серверный слой с секретом.
   - **Что копировать:** в карточке OAuth 2.0 Client ID возьми значение **Client ID** (вид `xxxxx.apps.googleusercontent.com`), не Client Secret.
   - **Куда вписать:** в корневой файл `.env` строку `VITE_GOOGLE_CLIENT_ID=<скопированный Client ID>`; при деплое — ту же переменную в Vercel (Settings → Environment Variables).

**Итог:** есть Google Cloud проект с включённым Drive API и OAuth client; в `.env` и при деплое задан `VITE_GOOGLE_CLIENT_ID` (только Client ID); семейный аккаунт добавлен в Test users.

---

## 5. Notebook LM и общий семейный аккаунт Google

**Креды не нужны.** Notebook LM не даёт API; интеграция ручная через Google Drive.

**План использования:**

- Один общий семейный Google-аккаунт: используется и для Notebook LM, и для Google Drive.
- В SemeynoYeda кнопка «Выгрузить в Google Drive» (с кредом из раздела 3) создаёт/обновляет документы в папке «рецепты» в этом аккаунте.
- В [Notebook LM](https://notebooklm.google/) пользователь вручную добавляет источники: папку «рецепты» или отдельные документы с рецептами (в пределах лимита 30 источников).

Отдельные креды для Notebook LM получать не нужно — достаточно входить в тот же Google-аккаунт в браузере при работе с Notebook LM.

---

## 6. Сводка: что куда подставлять

| Сервис        | Где используется        | Переменные / креды |
|---------------|-------------------------|---------------------|
| Vercel        | Деплой, env для билда   | В Vercel: `DATABASE_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, при необходимости `VITE_GOOGLE_CLIENT_ID`, `VITE_API_URL` |
| Neon          | API (Serverless), БД    | `DATABASE_URL` — только на Vercel и в локальном `.env`, не во фронт |
| Supabase      | Фронт, синхронизация    | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (service role только на бэкенде/Dashboard) |
| Google Drive  | Экспорт в Drive         | `VITE_GOOGLE_CLIENT_ID`; Client Secret только на сервере (если будет OAuth callback на бэкенде) |
| Notebook LM   | Ручное добавление       | Креды не нужны, используется общий семейный Google-аккаунт |

---

## 7. Безопасность

- В репозиторий и во фронтенд не коммитить: `DATABASE_URL`, пароль БД Supabase, Service role key, Google Client Secret.
- В Vercel секреты задавать через **Environment Variables** (отметить Sensitive для секретов).
- Локальный `.env` должен быть в `.gitignore`.

После выполнения этой инструкции у вас будут все креды для настройки Vercel, Neon, Supabase и экспорта рецептов в Google Drive для использования с Notebook LM.
