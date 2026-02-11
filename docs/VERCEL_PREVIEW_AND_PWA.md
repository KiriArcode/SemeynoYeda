# Vercel Preview и PWA (manifest 401)

## Проблема

На **preview-деплоях** Vercel (PR, ветки) в консоли браузера могут появляться ошибки:

```
GET https://...vercel.app/manifest.webmanifest 401 (Unauthorized)
Manifest fetch from https://...vercel.app/manifest.webmanifest failed, code 401
```

## Причина

**Vercel Deployment Protection** (защита превью): если в настройках проекта включена авторизация для preview (Vercel Authentication, Password Protection и т.п.), все запросы к preview-URL без куки/токена получают 401. Запрос манифеста идёт от браузера без учёта этой авторизации, поэтому возвращается 401.

На **production**-деплое (например `semeyno-yeda.vercel.app`) манифест отдаётся нормально, если защита не включена для production.

## Решение

1. **Отключить защиту для preview** (если превью должны быть публичными):
   - Vercel Dashboard → проект → Settings → Deployment Protection
   - Для "Preview Deployments" выключить Vercel Authentication / Password Protection или добавить исключения по необходимости.

2. **Или не использовать preview-URL для проверки PWA**: тестировать установку и manifest на production-URL или локально (`npm run build && npm run preview`).

## Конфигурация в проекте

- `manifest.webmanifest` генерируется плагином `vite-plugin-pwa` при сборке и лежит в корне билда.
- В `vercel.json` путь `manifest.webmanifest` исключён из SPA rewrite, поэтому отдаётся как статический файл. Ошибка 401 связана только с политикой доступа Vercel к preview, а не с маршрутизацией.
