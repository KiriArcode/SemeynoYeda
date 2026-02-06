# Инструкция по деплою

## Подготовка к деплою

1. Убедитесь, что все зависимости установлены:
   ```bash
   npm install
   ```

2. Проверьте сборку:
   ```bash
   npm run build
   ```

3. Проверьте, что папка `dist` создана и содержит собранные файлы.

## Деплой на GitHub Pages

Приложение автоматически деплоится на GitHub Pages при пуше в ветку `main` через GitHub Actions.

### Настройка GitHub Pages

**ВАЖНО:** GitHub Pages должен быть включен ДО первого деплоя!

1. Перейдите в настройки репозитория на GitHub:
   ```
   https://github.com/KiriArcode/SemeynoYeda/settings/pages
   ```
   (или замените `KiriArcode` на ваш username)

2. В разделе "Pages" → "Build and deployment":
   - **Source:** выберите "GitHub Actions"
   - Сохраните изменения

3. После включения GitHub Actions автоматически создаст environment `github-pages`

4. Если environment не создался автоматически:
   - Перейдите в Settings → Environments
   - Создайте новый environment с именем `github-pages`
   - Не нужно добавлять никаких переменных или секретов

### Ручной деплой

Если автоматический деплой не работает:

1. Соберите проект:
   ```bash
   npm run build
   ```

2. Используйте GitHub CLI или веб-интерфейс для загрузки папки `dist` в ветку `gh-pages`

## Настройка PWA

После деплоя:

1. Создайте иконки для PWA (192x192 и 512x512 пикселей)
2. Поместите их в `public/icons/`
3. Раскомментируйте конфигурацию VitePWA в `vite.config.ts`
4. Обновите пути к иконкам в манифесте

## Проверка деплоя

После деплоя проверьте:

- [ ] Приложение открывается по адресу `https://<username>.github.io/SemeynoYeda/`
- [ ] Все страницы работают корректно
- [ ] Навигация функционирует
- [ ] IndexedDB работает (проверьте в DevTools)

## Troubleshooting

### Проблемы с базовым путём

Если приложение не загружается, проверьте:
- `base` в `vite.config.ts` соответствует имени репозитория
- `basename` в `Router.tsx` соответствует `base`

### Проблемы с GitHub Actions

- Проверьте, что workflow файл находится в `.github/workflows/deploy.yml`
- Убедитесь, что у репозитория включены GitHub Pages и Actions
