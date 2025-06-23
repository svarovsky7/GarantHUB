# GarantHUB

Инструкция по запуску и настройке проекта.

## Запуск проекта

1. Установите зависимости:
   ```bash
   npm install
   ```
2. Запустите сервер разработки:
   ```bash
   npm run dev
   ```
   По умолчанию приложение будет доступно на `http://localhost:3000`.

## Переменные окружения

Перед запуском создайте файл `.env` в корне репозитория и добавьте в него параметры:

```
VITE_SUPABASE_URL=<URL вашего проекта Supabase>
VITE_SUPABASE_ANON_KEY=<Anon key вашего проекта>
VITE_ATTACH_BUCKET=<название корзины для вложений>
```

Для совместимости можно использовать переменные с префиксом `REACT_APP_`.

## Структура базы данных

Описание БД: [database_structure.json](database_structure.json).


## Индексы базы данных

Индексы: [db_indexes_summary.md](db_indexes_summary.md).


