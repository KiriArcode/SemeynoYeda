> **УСТАРЕЛО**: Этот документ описывает деплой на GitHub Pages. Проект перенесён на **Vercel**. Актуальные инструкции — в [README.md](README.md) и [SPEC.md](SPEC.md).

# Исправление ошибки деплоя

## Проблема

Ошибка при деплое:
```
Error: HttpError: Not Found
Error: Failed to create deployment (status: 404)
```

Это означает, что **GitHub Pages не включен** в настройках репозитория.

## Решение

### Шаг 1: Включите GitHub Pages

1. Откройте страницу настроек репозитория:
   ```
   https://github.com/KiriArcode/SemeynoYeda/settings/pages
   ```
   (замените `KiriArcode` на ваш username)

2. В разделе **"Build and deployment"**:
   - Выберите **"Source"** → **"GitHub Actions"**
   - Нажмите **"Save"**

### Шаг 2: Проверьте Environment

После включения GitHub Pages, GitHub автоматически создаст environment `github-pages`.

Если environment не появился:

1. Перейдите в **Settings** → **Environments**
2. Нажмите **"New environment"**
3. Введите имя: `github-pages`
4. Нажмите **"Configure environment"**
5. Не добавляйте никаких переменных или секретов
6. Нажмите **"Save protection rules"**

### Шаг 3: Повторите деплой

После включения GitHub Pages:

1. Сделайте небольшое изменение в коде (например, добавьте комментарий)
2. Закоммитьте и запушьте:
   ```bash
   git add .
   git commit -m "Trigger deployment"
   git push
   ```
3. Или просто перезапустите последний workflow:
   - Откройте Actions → выберите последний workflow
   - Нажмите "Re-run all jobs"

### Шаг 4: Проверка

После успешного деплоя:

- Приложение будет доступно по адресу:
  ```
  https://KiriArcode.github.io/SemeynoYeda/
  ```
- В разделе Settings → Pages вы увидите ссылку на деплой
- В Actions будет зелёная галочка у job "deploy"

## Альтернативное решение (если проблема сохраняется)

Если после включения GitHub Pages деплой всё ещё не работает:

1. Проверьте, что workflow файл находится по пути:
   ```
   .github/workflows/deploy.yml
   ```

2. Убедитесь, что в `vite.config.ts` указан правильный `base`:
   ```typescript
   base: '/SemeynoYeda/',  // должно совпадать с именем репозитория
   ```

3. Проверьте, что в `src/app/Router.tsx` указан правильный `basename`:
   ```typescript
   basename: '/SemeynoYeda',
   ```

4. Если репозиторий называется по-другому, обновите эти значения соответственно.
