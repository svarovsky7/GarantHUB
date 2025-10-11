# Court Cases Page - Structure Reference

Quick reference for the refactored CourtCasesPage architecture.

## Component Tree

```
CourtCasesPageNew
├── ConfigProvider (Ant Design Russian locale)
│   ├── CourtCasesToolbar
│   │   ├── Button (Add/Toggle buttons)
│   │   └── ExportCourtCasesButton (lazy loaded)
│   │
│   ├── AddCourtCaseFormAntd (conditional)
│   │
│   ├── LinkCasesDialog
│   │
│   ├── TableColumnsDrawer (lazy loaded)
│   │
│   ├── CourtCaseViewModal
│   │
│   └── Main Content
│       ├── CourtCasesFilters (conditional)
│       ├── CourtCasesTable
│       └── CourtCasesStats
```

## Data Flow

```
useCourtCasesData
  ↓
  Fetches: cases, projects, units, users, stages, parties
  ↓
  Enriches: adds related data to cases
  ↓
  Returns: CourtCaseEnriched[] + metadata

useCourtCasesFilters
  ↓
  Takes: enriched cases + filter options
  ↓
  Applies: filters from state/URL/localStorage
  ↓
  Returns: filtered cases + filter handlers

useCourtCasesColumns
  ↓
  Defines: all table columns
  ↓
  Manages: visibility + widths
  ↓
  Returns: visible columns array
```

## State Management

### Local State (useState)
- `linkFor` - Case to link to
- `showAddForm` - Add form visibility
- `pageSize` - Table page size
- `showColumnsDrawer` - Columns drawer visibility
- `viewId` - Case ID for view modal
- `hideOnScroll` - Flag for auto-hide form

### URL State (searchParams)
- `project_id` - Filter by project
- `unit_id` - Filter by unit
- `status` - Filter by status
- `case_id` - Open view modal
- `open_form` - Open add form

### localStorage
- `courtCasesHideClosed` - Hide closed cases flag
- `courtCasesFiltersVisible` - Filters visibility
- `courtCasesColumns` - Column settings
- `courtCasesColumnWidths` - Column widths

### Server State (React Query)
- Court cases data
- Projects list
- Units list
- Users list
- Statuses list
- Parties list
- Permissions

## Hook Dependencies

```
CourtCasesPageNew
├── useSearchParams (react-router-dom)
├── useAuthStore (zustand)
├── useRolePermission (entities)
├── useLinkCases (entities)
│
├── useCourtCasesData
│   ├── useCourtCases
│   ├── useVisibleProjects
│   ├── useUnitsByIds
│   ├── useUsers
│   ├── useCourtCaseStatuses
│   └── useCasePartiesByCaseIds
│
├── useCourtCasesFilters
│   ├── useSearchParams
│   └── useCourtCasesFilterOptions (features)
│
└── useCourtCasesColumns
    ├── useDeleteCourtCase
    └── useUnlinkCase
```

## File Sizes

| File | Lines | Purpose |
|------|-------|---------|
| CourtCasesPageNew.tsx | 245 | Main page component |
| useCourtCasesData.ts | 162 | Data fetching & enrichment |
| useCourtCasesFilters.ts | 165 | Filter state management |
| useCourtCasesColumns.tsx | 356 | Column configuration |
| CourtCasesStats.tsx | 32 | Statistics display |
| CourtCasesTable.tsx | 74 | Table with tree structure |
| CourtCasesToolbar.tsx | 66 | Action buttons toolbar |

**Total**: 1,100 lines (vs 760 original)
**Main component**: 245 lines (68% reduction)

## Import Map

```typescript
// Main page
import { CourtCasesToolbar, CourtCasesTable, CourtCasesStats } from "./ui";
import { useCourtCasesData, useCourtCasesFilters, useCourtCasesColumns } from "./model";

// External widgets
import CourtCasesFilters from "@/widgets/CourtCasesFilters";
import TableColumnsDrawer from "@/widgets/TableColumnsDrawer";

// External features
import AddCourtCaseFormAntd from "@/features/courtCase/AddCourtCaseFormAntd";
import LinkCasesDialog from "@/features/courtCase/LinkCasesDialog";
import CourtCaseViewModal from "@/features/courtCase/CourtCaseViewModal";
import ExportCourtCasesButton from "@/features/courtCase/ExportCourtCasesButton";

// Entities
import { useLinkCases } from "@/entities/courtCase";
import { useRolePermission } from "@/entities/rolePermission";

// Shared
import { useAuthStore } from "@/shared/store/authStore";
```

## Type Exports

```typescript
// From model/index.ts
export type { CourtCaseEnriched } from "./useCourtCasesData";

// From ui/index.ts
export { CourtCasesStats } from "./CourtCasesStats";
export { CourtCasesTable } from "./CourtCasesTable";
export { CourtCasesToolbar } from "./CourtCasesToolbar";
```

## Memoization Strategy

### useCourtCasesData
- `unitIds` - useMemo (derived from cases)
- `buildingMap` - useMemo (lookup for O(1) access)
- `partiesMap` - useMemo (grouped by case_id)
- `closedStageId` - useMemo (find closed stage)
- `casesData` - useMemo (enriched cases array)
- `stats` - useMemo (calculated counts)

### useCourtCasesFilters
- `initialValues` - useMemo (from URL params)
- Filter logic delegated to `useCourtCasesFilterOptions`

### useCourtCasesColumns
- `baseColumns` - useMemo (column definitions)
- `columns` - useMemo (visible columns with widths)

### CourtCasesTable
- `treeData` - useMemo (build tree structure)

## localStorage Keys Reference

| Key | Type | Purpose |
|-----|------|---------|
| courtCasesHideClosed | boolean | Hide closed cases toggle |
| courtCasesFiltersVisible | boolean | Show/hide filters panel |
| courtCasesColumns | TableColumnSetting[] | Column visibility & order |
| courtCasesColumnWidths | Record<string, number> | Custom column widths |

## Performance Optimizations

1. **Lazy Loading**
   - ExportCourtCasesButton (contains large ExcelJS)
   - TableColumnsDrawer (not always needed)

2. **Memoization**
   - All expensive computations wrapped in useMemo
   - Lookup maps for O(1) access (buildingMap, partiesMap)

3. **Query Optimization**
   - Batch fetch parties for all cases
   - Deduplicate unit IDs before fetching
   - staleTime set for projects query

4. **Component Optimization**
   - Table uses tree structure (no flat map)
   - Pagination limits rendered rows
   - Sticky header uses CSS position

## Testing Strategy

### Unit Tests (Recommended)
```typescript
// test useCourtCasesData
import { renderHook } from '@testing-library/react-hooks';
import { useCourtCasesData } from './useCourtCasesData';

test('enriches cases with related data', () => {
  const { result } = renderHook(() => useCourtCasesData());
  // assertions
});

// test useCourtCasesFilters
test('filters cases by project', () => {
  const { result } = renderHook(() => useCourtCasesFilters({...}));
  // assertions
});

// test useCourtCasesColumns
test('shows correct visible columns', () => {
  const { result } = renderHook(() => useCourtCasesColumns({...}));
  // assertions
});
```

### Component Tests
```typescript
import { render, screen } from '@testing-library/react';
import { CourtCasesStats } from './CourtCasesStats';

test('displays correct statistics', () => {
  render(<CourtCasesStats total={100} closedCount={30} openCount={70} readyToExport={85} />);
  expect(screen.getByText(/Всего дел: 100/)).toBeInTheDocument();
});
```

### Integration Tests
```typescript
test('full page renders and filters work', () => {
  render(<CourtCasesPageNew />);
  // interact with filters
  // verify table updates
});
```

## Common Patterns

### Adding a New Filter
1. Add field to `CourtCasesFiltersValues` type
2. Update `useCourtCasesFilters` to handle new filter
3. Update `CourtCasesFilters` widget to include new filter UI
4. Update `useCourtCasesFilterOptions` to filter data

### Adding a New Column
1. Add column definition to `baseColumns` in `useCourtCasesColumns`
2. Column automatically appears in settings drawer
3. Visibility/width managed by existing state

### Adding a New Action
1. Add button to `actions` column in `useCourtCasesColumns`
2. Add handler in main page component
3. Pass handler through `useCourtCasesColumns` props

## Quick Commands

```bash
# Navigate to page directory
cd src/pages/CourtCasesPage

# View file tree
tree

# Count lines
wc -l **/*.{ts,tsx}

# Search for specific code
grep -r "useCourtCases" .

# Check imports
grep -r "import.*from" CourtCasesPageNew.tsx
```

## Rollback Command

```typescript
// In src/app/Router.tsx
import CourtCasesPage from "@/pages/CourtCasesPage/CourtCasesPage";
```

---

**Quick Ref Version**: 1.0
**Last Updated**: October 10, 2025
**Status**: Ready for review
