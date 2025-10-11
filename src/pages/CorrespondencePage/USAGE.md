# Usage Guide for Refactored CorrespondencePage

## Quick Start

### Using the New Page Component

```typescript
// In your router (src/app/Router.tsx)
import { CorrespondencePageNew as CorrespondencePage } from '@/pages/CorrespondencePage';

// Use it like before
<Route path="/correspondence" element={<CorrespondencePage />} />
```

## Hook Usage Examples

### 1. useCorrespondenceData - Data Fetching

```typescript
import { useCorrespondenceData } from '@/pages/CorrespondencePage/model';

function MyComponent() {
  const projectId = 123; // or from state/URL

  const {
    letters,           // CorrespondenceLetter[]
    users,            // User[]
    letterTypes,      // LetterType[]
    statuses,         // Status[] (compatible with LetterStatus)
    contractors,      // Contractor[]
    persons,          // Person[]
    projects,         // Project[]
    projectUnits,     // Unit[] - units for selected project
    allUnits,         // Unit[] - all units referenced in letters
    lockedUnitIds,    // number[] - IDs of locked units
    closedStatusId,   // number | null - ID of "closed" status
  } = useCorrespondenceData(projectId);

  return <div>Found {letters.length} letters</div>;
}
```

### 2. useCorrespondenceFilters - Filter Management

```typescript
import { useCorrespondenceFilters, useFilteredLetters } from '@/pages/CorrespondencePage/model';

function MyComponent() {
  // Get filter state and handlers
  const {
    filters,              // Current filter values
    setFilters,           // Update filter state
    showFilters,          // Boolean: are filters visible?
    setShowFilters,       // Toggle filter visibility
    form,                 // Ant Design Form instance
    handleFiltersChange,  // Handle filter value changes
    resetFilters,         // Reset all filters
    searchParams,         // URLSearchParams instance
    setSearchParams,      // Update URL params
  } = useCorrespondenceFilters();

  // Apply filters to data
  const filtered = useFilteredLetters(
    letters,           // All letters
    filters,           // Filter criteria
    allUnits,          // Units for building filter
    closedStatusId,    // For "hide closed" filter
  );

  return (
    <div>
      <button onClick={() => setShowFilters(!showFilters)}>
        Toggle Filters
      </button>
      <button onClick={resetFilters}>Reset</button>
      <p>Showing {filtered.length} of {letters.length} letters</p>
    </div>
  );
}
```

#### Filter Structure

```typescript
interface Filters {
  period?: [dayjs.Dayjs, dayjs.Dayjs] | null;  // Date range
  type?: 'incoming' | 'outgoing' | '';          // Letter type
  id?: number[];                                 // Specific letter IDs
  category?: number | '';                        // Letter type ID
  project?: number | '';                         // Project ID
  building?: string | '';                        // Building name
  unit?: number | '';                            // Unit ID
  number?: string;                               // Letter number (text search)
  sender?: string;                               // Sender (text search)
  receiver?: string;                             // Receiver (text search)
  subject?: string;                              // Subject (text search)
  content?: string;                              // Content (text search)
  status?: number | '';                          // Status ID
  responsible?: string | '';                     // Responsible user ID
  hideClosed?: boolean;                          // Hide closed letters
}
```

### 3. useCorrespondenceColumns - Table Columns

```typescript
import { useCorrespondenceColumns } from '@/pages/CorrespondencePage/model';

function MyComponent() {
  const {
    columns,              // ColumnsType<any> - configured columns
    columnsState,         // TableColumnSetting[] - column visibility
    setColumnsState,      // Update column visibility/order
    columnWidths,         // Record<string, number> - column widths
    setColumnWidths,      // Update column widths
    baseColumns,          // All available column definitions
    handleResetColumns,   // Reset to defaults
  } = useCorrespondenceColumns({
    onDelete: (id) => console.log('Delete', id),
    onAddChild: (letter) => console.log('Link', letter),
    onUnlink: (id) => console.log('Unlink', id),
    onView: (id) => console.log('View', id),
    allUnits: [],  // For building column rendering
  });

  return (
    <Table
      columns={columns}
      dataSource={letters}
      rowKey="id"
    />
  );
}
```

#### Available Columns

- `treeIcon` - Parent/child indicator
- `id` - Letter ID
- `type` - Incoming/Outgoing
- `number` - Letter number
- `date` - Letter date
- `sender` - Sender name
- `receiver` - Receiver name
- `subject` - Subject text
- `projectName` - Project name
- `building` - Building name
- `unitNames` - Associated units
- `letterTypeName` - Category
- `statusName` - Status (with inline editor)
- `responsibleName` - Responsible user
- `createdAt` - Creation timestamp
- `createdByName` - Creator name
- `actions` - Action buttons

### 4. useCorrespondenceUrlSync - URL Synchronization

```typescript
import { useCorrespondenceUrlSync } from '@/pages/CorrespondencePage/model';

function MyComponent() {
  const [viewId, setViewId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // Automatically syncs URL params with state
  useCorrespondenceUrlSync({
    searchParams,      // URLSearchParams from useSearchParams()
    letters,           // All letters (for ID validation)
    setFilters,        // Update filter state from URL
    form,              // Ant Design form to update
    setViewId,         // Open view modal from ?letter_id=123
    setShowAddForm,    // Open add form from ?open_form=1
  });

  // URL params automatically applied:
  // ?project_id=123 → filters.project = 123
  // ?unit_id=456 → filters.unit = 456
  // ?ids=1,2,3 → filters.id = [1,2,3]
  // ?letter_id=789 → opens view modal
  // ?open_form=1 → opens add form
}
```

### 5. useCorrespondenceOptions - Dropdown Options

```typescript
import { useCorrespondenceOptions } from '@/pages/CorrespondencePage/model';

function MyComponent() {
  const {
    contactOptions,    // { value, label }[] - contractors + persons
    idOptions,         // { value, label }[] - all letter IDs
    buildingOptions,   // { value, label }[] - unique buildings
  } = useCorrespondenceOptions(
    letters,
    contractors,
    persons,
    allUnits,
  );

  return (
    <Select
      options={contactOptions}
      placeholder="Select sender"
    />
  );
}
```

## Component Usage Examples

### 1. CorrespondenceToolbar

```typescript
import { CorrespondenceToolbar } from '@/pages/CorrespondencePage/ui';

function MyComponent() {
  return (
    <CorrespondenceToolbar
      showAddForm={showAddForm}
      showFilters={showFilters}
      onToggleAddForm={() => setShowAddForm(!showAddForm)}
      onToggleFilters={() => setShowFilters(!showFilters)}
      onOpenColumnsDrawer={() => setShowColumnsDrawer(true)}
      filteredLetters={filtered}
      users={users}
      letterTypes={letterTypes}
      projects={projects}
      units={allUnits}
      statuses={statuses}
    />
  );
}
```

### 2. CorrespondenceStats

```typescript
import { CorrespondenceStats } from '@/pages/CorrespondencePage/ui';

function MyComponent() {
  const total = letters.length;
  const closedCount = letters.filter(l => l.status_id === closedStatusId).length;
  const openCount = total - closedCount;
  const readyToExport = filtered.length;

  return (
    <CorrespondenceStats
      total={total}
      closedCount={closedCount}
      openCount={openCount}
      readyToExport={readyToExport}
    />
  );
}
```

## Full Example: Custom Correspondence View

```typescript
import React, { useState } from 'react';
import { Card } from 'antd';
import {
  useCorrespondenceData,
  useCorrespondenceFilters,
  useFilteredLetters,
} from '@/pages/CorrespondencePage/model';
import { CorrespondenceStats } from '@/pages/CorrespondencePage/ui';

export function MyCorrespondenceWidget() {
  // 1. Fetch data
  const {
    letters,
    allUnits,
    closedStatusId,
  } = useCorrespondenceData('');

  // 2. Setup filters
  const {
    filters,
    handleFiltersChange,
    form,
  } = useCorrespondenceFilters();

  // 3. Apply filters
  const filtered = useFilteredLetters(
    letters,
    filters,
    allUnits,
    closedStatusId,
  );

  // 4. Calculate stats
  const total = letters.length;
  const closedCount = letters.filter(
    l => closedStatusId != null && l.status_id === closedStatusId
  ).length;
  const openCount = total - closedCount;

  return (
    <Card title="Correspondence Overview">
      {/* Your custom UI */}
      <CorrespondenceStats
        total={total}
        closedCount={closedCount}
        openCount={openCount}
        readyToExport={filtered.length}
      />
    </Card>
  );
}
```

## Testing Examples

### Testing a Hook

```typescript
import { renderHook } from '@testing-library/react-hooks';
import { useCorrespondenceOptions } from '@/pages/CorrespondencePage/model';

describe('useCorrespondenceOptions', () => {
  it('combines contractors and persons into contactOptions', () => {
    const letters = [];
    const contractors = [{ name: 'ABC Corp' }];
    const persons = [{ full_name: 'John Doe' }];
    const units = [];

    const { result } = renderHook(() =>
      useCorrespondenceOptions(letters, contractors, persons, units)
    );

    expect(result.current.contactOptions).toEqual([
      { value: 'ABC Corp', label: 'ABC Corp' },
      { value: 'John Doe', label: 'John Doe' },
    ]);
  });
});
```

### Testing a Component

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { CorrespondenceToolbar } from '@/pages/CorrespondencePage/ui';

describe('CorrespondenceToolbar', () => {
  it('toggles add form when button clicked', () => {
    const onToggle = jest.fn();

    render(
      <CorrespondenceToolbar
        showAddForm={false}
        onToggleAddForm={onToggle}
        // ... other props
      />
    );

    fireEvent.click(screen.getByText('Добавить письмо'));
    expect(onToggle).toHaveBeenCalled();
  });
});
```

## Performance Tips

1. **Memoize filtered data**: `useFilteredLetters` already uses `useMemo`
2. **Use React.memo**: Toolbar and Stats already wrapped
3. **Avoid inline functions**: Pass stable callbacks from `useCallback`
4. **Selective re-renders**: Update only changed filters

```typescript
// Good: Stable callback
const handleDelete = useCallback((id: string) => {
  remove.mutate(id);
}, [remove]);

// Bad: New function each render
const handleDelete = (id: string) => {
  remove.mutate(id);
};
```

## Common Patterns

### Opening a Letter from Another Page

```typescript
// From any page, link to correspondence with letter open
navigate(`/correspondence?letter_id=${letterId}`);
```

### Pre-filtering by Project/Unit

```typescript
// Open correspondence page filtered to specific project and unit
navigate(`/correspondence?project_id=${projectId}&unit_id=${unitId}`);
```

### Opening Add Form Automatically

```typescript
// Open correspondence with add form visible
navigate('/correspondence?open_form=1&project_id=123');
```

## Troubleshooting

### Filters not updating
- Check that `handleFiltersChange` is passed to `<CorrespondenceFilters>`
- Verify form instance is from `useCorrespondenceFilters()`

### Columns not persisting
- Check localStorage is available
- Verify keys: `correspondenceColumns` and `correspondenceColumnWidths`

### URL params not syncing
- Ensure `useCorrespondenceUrlSync` is called with correct params
- Check that `searchParams` is from `useSearchParams()`

### Type errors with statuses
- `useLetterStatuses()` returns `Status[]` (base type)
- `LetterStatus` extends `Status`, so casting is safe
- Already handled in `useCorrespondenceData`
