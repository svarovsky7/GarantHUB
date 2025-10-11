# EngineerCallsCalendarModern Architecture

## Visual Overview

### Before: Monolithic Component (835 lines)

```
┌─────────────────────────────────────────────────────────────┐
│ EngineerCallsCalendarModern.tsx (835 lines)                 │
│                                                               │
│  • Moment/dayjs configuration                                │
│  • State management (view, date, filters, toggle)           │
│  • Data fetching (calls, projects, engineers, statuses)     │
│  • Data filtering and transformation                         │
│  • Statistics calculation                                    │
│  • Custom components (inline):                               │
│    - CustomToolbar                                           │
│    - EventComponent                                          │
│  • Column definitions (7 columns)                            │
│  • Formatting utilities (dates, times)                       │
│  • Messages (Russian localization)                           │
│  • Event handlers                                            │
│  • Calendar configuration                                    │
│  • Filters JSX                                               │
│  • Header JSX                                                │
│  • Calendar/Agenda JSX                                       │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                    ⚠️ Hard to maintain
                    ⚠️ Mixed concerns
                    ⚠️ Hard to test
```

### After: Modular Architecture

```
┌─────────────────────────────────────────────────────────────┐
│ EngineerCallsCalendarModernNew.tsx (180 lines)              │
│                                                               │
│  Composition Layer:                                          │
│  • Imports hooks and components                              │
│  • Orchestrates data flow                                    │
│  • Renders filters, header, views                            │
│  • Handles loading states                                    │
│  • Passes props to child components                          │
│                                                               │
└─────────────────────────────────────────────────────────────┘
           │
           ├──────────────┬──────────────────┐
           ▼              ▼                  ▼
    ┌────────────┐  ┌─────────────┐  ┌──────────────┐
    │   Model    │  │     UI      │  │     Utils    │
    │   Layer    │  │    Layer    │  │   (shared)   │
    └────────────┘  └─────────────┘  └──────────────┘
           │              │                  │
           │              │                  │
           ▼              ▼                  ▼

┌──────────────────┐  ┌──────────────────┐  ┌─────────────┐
│ useCalendarState │  │ CalendarFilters  │  │ moment      │
│ (40 lines)       │  │ (150 lines)      │  │ dayjs       │
│                  │  │                  │  │ russian     │
│ • view           │  │ • Project        │  │ holidays    │
│ • date           │  │ • Engineers      │  └─────────────┘
│ • filters        │  │ • Date range     │
│ • toggle state   │  │ • Toggle         │
└──────────────────┘  └──────────────────┘

┌──────────────────┐  ┌──────────────────┐
│ useCalendarData  │  │ CalendarHeader   │
│ (120 lines)      │  │ (50 lines)       │
│                  │  │                  │
│ • Fetch data     │  │ • Title + Icon   │
│ • Filter calls   │  │ • Statistics     │
│ • Transform      │  │ • Create button  │
│ • Statistics     │  └──────────────────┘
└──────────────────┘
                      ┌──────────────────┐
                      │ CalendarToolbar  │
                      │ (50 lines)       │
                      │                  │
                      │ • Navigation     │
                      │ • View switcher  │
                      └──────────────────┘

                      ┌──────────────────┐
                      │ CalendarView     │
                      │ (150 lines)      │
                      │                  │
                      │ • Month view     │
                      │ • Week view      │
                      │ • Day view       │
                      │ • Formatting     │
                      │ • Highlighting   │
                      └──────────────────┘

                      ┌──────────────────┐
                      │ AgendaView       │
                      │ (130 lines)      │
                      │                  │
                      │ • Table view     │
                      │ • Sorting        │
                      │ • Filtering      │
                      │ • Pagination     │
                      └──────────────────┘

                      ┌──────────────────┐
                      │ EventRenderer    │
                      │ (40 lines)       │
                      │                  │
                      │ • Event display  │
                      │ • Tooltip        │
                      │ • Color coding   │
                      └──────────────────┘
```

## Data Flow

### State Management Flow

```
┌──────────────────────────────────────────────────────────────┐
│ useCalendarState Hook                                        │
│                                                               │
│ ┌─────────────┐  ┌──────────────┐  ┌────────────────────┐  │
│ │ view        │  │ filters      │  │ onlyMyMeetings     │  │
│ │ - month     │  │ - project    │  │ - localStorage     │  │
│ │ - week      │  │ - engineers  │  │ - toggle           │  │
│ │ - day       │  │ - dateRange  │  │                    │  │
│ │ - agenda    │  └──────────────┘  └────────────────────┘  │
│ └─────────────┘                                             │
│                                                               │
│ ┌─────────────┐                                             │
│ │ date        │                                             │
│ │ - current   │                                             │
│ │ - selected  │                                             │
│ └─────────────┘                                             │
└──────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│ useCalendarData Hook                                         │
│                                                               │
│ Input: state from useCalendarState                           │
│                                                               │
│ ┌──────────────┐      ┌──────────────┐                      │
│ │ Fetch Data   │──────▶│ Filter Data  │                      │
│ │ • calls      │      │ • by project │                      │
│ │ • projects   │      │ • by engineer│                      │
│ │ • engineers  │      │ • by dates   │                      │
│ │ • statuses   │      │ • by user    │                      │
│ └──────────────┘      └──────────────┘                      │
│                              │                                │
│                              ▼                                │
│                       ┌──────────────┐                       │
│                       │ Transform    │                       │
│                       │ • to events  │                       │
│                       │ • add colors │                       │
│                       │ • calculate  │                       │
│                       │   stats      │                       │
│                       └──────────────┘                       │
│                              │                                │
│                              ▼                                │
│ Output: events, statistics, metadata                         │
└──────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│ UI Components                                                │
│                                                               │
│ CalendarFilters ◄────── state                                │
│ CalendarHeader  ◄────── statistics + dbStatuses              │
│ CalendarView    ◄────── events + state                       │
│ AgendaView      ◄────── events + statusOptions               │
└──────────────────────────────────────────────────────────────┘
```

### User Interaction Flow

```
User Action                Component                   Hook/State
──────────                ─────────                   ──────────

Click Filter     ──────▶  CalendarFilters  ─────▶   useCalendarState
                                                     (update filter)
                                                          │
                                                          ▼
                                                   useCalendarData
                                                   (refetch with filter)
                                                          │
                                                          ▼
                                                   Transform data
                                                          │
                                                          ▼
Update Views     ◄──────  CalendarView     ◄──────  new events
                          AgendaView


Click Event      ──────▶  EventRenderer    ─────▶   onSelectEvent()
                          AgendaView row                  │
                                                          ▼
                                                   Parent handler
                                                   (open modal)


Click Empty      ──────▶  CalendarView     ─────▶   onSelectSlot()
Calendar Slot                                            │
                                                          ▼
                                                   Parent handler
                                                   (create new)


Switch View      ──────▶  CalendarToolbar  ─────▶   useCalendarState
                                                     (update view)
                                                          │
                                                          ▼
Render View      ◄──────  CalendarView     ◄──────  view state
                          AgendaView
```

## Component Hierarchy

```
EngineerCallsCalendarModernNew
├── CalendarFilters
│   ├── Select (Project)
│   ├── Select (Engineers, multiple)
│   ├── RangePicker (Dates)
│   └── Switch (Only my meetings)
│
└── Card
    ├── CalendarHeader
    │   ├── Icon + Title
    │   ├── Statistics (total + by status)
    │   └── Button (Create)
    │
    └── [Conditional Rendering]
        │
        ├── If view === 'agenda':
        │   ├── CalendarToolbar (for navigation)
        │   └── AgendaView
        │       └── Table
        │           ├── Columns (7)
        │           ├── Sorting
        │           ├── Filtering
        │           └── Pagination
        │
        └── Else (month/week/day):
            └── CalendarView
                └── BigCalendar
                    ├── CalendarToolbar (custom)
                    ├── EventRenderer (custom)
                    ├── Day styling (weekends/holidays)
                    └── Event styling (color-coded)
```

## Responsibility Distribution

### Model Layer (Hooks)

**`useCalendarState`**
- ✓ Manage UI state
- ✓ Handle filter changes
- ✓ Persist "only my meetings" toggle
- ✗ NO data fetching
- ✗ NO UI rendering

**`useCalendarData`**
- ✓ Fetch engineer calls
- ✓ Fetch reference data
- ✓ Filter and transform data
- ✓ Calculate statistics
- ✗ NO state management
- ✗ NO UI rendering

### UI Layer (Components)

**`CalendarFilters`**
- ✓ Render filter controls
- ✓ Handle user input
- ✓ Display loading states
- ✗ NO data fetching
- ✗ NO data transformation

**`CalendarHeader`**
- ✓ Display title and icon
- ✓ Display statistics
- ✓ Render create button
- ✗ NO state management
- ✗ NO data fetching

**`CalendarToolbar`**
- ✓ Render navigation buttons
- ✓ Render view switcher
- ✓ Handle button clicks
- ✗ NO state management
- ✗ NO date calculations

**`CalendarView`**
- ✓ Configure BigCalendar
- ✓ Apply Russian locale
- ✓ Style weekends/holidays
- ✓ Render events
- ✗ NO data fetching
- ✗ NO filtering logic

**`AgendaView`**
- ✓ Render table
- ✓ Define columns
- ✓ Handle sorting/filtering
- ✓ Render pagination
- ✗ NO data fetching
- ✗ NO statistics calculation

**`EventRenderer`**
- ✓ Display event details
- ✓ Show tooltip
- ✓ Apply color styling
- ✗ NO event selection logic
- ✗ NO data transformation

## Performance Optimizations

### Memoization Strategy

```typescript
// In useCalendarData
const queryDateRange = useMemo(() => {
  // Calculate date range based on current date
}, [date, dateRange]);

const filteredCalls = useMemo(() => {
  // Filter calls based on selections
}, [engineerCalls, selectedEngineerIds, onlyMyMeetings]);

const events = useMemo(() => {
  // Transform calls to events
}, [filteredCalls, statusColorMap]);

const statistics = useMemo(() => {
  // Calculate counts
}, [filteredCalls, dbStatuses]);
```

```typescript
// In CalendarView
const formats = useMemo(() => ({
  // Date format configurations
}), []);

const messages = useMemo(() => ({
  // Russian messages
}), []);

const dayPropGetter = useCallback((date) => {
  // Style weekend/holiday/today
}, []);

const EventComponent = useCallback(
  ({ event }) => <EventRenderer event={event} />,
  []
);
```

### Query Optimization

```typescript
// Fetch only visible date range
const queryDateRange = {
  start: dayjs(date).startOf('month').subtract(7, 'days'),
  end: dayjs(date).endOf('month').add(7, 'days')
};

// Filter on client side (already fetched data)
const filteredCalls = engineerCalls.filter(/* conditions */);
```

### Re-render Prevention

```typescript
// Component memoization
export const EventRenderer = React.memo(({ event }) => {
  // Render logic
});

// Callback memoization
const handleOnlyMyMeetingsChange = useCallback((checked) => {
  setOnlyMyMeetings(checked);
  localStorage.setItem('engineerCalls_onlyMyMeetings', String(checked));
}, []);
```

## Type Safety

### Type Definitions

```typescript
// Props interfaces
interface CalendarProps {
  onSelectSlot: (slotInfo: SlotInfo) => void;
  onSelectEvent: (event: CalendarEvent) => void;
  onCreateNew: () => void;
  onDeleteEvent?: (id: string) => void;
}

interface CalendarFiltersProps {
  projects: Array<{ id: string; name: string }>;
  selectedProjectId: string | null;
  onProjectChange: (value: string | null) => void;
  // ... more props
}

// Hook params
interface UseCalendarDataParams {
  date: Date;
  dateRange: [Dayjs | null, Dayjs | null];
  selectedProjectId: string | null;
  selectedEngineerIds: string[];
  onlyMyMeetings: boolean;
}

// Return types
interface CalendarState {
  view: View;
  date: Date;
  selectedProjectId: string | null;
  // ... more state
  setView: (view: View) => void;
  setDate: (date: Date) => void;
  // ... more setters
}
```

## Testing Structure

### Unit Tests (Hooks)

```typescript
// useCalendarState.test.ts
describe('useCalendarState', () => {
  it('initializes with default values');
  it('updates view when setView is called');
  it('persists onlyMyMeetings to localStorage');
});

// useCalendarData.test.ts
describe('useCalendarData', () => {
  it('fetches engineer calls for date range');
  it('filters calls by project');
  it('filters calls by engineers');
  it('applies "only my meetings" filter');
  it('transforms calls to calendar events');
  it('calculates statistics correctly');
});
```

### Component Tests

```typescript
// CalendarFilters.test.tsx
describe('CalendarFilters', () => {
  it('renders all filter controls');
  it('calls onProjectChange when project selected');
  it('disables engineers select when only my meetings is on');
});

// CalendarView.test.tsx
describe('CalendarView', () => {
  it('renders BigCalendar with events');
  it('highlights weekends');
  it('highlights holidays');
  it('calls onSelectSlot when empty slot clicked');
});

// AgendaView.test.tsx
describe('AgendaView', () => {
  it('renders table with events');
  it('sorts by date');
  it('filters by status');
  it('calls onSelectEvent when row clicked');
});
```

## Migration Path

### Phase 1: Parallel Development
```
Week 1-2:
- Refactored version available
- Both versions coexist
- New code uses refactored version
- Test refactored version in staging
```

### Phase 2: Gradual Migration
```
Week 3-4:
- Update one page at a time
- Test each page thoroughly
- Monitor for issues
- Rollback if needed
```

### Phase 3: Deprecation
```
Month 2-3:
- Mark original as deprecated
- Add deprecation warnings
- Update documentation
- All new code uses refactored version
```

### Phase 4: Removal
```
Month 6+:
- Remove original file
- Clean up exports
- Update all imports
- Final testing
```

## Summary

The refactored architecture provides:

✅ **Clear Separation**: Model (hooks) vs UI (components)
✅ **Single Responsibility**: Each file has one clear purpose
✅ **Reusability**: Hooks and components can be used independently
✅ **Testability**: Easy to test each part in isolation
✅ **Maintainability**: Easy to understand and modify
✅ **Performance**: Optimized with memoization
✅ **Type Safety**: Full TypeScript coverage
✅ **Flexibility**: Easy to customize and extend

The result is a modern, maintainable codebase that follows React best practices and Feature-Sliced Design principles.
