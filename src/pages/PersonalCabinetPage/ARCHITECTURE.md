# PersonalCabinetPage Architecture

## Component Hierarchy

```
PersonalCabinetPageRefactored (248 lines)
│
├─── PageHeader
│    └─── Displays: User info, project count
│
├─── StatsCards
│    ├─── Card: Active Claims
│    ├─── Card: Active Defects
│    ├─── Card: Unread Letters
│    └─── Card: Upcoming Calls
│
├─── ClaimsSection
│    └─── Table (expandable rows)
│         └─── DefectsTable (nested)
│              └─── Each defect row with actions
│
├─── EngineerCallsSection
│    └─── List of upcoming calls
│         └─── Each call with details and status editor
│
├─── LettersSection
│    └─── Table of letters
│         └─── Each letter row with actions
│
└─── Modals (conditional rendering)
     ├─── ClaimViewModal
     ├─── DefectViewModal
     ├─── EngineerCallModal
     └─── LetterViewModal
```

## Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                  PersonalCabinetPageRefactored              │
│                                                             │
│  State:                                                     │
│  • viewClaimId, viewDefectId, viewCallId, viewLetterId     │
│  • editingClaimStatus, editingDefectStatus, editingCallStatus│
│                                                             │
│  Data Hooks (from model/):                                 │
│  • useUserProjects()           → userProjects[]            │
│  • useUserClaims()             → claims[]                  │
│  • useUserClaimsWithDefects()  → claimsWithDefects[]       │
│  • useUserLetters()            → letters[]                 │
│  • useUserEngineerCalls()      → engineerCalls[]           │
│                                                             │
│  Computed:                                                  │
│  • allDefects (from claimsWithDefects)                     │
│  • stats (from usePersonalCabinetStats hook)               │
│                                                             │
│  Mutations (from model/):                                  │
│  • updateClaimStatus.mutate()                              │
│  • updateDefectStatus.mutate()                             │
│  • updateEngineerCallStatus.mutate()                       │
└─────────────────────────────────────────────────────────────┘
                               │
          ┌────────────────────┼────────────────────┐
          ▼                    ▼                    ▼
    ┌─────────┐          ┌──────────┐        ┌──────────┐
    │   UI    │          │  Model   │        │ Features │
    │ Layer   │          │  Layer   │        │ (Modals) │
    └─────────┘          └──────────┘        └──────────┘
```

## UI Components Details

### PageHeader
**Responsibility:** Display user information and project context
- **Input:** userName, userEmail, userRole, projectsCount
- **Output:** Visual header with user details
- **State:** None (pure presentational)

### StatsCards
**Responsibility:** Display key metrics in card format
- **Input:** stats object with counts
- **Output:** 4 responsive cards
- **State:** None (pure presentational)
- **Logic:** Color-coding based on active count

### ClaimsSection
**Responsibility:** Display and manage claims with defects
- **Input:** claimsWithDefects, statuses, editing states, callbacks
- **Output:** Expandable table with nested defects
- **State:** Managed by parent (editing status)
- **Child:** DefectsTable (for expanded rows)
- **Features:**
  - Sortable columns
  - Inline status editing
  - View claim action
  - Expandable rows for defects

### DefectsTable
**Responsibility:** Display defects for a claim
- **Input:** defects, statuses, editing states, callbacks
- **Output:** Nested table with defect details
- **State:** Managed by parent (editing status)
- **Features:**
  - Status editing
  - Executor display
  - Date formatting
  - Warranty indicator
  - View defect action

### EngineerCallsSection
**Responsibility:** Display upcoming engineer calls
- **Input:** engineerCalls, statuses, editing states, callbacks
- **Output:** List of calls with details
- **State:** Managed by parent (editing status)
- **Features:**
  - Status editing
  - Call details (project, unit, claim)
  - View call action
  - Filters to upcoming calls only

### LettersSection
**Responsibility:** Display user's letters
- **Input:** letters, onViewLetter callback
- **Output:** Table of letters
- **State:** None
- **Features:**
  - Sender/receiver display
  - Status badges
  - View letter action
  - Sortable columns

## Model Hooks Details

### usePersonalCabinetData.ts
**Exports 5 hooks:**

1. **useUserProjects()**
   - Fetches: User's assigned project IDs from profiles_projects
   - Returns: number[]
   - Dependencies: profile.id

2. **useUserClaims(projectIds)**
   - Fetches: Claims where user is engineer
   - Returns: Claim[]
   - Dependencies: profile.id, projectIds
   - Includes: claim_status relation

3. **useUserClaimsWithDefects(projectIds)**
   - Fetches: Claims with nested defects and full relations
   - Returns: ClaimWithDefects[]
   - Dependencies: profile.id, projectIds
   - Complex: Multiple queries to build complete data
   - Includes: units, project, defects with all relations

4. **useUserLetters(projectIds)**
   - Fetches: Letters where user is responsible
   - Returns: Letter[]
   - Dependencies: profile.id, projectIds
   - Includes: sender, receiver, status relations

5. **useUserEngineerCalls(projectIds)**
   - Fetches: Engineer calls assigned to user
   - Returns: EngineerCall[]
   - Dependencies: profile.id, projectIds
   - Includes: project, unit, claim relations

### usePersonalCabinetStats.ts
**Exports 1 hook:**

**usePersonalCabinetStats(claims, allDefects, letters, engineerCalls)**
- Calculates: Active vs total counts for all entities
- Returns: StatsObject
- Memoized: Yes (useMemo)
- Logic:
  - Active claims: Not closed or rejected
  - Active defects: Not fixed or closed
  - Unread letters: New or unread status
  - Upcoming calls: Future date and not completed

### usePersonalCabinetMutations.ts
**Exports 3 hooks:**

1. **useUpdateClaimStatus(onSuccess?)**
   - Mutates: claim.claim_status_id
   - Invalidates: user-claims, user-claims-with-defects queries
   - Feedback: Success/error messages

2. **useUpdateDefectStatus(onSuccess?)**
   - Mutates: defect.status_id
   - Invalidates: user-claims-with-defects query
   - Feedback: Success/error messages

3. **useUpdateEngineerCallStatus(onSuccess?)**
   - Mutates: engineer_call.status
   - Invalidates: user-engineer-calls query
   - Feedback: Success/error messages

## State Management

### Local State (Component)
- Modal visibility (viewClaimId, viewDefectId, etc.)
- Editing status IDs (editingClaimStatus, editingDefectStatus, etc.)

### Server State (React Query)
- All data fetching via custom hooks
- Automatic caching and invalidation
- Loading and error states managed by React Query

### Computed State (useMemo)
- allDefects: Extracted from claimsWithDefects
- stats: Calculated from all data arrays

## Event Flow Example: Update Claim Status

```
1. User clicks claim status tag
   └─→ ClaimsSection: onEditClaimStatus(claimId)
       └─→ PersonalCabinetPage: setEditingClaimStatus(claimId)
           └─→ ClaimsSection re-renders with Select instead of Tag

2. User selects new status
   └─→ ClaimsSection: onUpdateClaimStatus(claimId, statusId)
       └─→ PersonalCabinetPage: updateClaimStatus.mutate({...})
           └─→ useUpdateClaimStatus hook executes mutation
               ├─→ Supabase: UPDATE claims SET claim_status_id = ...
               ├─→ Success message displayed
               ├─→ Query invalidation: user-claims, user-claims-with-defects
               └─→ Callback: setEditingClaimStatus(null)
                   └─→ ClaimsSection re-renders with Tag (not editing)
                       └─→ Data refetch triggered by invalidation
                           └─→ Table updates with new status
```

## Performance Considerations

### Current Optimizations
- ✅ React Query caching
- ✅ useMemo for stats calculation
- ✅ useMemo for allDefects extraction
- ✅ Proper query key structure
- ✅ Selective query invalidation

### Future Optimizations
- [ ] React.memo() for list items
- [ ] useCallback for event handlers
- [ ] Virtual scrolling for large tables
- [ ] Pagination for claims/letters
- [ ] Debounced status updates
- [ ] Optimistic updates for status changes

## Bundle Impact

**Estimated bundle size:**
- New components: ~15 KB (minified)
- Reduction in main component: ~30 KB (from splitting)
- Net impact: +15 KB due to proper typing and exports

**Code splitting opportunities:**
- Modals already lazy-loaded via feature layer
- Could lazy-load individual sections if needed
- Table components could be code-split

## Accessibility

### Current Support
- ✅ Semantic HTML (Card, Table, List)
- ✅ ARIA attributes (via Ant Design)
- ✅ Keyboard navigation (tables, buttons)
- ✅ Screen reader friendly (proper labels)

### Future Improvements
- [ ] Add ARIA live regions for status updates
- [ ] Keyboard shortcuts for quick actions
- [ ] Focus management in modals
- [ ] Skip navigation links

## Testing Strategy

### Unit Tests (Recommended)
```typescript
// Model hooks
describe('usePersonalCabinetStats', () => {
  it('calculates active claims correctly', () => {
    // Test stats calculation
  });
});

// UI components
describe('StatsCards', () => {
  it('renders all four cards', () => {
    // Test rendering
  });

  it('applies correct colors based on count', () => {
    // Test color logic
  });
});
```

### Integration Tests (Recommended)
```typescript
describe('PersonalCabinetPage', () => {
  it('loads user data and displays stats', () => {
    // Mock React Query
    // Render component
    // Assert stats are correct
  });

  it('updates claim status successfully', () => {
    // Mock mutation
    // Click status tag
    // Select new status
    // Assert mutation called
  });
});
```

### E2E Tests (Optional)
- Full user flow: view claims → expand defects → update status
- Modal interactions: view → edit → save
- Filtering and sorting

## Migration Checklist

- [x] Create ui/ directory with components
- [x] Create model/ directory with hooks
- [x] Extract PageHeader component
- [x] Extract StatsCards component
- [x] Extract ClaimsSection component
- [x] Extract DefectsTable component
- [x] Extract EngineerCallsSection component
- [x] Extract LettersSection component
- [x] Create data fetching hooks
- [x] Create statistics hook
- [x] Create mutation hooks
- [x] Create main refactored component
- [x] Add index.ts exports
- [x] Verify build passes
- [x] Verify linter passes
- [x] Write documentation (README.md)
- [x] Write summary (REFACTORING_SUMMARY.md)
- [x] Write architecture doc (this file)
- [ ] Update Router import (if needed)
- [ ] Test in development
- [ ] Test in production
- [ ] Remove original file (after validation)
