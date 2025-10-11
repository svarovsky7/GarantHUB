# EngineerCallsCalendarModern Widget

A comprehensive, fully-featured calendar widget for managing engineer service calls with multiple views, filtering capabilities, and statistics.

## Features

- **Multiple Calendar Views**: Month, Week, Day, Agenda (table)
- **Advanced Filtering**: By project, engineers, date range
- **"Only My Meetings"**: Toggle to show only calls assigned to current user (persisted in localStorage)
- **Real-time Statistics**: Display counts by status
- **Russian Locale**: Full Russian localization with 24-hour time format
- **Smart Date Highlighting**: Weekends, holidays, and current day
- **Responsive Design**: Mobile-friendly with Ant Design components

## Refactoring

This widget was refactored from a single 835-line file into a modular, maintainable structure:

### Before (Original)
- Single file: `EngineerCallsCalendarModern.tsx` (835 lines)
- All logic, state, and UI in one component

### After (Refactored)
- Main component: `EngineerCallsCalendarModernNew.tsx` (~180 lines)
- Model hooks: `model/` folder (2 hooks)
- UI components: `ui/` folder (6 components)
- **Original file preserved** for backward compatibility

## File Structure

```
src/widgets/EngineerCallsCalendarModern/
├── EngineerCallsCalendarModern.tsx          # Original (preserved)
├── EngineerCallsCalendarModernNew.tsx       # Refactored main component
├── index.ts                                  # Public API exports
├── README.md                                 # This file
├── model/
│   ├── useCalendarState.ts                  # State management hook
│   ├── useCalendarData.ts                   # Data fetching & processing hook
│   └── index.ts                             # Model exports
└── ui/
    ├── CalendarToolbar.tsx                  # Toolbar with navigation & view switching
    ├── EventRenderer.tsx                    # Custom event display component
    ├── CalendarFilters.tsx                  # Filter controls card
    ├── CalendarHeader.tsx                   # Header with statistics & create button
    ├── CalendarView.tsx                     # Month/Week/Day calendar view
    ├── AgendaView.tsx                       # Table-based agenda view
    └── index.ts                             # UI exports
```

## Component Breakdown

### Main Component (180 lines)
**File**: `EngineerCallsCalendarModernNew.tsx`

Composition layer that:
- Uses hooks for state and data management
- Renders filter controls
- Switches between calendar and agenda views
- Handles loading states

### Model Hooks

#### `useCalendarState` (40 lines)
Manages all UI state:
- View mode (month/week/day/agenda)
- Selected date
- Filter selections (project, engineers, date range)
- "Only my meetings" toggle with localStorage persistence

#### `useCalendarData` (120 lines)
Handles data fetching and processing:
- Fetches engineer calls, engineers, projects, statuses
- Filters calls based on selections
- Transforms calls into calendar events
- Calculates statistics by status
- Creates status color map

### UI Components

#### `CalendarFilters` (150 lines)
Filter controls card with:
- Project selector (searchable dropdown)
- Engineers multi-select (disabled when "only my meetings" is on)
- Date range picker
- "Only my meetings" toggle with description

#### `CalendarHeader` (50 lines)
Header section with:
- Calendar icon and title
- Statistics display (total + counts by status)
- "Create call" button with gradient styling

#### `CalendarView` (150 lines)
Main calendar display using react-big-calendar:
- Month, week, day views
- Custom Russian locale formats
- Weekend and holiday highlighting
- Custom event rendering
- Time range: 8:00 - 21:00

#### `AgendaView` (130 lines)
Table-based list view with:
- Sortable columns (date, time, title, project, unit, engineer, status)
- Filterable by status
- Pagination (10/20/50/100 per page)
- Delete button per row
- Click row to open details

#### `CalendarToolbar` (50 lines)
Navigation toolbar for calendar:
- Previous/Next buttons
- "Today" button
- View switcher (month/week/day/agenda)

#### `EventRenderer` (40 lines)
Custom event display:
- Shows time and title
- Tooltip with full details
- Color-coded by status
- Truncates long titles

## Usage

### Basic Usage (Refactored Version)

```typescript
import { EngineerCallsCalendarModernNew } from '@/widgets/EngineerCallsCalendarModern';

function MyPage() {
  const handleSelectSlot = (slotInfo) => {
    // User clicked on empty slot - create new call
    console.log('Selected slot:', slotInfo);
  };

  const handleSelectEvent = (event) => {
    // User clicked on existing event - edit call
    console.log('Selected event:', event);
  };

  const handleCreateNew = () => {
    // User clicked "Add call" button
    console.log('Create new call');
  };

  const handleDeleteEvent = (id) => {
    // User clicked delete button
    console.log('Delete call:', id);
  };

  return (
    <EngineerCallsCalendarModernNew
      onSelectSlot={handleSelectSlot}
      onSelectEvent={handleSelectEvent}
      onCreateNew={handleCreateNew}
      onDeleteEvent={handleDeleteEvent}
    />
  );
}
```

### Using Original Version

```typescript
import { EngineerCallsCalendarModern } from '@/widgets/EngineerCallsCalendarModern';

// Same API as refactored version
<EngineerCallsCalendarModern
  onSelectSlot={handleSelectSlot}
  onSelectEvent={handleSelectEvent}
  onCreateNew={handleCreateNew}
  onDeleteEvent={handleDeleteEvent}
/>
```

### Using Hooks Separately

```typescript
import { useCalendarState, useCalendarData } from '@/widgets/EngineerCallsCalendarModern';

function CustomCalendar() {
  const state = useCalendarState();
  const data = useCalendarData({
    date: state.date,
    dateRange: state.dateRange,
    selectedProjectId: state.selectedProjectId,
    selectedEngineerIds: state.selectedEngineerIds,
    onlyMyMeetings: state.onlyMyMeetings,
  });

  // Use state and data to build custom UI
  return <div>{/* Custom calendar UI */}</div>;
}
```

### Using UI Components Separately

```typescript
import { CalendarFilters, CalendarView } from '@/widgets/EngineerCallsCalendarModern';

function MinimalCalendar() {
  // Your state management
  const [view, setView] = useState('month');
  const [date, setDate] = useState(new Date());
  // ... other state

  return (
    <>
      <CalendarFilters
        projects={projects}
        selectedProjectId={selectedProjectId}
        onProjectChange={setSelectedProjectId}
        // ... other props
      />
      <CalendarView
        events={events}
        view={view}
        date={date}
        onView={setView}
        onNavigate={setDate}
        onSelectSlot={handleSelectSlot}
        onSelectEvent={handleSelectEvent}
      />
    </>
  );
}
```

## Props

### Main Component Props

```typescript
interface CalendarProps {
  onSelectSlot: (slotInfo: SlotInfo) => void;      // Called when user clicks empty calendar slot
  onSelectEvent: (event: CalendarEvent) => void;   // Called when user clicks existing event
  onCreateNew: () => void;                          // Called when user clicks "Add call" button
  onDeleteEvent?: (id: string) => void;            // Called when user clicks delete button (optional)
}
```

## Data Flow

1. **State Initialization**: `useCalendarState` initializes UI state, loads "only my meetings" from localStorage
2. **Data Fetching**: `useCalendarData` fetches engineer calls based on current filters
3. **Filtering**: Calls are filtered by project, engineers, and "only my meetings" toggle
4. **Transformation**: Filtered calls are transformed into calendar events with colors
5. **Statistics**: Event counts are calculated by status
6. **Rendering**: Events are displayed in selected view (month/week/day/agenda)

## Performance Optimizations

- **Memoization**: All data transformations use `useMemo` to prevent unnecessary recalculations
- **Callback Memoization**: Event handlers use `useCallback` to prevent re-renders
- **Selective Queries**: Only fetches calls within visible date range (current month ± 7 days)
- **Lazy Loading**: Agenda view uses paginated table for large datasets
- **LocalStorage**: "Only my meetings" preference cached to avoid API calls

## Styling

The widget uses:
- Ant Design components for consistent UI
- Custom CSS in `EngineerCallsCalendar.css` for calendar styling
- React Big Calendar's built-in styles
- Custom day highlighting for weekends/holidays

## Dependencies

- `react-big-calendar` - Calendar component
- `moment` - Date handling (required by react-big-calendar)
- `dayjs` - Additional date utilities
- `antd` - UI components
- `@ant-design/icons` - Icons
- `@/entities/engineerCall` - Engineer call data hooks
- `@/entities/status` - Status data hooks
- `@/shared/utils/russianHolidays` - Holiday detection
- `@/shared/store/authStore` - User authentication

## Migration Guide

To migrate from original to refactored version:

1. **Import Change**:
   ```typescript
   // Before
   import EngineerCallsCalendarModern from '@/widgets/EngineerCallsCalendarModern';

   // After
   import { EngineerCallsCalendarModernNew } from '@/widgets/EngineerCallsCalendarModern';
   ```

2. **Component Usage**: API is identical, no prop changes needed

3. **Testing**: Test all features (filtering, view switching, event creation/editing)

4. **Rollback**: Original file is preserved, can revert if needed

## Future Enhancements

- [ ] Add drag-and-drop event rescheduling
- [ ] Add recurring event support
- [ ] Add export to iCal/Google Calendar
- [ ] Add print view
- [ ] Add custom event colors per engineer
- [ ] Add conflict detection for overlapping calls
- [ ] Add notification system for upcoming calls

## Maintenance

When modifying this widget:
1. Keep original file untouched for backward compatibility
2. Make changes to refactored version and components
3. Update tests if functionality changes
4. Update this README if API changes
5. Consider performance impact of data transformations

## Related Files

- CSS: `C:\Users\svarovsky\WebstormProjects\GarantHUB\src\widgets\EngineerCallsCalendar.css`
- Types: `C:\Users\svarovsky\WebstormProjects\GarantHUB\src\shared\types\engineerCall.ts`
- Hooks: `C:\Users\svarovsky\WebstormProjects\GarantHUB\src\entities\engineerCall\index.ts`
- Holidays: `C:\Users\svarovsky\WebstormProjects\GarantHUB\src\shared\utils\russianHolidays.ts`
