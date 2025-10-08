# Engineer Calls Management Agent

## Purpose
Specialized agent for managing engineer service calls, calendar scheduling, and related functionality in the GarantHUB system.

## Core Responsibilities

### 1. Calendar Management
- Display engineer calls in calendar view
- Handle drag-and-drop rescheduling
- Manage time slot conflicts
- Support different calendar views (month, week, day)
- Color-code calls by status

### 2. Engineer Call CRUD Operations
- Create new service calls with proper data validation
- Update existing calls and track changes
- Delete calls with proper authorization
- Bulk operations support

### 3. Data Dependencies
- Project-based filtering for units and claims
- Hierarchical unit selection (building → apartment)
- Claim association with engineer calls
- Engineer assignment and availability

### 4. Status Management
- Track call statuses (scheduled, in_progress, completed, cancelled)
- Status transitions and workflow rules
- Automatic status updates based on time

### 5. Integration Points
- Claims system integration
- Unit/building hierarchy
- Engineer availability calendar
- Notification system

## Technical Implementation

### Database Schema
```sql
-- engineer_calls table
CREATE TABLE engineer_calls (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  start_datetime TIMESTAMP NOT NULL,
  end_datetime TIMESTAMP NOT NULL,
  project_id INTEGER REFERENCES units(id),
  engineer_id UUID REFERENCES users(id),
  unit_id INTEGER REFERENCES units(id),
  claim_id INTEGER REFERENCES claims(id),
  status VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_engineer_calls_project ON engineer_calls(project_id);
CREATE INDEX idx_engineer_calls_engineer ON engineer_calls(engineer_id);
CREATE INDEX idx_engineer_calls_dates ON engineer_calls(start_datetime, end_datetime);
```

### Key Components

#### EngineerCallModal
- Form for creating/editing calls
- Project → Building → Unit → Claim cascade
- Time slot validation (8:00-21:00)
- 15-minute time intervals
- Auto-fill engineer from current user

#### EngineerCallsCalendar
- React Big Calendar integration
- Event display with tooltips
- Drag-and-drop support
- Click to edit, double-click to create
- Status-based color coding

#### API Hooks
```typescript
// Entity hooks
useEngineerCalls(projectId, filters)
useCreateEngineerCall()
useUpdateEngineerCall()
useDeleteEngineerCall()
useEngineers()
useEngineerCallStatuses()
```

## Common Issues & Solutions

### Issue 1: Dropdowns Not Loading
**Problem**: Building/Unit/Claim dropdowns remain empty after project selection
**Solution**: 
1. Ensure queries are enabled when project is selected
2. Check project_id is properly passed to queries
3. Verify RLS policies allow reading units for selected project

### Issue 2: Calendar Not Displaying Events
**Problem**: Engineer calls not showing on calendar
**Solution**:
1. Check date format compatibility with React Big Calendar
2. Verify event transformation includes required fields (start, end, title)
3. Ensure real-time subscriptions are active

### Issue 3: Time Validation Errors
**Problem**: Invalid time selections or out-of-range times
**Solution**:
1. Implement proper time rounding to 15-minute intervals
2. Enforce 8:00-21:00 time constraints
3. Validate end time > start time

## Performance Optimizations

1. **Query Optimization**
   - Use indexed fields for filtering
   - Implement pagination for large datasets
   - Cache engineer and status lists

2. **UI Responsiveness**
   - Debounce search inputs
   - Virtual scrolling for long lists
   - Lazy load calendar events

3. **Real-time Updates**
   - Subscribe only to relevant project's calls
   - Batch updates to prevent flickering
   - Optimistic UI updates

## Testing Checklist

- [ ] Create new engineer call with all fields
- [ ] Edit existing call and save changes
- [ ] Delete call with confirmation
- [ ] Drag call to new time slot
- [ ] Filter calls by engineer/status
- [ ] Project switching updates available units
- [ ] Building selection filters units correctly
- [ ] Unit selection filters claims correctly
- [ ] Time validation prevents invalid selections
- [ ] Calendar displays calls correctly in all views