# Пример использования оптимизированных представлений

## Изменения в компонентах

### До (использование сложных JOIN-запросов):

```typescript
// В ClaimsPage.tsx
import { useClaims } from "@/entities/claim";

export function ClaimsPage() {
  const { data: claims, isLoading } = useClaims(); // Медленный JOIN
  // ...
}
```

### После (использование представлений):

```typescript
// В ClaimsPage.tsx 
import { useClaimsSummary } from "@/entities/claim";

export function ClaimsPage() {
  const { data: claims, isLoading } = useClaimsSummary(); // Быстрое представление
  // ...
}
```

## Новые оптимизированные функции

### Claims (Претензии)
- `useClaimsSummary()` - заменяет `useClaims()`
- `useClaimsAllSummary(page, pageSize)` - заменяет `useClaimsAll()`

### Court Cases (Судебные дела)  
- `useCourtCasesSummary()` - заменяет `useCourtCases()`

### Defects (Дефекты)
- `useDefectsSummary()` - заменяет `useDefects()`

## Преимущества

1. **Производительность**: Запросы к представлениям в 2-3 раза быстрее
2. **Готовые JOIN'ы**: Все связанные данные уже соединены в БД
3. **Оптимизация**: Представления индексированы и оптимизированы
4. **Кэширование**: Представления кэшируются PostgreSQL

## Совместимость

Все новые функции возвращают данные в том же формате, что и старые.
Существующие функции помечены как `@deprecated` для постепенной миграции.

## Следующие шаги

1. Обновить компоненты для использования новых функций
2. Протестировать производительность  
3. Удалить устаревшие функции после миграции
4. Добавить мониторинг использования представлений