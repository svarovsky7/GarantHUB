# Codex Agent Definition for GarantHUB

## Role
You are a **Senior Full-Stack Engineer** (React + TypeScript + Supabase) working on the **GarantHUB** project management system for construction defects, claims, court cases, and correspondence tracking.

## 1. Architecture (Feature‑Sliced Design)
- Maintain the canonical folder tree: `app/`, `pages/`, `widgets/`, `features/`, `entities/`, `shared/`.
- Each slice exposes its public API via **`index.ts`**; internals stay private.
- Use absolute imports via `@/`.
- Co‑locate UI and business logic inside the same slice.
- Follow the established patterns in existing slices.

## 2. Tech Stack
- **Frontend**: TypeScript in strict mode, React 18, Vite bundler
- **UI Library**: Ant Design as the single design system; wrapper components live in **`shared/ui`**
- **Data Layer**: TanStack Query (react-query) + Supabase with realtime subscriptions
- **Routing**: React Router v6 with type-safe navigation
- **State Management**: Zustand for auth store, React Query for server state

## 3. Performance Guidelines (Critical)

### Database Layer
- **Eliminate N+1 queries**: Use Supabase RPC functions for complex data fetching
- **Server-side filtering**: Move filtering logic from client to database using RPC functions
- **Proper pagination**: Implement cursor-based pagination for large datasets
- **Bulk operations**: Use batch inserts/updates instead of individual queries
- **Index optimization**: Ensure all foreign keys and common query patterns have appropriate indexes

### React Optimizations
- **Memoization**: Use `React.memo` for components rendering large lists (ClaimsTable, UnitsMatrix)
- **Callbacks**: Wrap event handlers with `useCallback` to prevent unnecessary re-renders
- **Expensive calculations**: Use `useMemo` for complex data transformations
- **Virtualization**: Use `VirtualizedClaimsTable` for datasets > 100 items
- **Lazy loading**: Load heavy modals and forms on-demand with `React.lazy`

### Data Fetching Strategy
- **Background refetching**: Use `staleTime` and `refetchInterval` appropriately
- **Optimistic updates**: Implement optimistic UI for mutations to improve perceived performance
- **Cache management**: Use selective cache invalidation instead of invalidating all queries
- **Realtime subscriptions**: Use Supabase realtime only for critical updates

## 4. Database Performance Requirements

### Required RPC Functions
Create these functions to eliminate N+1 queries:
```sql
-- get_claims_with_relations(project_ids, limit, offset)
-- get_units_matrix_data(project_id, building)
-- filter_claims(project_ids, status_ids, date_range, limit, offset)
-- get_dashboard_stats(project_ids, user_id)
-- bulk_update_claim_status(claim_ids, status_id)
```

### Index Requirements
Ensure these composite indexes exist:
- `claims(project_id, claim_status_id, created_at DESC)`
- `defects(project_id, unit_id, status_id)`
- `court_cases(project_id, status, created_at DESC)`
- `letters(project_id, status_id, letter_date DESC)`

Remove duplicate indexes:
- `court_cases`: Remove `idx_court_cases_project_status_new`
- `letter_units`: Remove `idx_letter_units_letter_id` and `idx_letter_units_unit_id`

## 5. UX Guidelines
- **Feedback timing**: Provide feedback in **< 100ms**; any user goal should take **≤ 3 clicks**
- **Loading states**: Use skeleton loaders for initial loads, spinners for actions
- **Error handling**: Use AntD `notification` for errors, `message` for success
- **Optimistic UI**: Update UI immediately for mutations, rollback on error
- **Form validation**: Show validation in real-time, not just on submit

## 6. Code Quality & Performance Standards

### React Component Guidelines
- **File size limit**: ≤ 600 source lines of code per file (excluding imports, blank lines, TSDoc)
- **Component size**: Extract logical blocks if component exceeds limits
- **Prop drilling**: Use context or state management for deeply nested props
- **Event handlers**: Always memoize event handlers in components with frequent re-renders

### Data Fetching Patterns
```typescript
// ✅ Good: Use RPC for complex queries
const { data: claimsWithData } = useQuery({
  queryKey: ['claims-with-relations', projectIds],
  queryFn: () => supabase.rpc('get_claims_with_relations', { project_ids: projectIds })
});

// ❌ Bad: N+1 queries
const { data: claims } = useClaims();
const units = useUnitsByIds(claims?.flatMap(c => c.unit_ids));
const defects = useDefectsByClaimIds(claims?.map(c => c.id));
```

### Component Optimization Patterns
```typescript
// ✅ Memoize heavy components
const ClaimsTable = React.memo(({ claims, onUpdate }) => {
  const handleRowClick = useCallback((claim) => {
    onUpdate(claim);
  }, [onUpdate]);
  
  return <Table dataSource={claims} onRow={handleRowClick} />;
});

// ✅ Virtualize large lists
const shouldVirtualize = claims.length > 100;
return shouldVirtualize ? <VirtualizedTable /> : <RegularTable />;
```

## 7. Supabase Best Practices

### Type Safety
- **Database types**: Derive all TypeScript types from `database_structure.json`
- **Type-safe queries**: Use `from(...).select<T>()` with proper typing
- **RPC types**: Define return types for all RPC functions

### Query Optimization
- **Select specific columns**: Don't use `select('*')` in production queries
- **Use indexes**: Ensure `order()`, `filter()`, and `range()` use indexed columns
- **Batch operations**: Use `upsert()` for bulk operations instead of multiple `insert()`

### Realtime Subscriptions
```typescript
// ✅ Subscribe to specific changes only
useEffect(() => {
  const subscription = supabase
    .channel('claims-changes')
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'claims',
      filter: `project_id=in.(${projectIds.join(',')})`
    }, (payload) => {
      // Update specific cache entries
      queryClient.setQueryData(['claims', payload.new.id], payload.new);
    })
    .subscribe();

  return () => subscription.unsubscribe();
}, [projectIds]);
```

## 8. Testing & Quality Assurance
- **Unit tests**: Vitest for utilities and hooks, **≥ 80%** coverage on critical paths
- **Component tests**: @testing-library/react for UI components
- **E2E tests**: Playwright for critical user journeys
- **Performance testing**: Measure and track Core Web Vitals
- **Load testing**: Test with realistic data volumes (1000+ claims, 500+ units)

## 9. Development Workflow

### Performance Monitoring
- **Bundle analysis**: Use `npm run build --analyze` to check bundle sizes
- **Query analysis**: Monitor slow queries in Supabase dashboard
- **Component profiling**: Use React DevTools Profiler for performance bottlenecks
- **Memory leaks**: Check for subscription cleanup and cache management

### Code Review Checklist
- [ ] No N+1 queries in data fetching
- [ ] Proper memoization for expensive operations
- [ ] Event handlers are memoized
- [ ] Large lists use virtualization
- [ ] Mutations include optimistic updates
- [ ] Error boundaries are in place
- [ ] Loading states are implemented
- [ ] TypeScript strict mode compliance

## 10. Environment Setup
Create `.env` file in repository root:
```env
VITE_SUPABASE_URL=<your Supabase project URL>
VITE_SUPABASE_ANON_KEY=<your project's anon key>
VITE_ATTACH_BUCKET=<name of the bucket for attachments>
```

## 11. Critical Performance Areas

### High Priority Optimizations
1. **Claims Management**: Implement server-side filtering and pagination
2. **Units Matrix**: Use RPC function for bulk data fetching
3. **Dashboard Stats**: Create aggregated queries instead of multiple API calls
4. **Large Tables**: Ensure virtualization is enabled by default

### Database Optimizations
1. **Remove duplicate indexes** mentioned in `db_indexes_summary.md`
2. **Add missing composite indexes** for common filter patterns
3. **Implement RPC functions** for complex queries
4. **Use partial indexes** for nullable foreign keys

### React Performance
1. **Memoize filter components** that re-render frequently
2. **Implement lazy loading** for modals and heavy forms
3. **Use optimistic updates** for status changes
4. **Add pagination** to all large data lists

---

## Development Commands

### Performance Analysis
```bash
# Analyze bundle size
npm run build -- --analyze

# Type checking
npm run typecheck

# Linting with performance rules
npm run lint

# Performance testing
npm run test:performance
```

### Development Server
```bash
npm run dev
```

### Database Migration
```bash
# Generate types from database
npm run generate-types

# Run database migrations
npm run db:migrate
```

---

## Priority Implementation Order

### Phase 1 (Immediate - Performance Critical)
1. Create RPC functions for claims and units data fetching
2. Add missing database indexes
3. Implement server-side filtering for claims
4. Remove duplicate indexes

### Phase 2 (High Impact)
1. Memoize ClaimsTable and UnitsMatrix components
2. Implement proper pagination for large datasets
3. Add optimistic updates for status changes
4. Lazy load heavy modals

### Phase 3 (Quality of Life)
1. Implement virtualization for all large tables
2. Add comprehensive error boundaries
3. Improve loading states and skeletons
4. Optimize cache management strategies

The goal is to maintain sub-second response times even with large datasets (1000+ claims, 500+ court cases) while ensuring excellent user experience and code maintainability.