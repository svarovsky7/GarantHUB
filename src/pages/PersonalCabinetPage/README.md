# PersonalCabinetPage - Refactored Structure

This page has been refactored from a monolithic 1023-line component into a modular, maintainable structure following FSD architecture principles.

## Structure

```
PersonalCabinetPage/
├── PersonalCabinetPage.tsx          # Original file (preserved)
├── PersonalCabinetPageRefactored.tsx # New refactored main component (~200 lines)
├── README.md                         # This file
├── ui/                              # UI components
│   ├── index.ts                     # Public exports
│   ├── PageHeader.tsx               # Header with user info and project count
│   ├── StatsCards.tsx               # Statistics cards (claims, defects, letters, calls)
│   ├── ClaimsSection.tsx            # Claims table with expandable defects
│   ├── DefectsTable.tsx             # Nested defects table component
│   ├── EngineerCallsSection.tsx     # Upcoming engineer calls list
│   └── LettersSection.tsx           # User letters table
└── model/                           # Business logic hooks
    ├── index.ts                     # Public exports
    ├── usePersonalCabinetData.ts    # Data fetching hooks
    ├── usePersonalCabinetStats.ts   # Statistics calculation hook
    └── usePersonalCabinetMutations.ts # Update mutations

```

## Components Breakdown

### Main Component (PersonalCabinetPageRefactored.tsx)
- Orchestrates all child components
- Manages modal states (view claim, defect, call, letter)
- Manages editing states (claim status, defect status, call status)
- Handles loading and empty states
- ~200 lines (reduced from 1023)

### UI Components

#### PageHeader
- Displays user name/email and role
- Shows project count alert
- **Props:** userName, userEmail, userRole, projectsCount

#### StatsCards
- Four statistics cards in a responsive grid
- Active vs total counts for claims, defects, letters, calls
- Color-coded based on status
- **Props:** stats object

#### ClaimsSection
- Table of claims with expandable rows for defects
- Inline status editing for claims
- Embedded DefectsTable for each claim
- Multiple sortable columns with date formatting
- **Props:** claimsWithDefects, statuses, editing states, callbacks

#### DefectsTable
- Nested table showing defects for a claim
- Inline status editing
- Executor, dates, warranty indicator
- View defect action
- **Props:** defects, statuses, editing states, callbacks

#### EngineerCallsSection
- List of upcoming engineer calls
- Shows call details (project, unit, claim)
- Inline status editing
- **Props:** engineerCalls, statuses, editing states, callbacks

#### LettersSection
- Table of user's letters
- Sender/receiver information
- Status badges
- **Props:** letters, onViewLetter callback

### Model Hooks

#### usePersonalCabinetData.ts
- `useUserProjects()` - Fetches user's assigned projects
- `useUserClaims()` - Fetches user's claims
- `useUserClaimsWithDefects()` - Fetches claims with nested defects and relations
- `useUserLetters()` - Fetches user's letters
- `useUserEngineerCalls()` - Fetches user's engineer calls

All hooks include proper error handling and logging.

#### usePersonalCabinetStats.ts
- `usePersonalCabinetStats()` - Calculates statistics from data
- Memoized for performance
- Returns active vs total counts for all entity types

#### usePersonalCabinetMutations.ts
- `useUpdateClaimStatus()` - Mutation for updating claim status
- `useUpdateDefectStatus()` - Mutation for updating defect status
- `useUpdateEngineerCallStatus()` - Mutation for updating call status

All mutations include success/error messages and query invalidation.

## Benefits of Refactoring

1. **Modularity:** Each component has a single responsibility
2. **Reusability:** UI components can be used elsewhere if needed
3. **Testability:** Smaller components are easier to test
4. **Maintainability:** Changes are localized to specific files
5. **Readability:** Main component is now ~200 lines instead of 1023
6. **Performance:** Components can be memoized independently
7. **Type Safety:** Proper TypeScript interfaces for all props
8. **Separation of Concerns:** UI, data fetching, and business logic separated

## Migration Guide

To use the refactored version:

1. Update the import in Router or wherever PersonalCabinetPage is used
2. Change from:
   ```tsx
   import PersonalCabinetPage from '@/pages/PersonalCabinetPage/PersonalCabinetPage';
   ```
   To:
   ```tsx
   import PersonalCabinetPage from '@/pages/PersonalCabinetPage/PersonalCabinetPageRefactored';
   ```

3. Or rename PersonalCabinetPageRefactored.tsx to PersonalCabinetPage.tsx after testing

## Testing Checklist

- [ ] Page loads without errors
- [ ] Statistics cards show correct counts
- [ ] Claims table displays and expands correctly
- [ ] Defects table shows nested in expanded rows
- [ ] Status editing works for claims
- [ ] Status editing works for defects
- [ ] Status editing works for engineer calls
- [ ] View modals open correctly (claim, defect, call, letter)
- [ ] Engineer calls section shows upcoming calls
- [ ] Letters section displays correctly
- [ ] Empty states display when no data
- [ ] Loading state shows during data fetch
- [ ] No projects warning displays correctly
- [ ] All sorting functions work
- [ ] Date formatting is correct
- [ ] Responsive layout works on mobile

## Performance Considerations

- All child components are candidates for React.memo() if needed
- Statistics calculation is already memoized
- Consider virtualizing tables if row count exceeds 100
- Data fetching hooks use proper React Query caching

## Future Improvements

- Add React.memo to list item components
- Extract status editing logic into a shared component
- Add unit tests for hooks and components
- Consider adding error boundaries
- Add skeleton loading states instead of spinner
