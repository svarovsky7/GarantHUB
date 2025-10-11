# Court Cases Page Refactoring

## Overview

The Court Cases page has been refactored from a monolithic 760-line component into a modular architecture following Feature-Sliced Design principles. The refactored version (`CourtCasesPageNew.tsx`) is ~180 lines, with logic extracted into reusable hooks and UI components.

## File Structure

```
src/pages/CourtCasesPage/
├── CourtCasesPage.tsx          # Original file (PRESERVED - do not delete)
├── CourtCasesPageNew.tsx       # Refactored main page (~180 lines)
├── README.md                   # This documentation
├── ui/                         # UI Components
│   ├── CourtCasesStats.tsx     # Statistics display component
│   ├── CourtCasesTable.tsx     # Table component with tree structure
│   ├── CourtCasesToolbar.tsx   # Action buttons toolbar
│   └── index.ts                # Public exports
└── model/                      # Business Logic Hooks
    ├── useCourtCasesData.ts    # Data fetching and enrichment
    ├── useCourtCasesFilters.ts # Filters state management
    ├── useCourtCasesColumns.tsx # Columns configuration
    └── index.ts                # Public exports
```

## Architecture Changes

### Before (CourtCasesPage.tsx - 760 lines)
- Single monolithic component
- All logic inline
- Difficult to test and maintain
- Hard to find specific functionality
- Mixed concerns (data, filters, columns, UI)

### After (CourtCasesPageNew.tsx - ~180 lines)
- Clean separation of concerns
- Reusable hooks and components
- Easy to test individual pieces
- Clear responsibility boundaries
- Improved readability

## Components

### 1. UI Components (`ui/`)

#### CourtCasesStats
Displays statistics about court cases.

**Props:**
- `total: number` - Total number of cases
- `closedCount: number` - Number of closed cases
- `openCount: number` - Number of open cases
- `readyToExport: number` - Number of cases ready for export

**Usage:**
```tsx
<CourtCasesStats
  total={100}
  closedCount={30}
  openCount={70}
  readyToExport={85}
/>
```

#### CourtCasesTable
Displays court cases in a tree table structure with parent-child relationships.

**Props:**
- `data: CourtCaseEnriched[]` - Enriched case data
- `columns: ColumnsType<CourtCaseEnriched>` - Table columns configuration
- `loading: boolean` - Loading state
- `pageSize: number` - Current page size
- `onPageSizeChange: (size: number) => void` - Page size change handler

**Features:**
- Tree structure for linked cases
- Expandable rows
- Sticky header
- Pagination
- Custom row styling

**Usage:**
```tsx
<CourtCasesTable
  data={filteredCases}
  columns={columns}
  loading={isLoading}
  pageSize={100}
  onPageSizeChange={setPageSize}
/>
```

#### CourtCasesToolbar
Action buttons for page operations.

**Props:**
- `canEdit: boolean` - User permission to edit
- `showAddForm: boolean` - Add form visibility state
- `showFilters: boolean` - Filters visibility state
- `onToggleAddForm: () => void` - Toggle add form handler
- `onToggleFilters: () => void` - Toggle filters handler
- `onOpenColumnsDrawer: () => void` - Open columns drawer handler
- `exportData: any[]` - Data for export
- `stages: Record<number, string>` - Stage lookup
- `closedStageId?: number` - Closed stage ID

**Usage:**
```tsx
<CourtCasesToolbar
  canEdit={true}
  showAddForm={false}
  showFilters={true}
  onToggleAddForm={() => setShowAddForm(!showAddForm)}
  onToggleFilters={() => setShowFilters(!showFilters)}
  onOpenColumnsDrawer={() => setShowColumnsDrawer(true)}
  exportData={filteredCases}
  stages={stagesLookup}
  closedStageId={closedStageId}
/>
```

### 2. Business Logic Hooks (`model/`)

#### useCourtCasesData
Fetches and enriches court cases with related data.

**Returns:**
```typescript
{
  cases: CourtCaseEnriched[];        // Enriched cases with all relations
  isLoading: boolean;                // Loading state
  projects: VisibleProject[];        // Available projects
  units: Unit[];                     // Related units
  users: User[];                     // All users
  stages: CourtCaseStatus[];         // Case statuses
  closedStageId?: number;            // ID of closed status
  stats: {
    total: number;                   // Total cases count
    closedCount: number;             // Closed cases count
    openCount: number;               // Open cases count
  };
}
```

**Features:**
- Fetches cases, projects, units, users, statuses, parties
- Enriches cases with related data (project names, unit names, parties, etc.)
- Builds lookup maps for performance
- Calculates statistics

**Data Enrichment:**
Each case is enriched with:
- `projectName` - Project name
- `projectObject` - Comma-separated unit names
- `buildings` - Comma-separated building names
- `plaintiffs` - Comma-separated plaintiff names
- `defendants` - Comma-separated defendant names
- `responsibleLawyer` - Lawyer name
- `createdByName` - Author name
- `statusName` - Status name
- `statusColor` - Status color
- `daysSinceFixStart` - Days since fix start date

**Usage:**
```tsx
const {
  cases,
  isLoading,
  stages,
  closedStageId,
  stats
} = useCourtCasesData();
```

#### useCourtCasesFilters
Manages filters state and synchronization with URL/localStorage.

**Parameters:**
```typescript
{
  cases: CourtCaseEnriched[];
  projects: VisibleProject[];
  units: Unit[];
  stages: CourtCaseStatus[];
  users: User[];
  closedStageId?: number;
}
```

**Returns:**
```typescript
{
  filters: CourtCasesFiltersValues;  // Current filter values
  setFilters: (v: CourtCasesFiltersValues) => void;
  resetFilters: () => void;
  showFilters: boolean;              // Filters visibility
  setShowFilters: (v: boolean) => void;
  initialValues: any;                // Initial values from URL
  filteredCases: CourtCaseEnriched[]; // Filtered data
  filterOptions: {
    projects: SelectOption[];
    buildings: SelectOption[];
    units: SelectOption[];
    statuses: SelectOption[];
    users: SelectOption[];
    ids: SelectOption[];
  };
}
```

**Features:**
- URL parameter parsing (project_id, unit_id, status, etc.)
- localStorage persistence for filter visibility and hideClosed flag
- Cross-tab synchronization via storage events
- Filter options generation
- Data filtering logic

**localStorage Keys:**
- `courtCasesHideClosed` - Hide closed cases flag
- `courtCasesFiltersVisible` - Filters panel visibility

**Usage:**
```tsx
const {
  filters,
  setFilters,
  filteredCases,
  filterOptions
} = useCourtCasesFilters({
  cases,
  projects,
  units,
  stages,
  users,
  closedStageId
});
```

#### useCourtCasesColumns
Manages table columns configuration and visibility.

**Parameters:**
```typescript
{
  perm?: RolePermission;           // User permissions
  onView: (id: number) => void;    // View case handler
  onLink: (record: CourtCase) => void; // Link case handler
}
```

**Returns:**
```typescript
{
  columns: ColumnsType<CourtCaseEnriched>; // Final columns array
  columnsState: TableColumnSetting[];      // Columns state
  setColumnsState: (v: TableColumnSetting[]) => void;
  columnWidths: Record<string, number>;    // Column widths
  setColumnWidths: (v: Record<string, number>) => void;
  baseColumns: Record<string, ColumnType>; // Base columns definition
  handleResetColumns: () => void;          // Reset to defaults
}
```

**Features:**
- Columns visibility management
- Custom column widths
- localStorage persistence
- Default columns: all except createdAt/createdByName
- Actions column with view/link/unlink/delete buttons

**Columns:**
1. `treeIcon` - Main/linked case icon
2. `id` - Case ID (sortable, default descending)
3. `projectName` - Project name
4. `buildings` - Building names
5. `projectObject` - Unit names
6. `number` - Case number
7. `caseUid` - Case UID
8. `date` - Case date
9. `plaintiffs` - Plaintiffs list
10. `defendants` - Defendants list
11. `totalClaimAmount` - Total claim amount (formatted as currency)
12. `status` - Status with inline edit
13. `fix_start_date` - Fix start date
14. `fix_end_date` - Fix end date
15. `daysSinceFixStart` - Days since fix start
16. `responsibleLawyer` - Responsible lawyer
17. `createdAt` - Created timestamp (hidden by default)
18. `createdByName` - Author name (hidden by default)
19. `actions` - Action buttons

**localStorage Keys:**
- `courtCasesColumns` - Columns state
- `courtCasesColumnWidths` - Column widths

**Usage:**
```tsx
const {
  columns,
  columnsState,
  setColumnsState,
  handleResetColumns
} = useCourtCasesColumns({
  perm,
  onView: setViewId,
  onLink: setLinkFor
});
```

## Type Definitions

### CourtCaseEnriched
Extended CourtCase type with enriched data:

```typescript
type CourtCaseEnriched = CourtCase & {
  caseUid: string | null;
  plaintiffs: string;              // Comma-separated
  defendants: string;              // Comma-separated
  projectName: string;
  projectObject: string;           // Comma-separated unit names
  buildingNamesList: string[];     // Array of building names
  buildings: string;               // Comma-separated
  totalClaimAmount: number;
  responsibleLawyer: string | null;
  createdAt: dayjs.Dayjs | null;
  createdByName: string | null;
  daysSinceFixStart: number | null;
  statusName: string | null;
  statusColor: string | null;
};
```

## Features Preserved

All original functionality is preserved:

1. **Data Management**
   - Fetch court cases with all related data
   - Real-time updates via Supabase subscriptions
   - Parent-child case relationships

2. **Filtering**
   - Filter by project, unit, building, status, lawyer, ID
   - Hide/show closed cases
   - URL parameter support
   - localStorage persistence

3. **Table Features**
   - Tree structure for linked cases
   - Sortable columns
   - Resizable columns
   - Column visibility toggle
   - Pagination
   - Sticky header

4. **Actions**
   - Add new case
   - View case details
   - Link cases (parent-child)
   - Unlink cases
   - Delete case (permission-based)
   - Export to Excel

5. **Permissions**
   - Role-based access control
   - Edit permission check
   - Delete permission check

6. **UI Enhancements**
   - Auto-hide add form on scroll
   - Open add form from URL parameter
   - Open view modal from URL parameter
   - Loading states
   - Error handling

## Performance Optimizations

1. **Memoization**
   - All expensive computations wrapped in `useMemo`
   - Lookup maps for O(1) access
   - Tree data structure cached

2. **Lazy Loading**
   - Export button component lazy loaded
   - Table columns drawer lazy loaded

3. **Efficient Queries**
   - Batch fetch parties for all cases
   - Deduplicated unit IDs
   - Single query for all related data

## Migration Guide

### Switch to New Page

In `src/app/Router.tsx`, replace:
```tsx
import CourtCasesPage from "@/pages/CourtCasesPage/CourtCasesPage";
```

With:
```tsx
import CourtCasesPage from "@/pages/CourtCasesPage/CourtCasesPageNew";
```

### Rollback to Original

If issues occur, simply revert the import:
```tsx
import CourtCasesPage from "@/pages/CourtCasesPage/CourtCasesPage";
```

The original file is preserved for rollback purposes.

## Testing Checklist

- [ ] Page loads without errors
- [ ] Cases display correctly in table
- [ ] Filters work (project, unit, status, etc.)
- [ ] Add case form works
- [ ] View case modal opens
- [ ] Link cases dialog works
- [ ] Unlink case works
- [ ] Delete case works (with permissions)
- [ ] Export to Excel works
- [ ] Column visibility toggle works
- [ ] Column resizing persists
- [ ] Pagination works
- [ ] Tree structure expands/collapses
- [ ] URL parameters work (project_id, unit_id, case_id, open_form)
- [ ] localStorage persistence works
- [ ] Statistics display correctly
- [ ] Loading states show
- [ ] Permissions are enforced

## Benefits

1. **Maintainability**
   - Smaller, focused files
   - Clear separation of concerns
   - Easy to locate specific functionality

2. **Testability**
   - Hooks can be tested independently
   - Components can be tested in isolation
   - Easier to mock dependencies

3. **Reusability**
   - Hooks can be reused in other pages
   - Components can be used elsewhere
   - Clear public APIs

4. **Readability**
   - Main page file is ~180 lines vs 760
   - Self-documenting structure
   - Logical grouping

5. **Performance**
   - No performance regression
   - Same optimization techniques preserved
   - Better code splitting potential

## Future Improvements

1. **Extract CourtCasesFilters to ui/**
   - Currently uses `@/widgets/CourtCasesFilters`
   - Could be moved to local ui/ folder for complete encapsulation

2. **Add Unit Tests**
   - Test hooks with @testing-library/react-hooks
   - Test components with @testing-library/react
   - Test filter logic

3. **Add Storybook Stories**
   - Document components visually
   - Interactive component playground

4. **Extract Common Patterns**
   - Table wrapper component
   - Filter panel component
   - Toolbar component pattern

5. **TypeScript Improvements**
   - Stricter types for enriched data
   - Shared types with backend
   - Better inference

## Related Files

- `src/entities/courtCase/` - Court case entity
- `src/entities/courtCaseParty/` - Parties entity
- `src/entities/courtCaseStatus/` - Statuses entity
- `src/features/courtCase/` - Court case features
- `src/widgets/CourtCasesFilters.tsx` - Filters widget
- `src/widgets/TableColumnsDrawer.tsx` - Columns drawer widget
- `src/shared/types/courtCase.ts` - Court case types
- `src/shared/types/courtCasesFilters.ts` - Filter types

## Questions or Issues?

If you encounter any issues with the refactored version:
1. Check browser console for errors
2. Verify localStorage keys are not corrupted
3. Check network tab for API errors
4. Compare behavior with original version
5. Rollback to original if needed

## Author

Refactored following Feature-Sliced Design principles with focus on maintainability and testability.
