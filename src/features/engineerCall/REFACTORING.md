# EngineerCallModal Refactoring

## Overview

The `EngineerCallModalModern.tsx` component (933 lines) has been refactored into a modular structure following Feature-Sliced Design principles. The refactored version is organized into smaller, reusable components and custom hooks.

## File Structure

```
src/features/engineerCall/
├── EngineerCallModalModern.tsx              # Original file (933 lines, kept for reference)
├── EngineerCallModalModern.refactored.tsx   # Refactored main modal (~240 lines)
├── REFACTORING.md                           # This documentation
├── ui/                                       # UI Components
│   ├── index.ts                             # UI exports
│   ├── CallBasicInfo.tsx                    # Title input section
│   ├── CallDateTime.tsx                     # Date/time pickers with quick duration
│   ├── CallAssignment.tsx                   # Project and engineer selection
│   ├── CallLocation.tsx                     # Building, unit, claim selection
│   ├── CallStatusAndNotes.tsx               # Status dropdown and notes textarea
│   └── CallAttachmentsSection.tsx           # File attachments section
└── model/                                    # Business Logic Hooks
    ├── index.ts                             # Model exports
    ├── useEngineerCallForm.ts               # Form state management
    ├── useProjectData.ts                    # Project/unit/claim data loading
    ├── useFilteredData.ts                   # Data filtering and sorting logic
    └── useEngineerCallAttachments.ts        # Attachment handling logic
```

## Component Breakdown

### Main Modal Component
**File**: `EngineerCallModalModern.refactored.tsx` (~240 lines)

- Orchestrates all child components
- Handles modal visibility and footer actions
- Manages submission flow
- Coordinates between hooks and UI components

### UI Components (`ui/` folder)

#### 1. CallBasicInfo (~30 lines)
- Single input field for call title
- Required validation
- Icon prefix

#### 2. CallDateTime (~130 lines)
- Date picker
- Start/end time pickers
- Time validation (end must be after start)
- Quick duration buttons (30min, 1hr, 2hr)

#### 3. CallAssignment (~90 lines)
- Project dropdown (filtered by user role)
- Engineer dropdown
- Handles project change with form value preservation

#### 4. CallLocation (~180 lines)
- Building dropdown (filtered by selected project)
- Unit dropdown (filtered by building)
- Claim dropdown (filtered by unit)
- "View Claim" button when claim is selected
- Cascading resets when parent selections change

#### 5. CallStatusAndNotes (~60 lines)
- Status dropdown with color indicators
- Notes textarea with auto-resize

#### 6. CallAttachmentsSection (~60 lines)
- File upload interface
- Remote files list (existing attachments)
- New files list (pending upload)
- Preview and delete actions

### Custom Hooks (`model/` folder)

#### 1. useEngineerCallForm (~110 lines)
**Purpose**: Form state and initialization logic

**Returns**:
- `form` - Ant Design form instance
- `selectedProject/Building/Unit` - Filter states
- `setSelectedProject/Building/Unit` - Filter setters
- `resetForm` - Reset all form state

**Responsibilities**:
- Initialize form based on mode (create/edit/calendar)
- Handle form values for edit mode
- Set default values for new calls
- Manage form reset on modal close

#### 2. useProjectData (~110 lines)
**Purpose**: Load and filter project-related data

**Parameters**:
- `selectedProject` - Current project ID
- `selectedUnit` - Current unit ID

**Returns**:
- `projects` - Filtered projects (based on user role)
- `units` - Units for selected project
- `buildings` - Unique buildings from units
- `projectClaims` - Claims for selected project/unit
- `unitsLoading/claimsLoading` - Loading states

**Responsibilities**:
- Filter projects by user role (ADMIN sees all)
- Load units when project changes
- Load claims when project/unit changes
- Extract and sort unique buildings

#### 3. useFilteredData (~70 lines)
**Purpose**: Sort and filter loaded data

**Parameters**:
- `units` - All units
- `claims` - All claims
- `selectedProject` - Current project
- `selectedBuilding` - Current building

**Returns**:
- `filteredUnits` - Sorted units (by building if selected)
- `filteredClaims` - Sorted claims (by claim number)

**Responsibilities**:
- Smart numeric sorting for units (e.g., "10" comes after "9")
- Building-based unit filtering
- Claim number natural sorting

#### 4. useEngineerCallAttachments (~90 lines)
**Purpose**: Manage file attachments

**Parameters**:
- `callId` - Engineer call ID (null for new calls)
- `userId` - Current user ID

**Returns**:
- `remoteFiles` - Existing attachments
- `newFiles` - Files to upload
- `previewFile` - File being previewed
- `handleFilesAdd/RemoveNew/RemoveRemote` - File management
- `handlePreview/ClosePreview` - Preview handlers
- `uploadNewFiles` - Upload pending files
- `resetAttachments` - Reset state

**Responsibilities**:
- Track new files before upload
- Load existing attachments
- Handle file deletion
- Manage preview state
- Upload files to Supabase Storage

## Benefits of Refactoring

### 1. Maintainability
- Each component has a single responsibility
- Easy to locate and fix bugs
- Clear separation of UI and logic

### 2. Reusability
- UI components can be reused in other modals
- Hooks can be used in different contexts
- Attachment logic shared across features

### 3. Testability
- Small components are easier to test
- Hooks can be tested independently
- Clear inputs and outputs

### 4. Performance
- Smaller components reduce re-render scope
- Memoization opportunities in child components
- Selective imports reduce bundle size

### 5. Developer Experience
- Easier to understand each piece
- Faster to make changes
- Better code navigation

## Migration Guide

### To Use the Refactored Version

1. **Rename files**:
   ```bash
   # Backup original
   mv EngineerCallModalModern.tsx EngineerCallModalModern.original.tsx

   # Use refactored version
   mv EngineerCallModalModern.refactored.tsx EngineerCallModalModern.tsx
   ```

2. **No API changes** - The props interface remains identical:
   ```typescript
   interface EngineerCallModalProps {
     visible: boolean;
     onClose: () => void;
     onSubmit: (data: EngineerCallFormData, newFiles?: File[]) => void;
     initialData?: EngineerCallWithNames | null;
     initialDateTime?: { start: Date; end: Date };
     loading?: boolean;
   }
   ```

3. **Test thoroughly**:
   - Create new engineer call
   - Edit existing engineer call
   - Create from calendar (initialDateTime)
   - Test file uploads
   - Test cascading dropdowns
   - Verify all validations work

## Key Design Decisions

### Why Custom Hooks?
- **State Logic Reuse**: Form initialization logic used across multiple scenarios
- **Side Effect Management**: Centralize data loading and filtering
- **Testability**: Hooks can be tested without rendering components

### Why Small Components?
- **Cognitive Load**: Each component fits on one screen
- **React Optimization**: Easier to apply React.memo where needed
- **Composition**: Main modal reads like a table of contents

### Why Keep Form in Parent?
- Form instance needs to be shared across components
- Ant Design Form context works best at parent level
- Submission logic requires access to all form values

### Console Logging
- Debug logs preserved for form value tracking
- Useful for debugging cascading dropdown issues
- Can be removed or gated behind DEBUG flag later

## Future Improvements

### Potential Optimizations
1. **Memoization**: Add React.memo to UI components
2. **Lazy Loading**: Code-split modal and attachments
3. **Virtual Scrolling**: For long unit/claim lists
4. **Debouncing**: On search/filter inputs

### Additional Extractions
1. **useEngineerCallValidation**: Extract validation rules
2. **useEngineerCallSubmit**: Extract submission logic
3. **CallFormSkeleton**: Loading state component
4. **useFormPreservation**: Generic hook for preserving values

### Testing Strategy
1. **Unit Tests**: Test each hook independently
2. **Component Tests**: Test UI components with mock data
3. **Integration Tests**: Test full modal flow
4. **E2E Tests**: Test user scenarios in Playwright

## Lines of Code Comparison

| File | Original | Refactored | Reduction |
|------|----------|------------|-----------|
| Main Modal | 933 | 240 | -693 (-74%) |
| UI Components | 0 | 550 | +550 |
| Custom Hooks | 0 | 380 | +380 |
| **Total** | **933** | **1,170** | **+237** |

While total LOC increased by ~25%, the code is now:
- 74% reduction in main file complexity
- Organized into 10 focused files
- Average file size: ~110 lines
- Much easier to maintain and extend

## Conclusion

This refactoring demonstrates Feature-Sliced Design principles in action:
- **Clear boundaries**: UI vs. logic separation
- **Single responsibility**: Each file has one job
- **Composability**: Components work together seamlessly
- **Scalability**: Easy to add new sections or modify existing ones

The original 933-line file is now a clean composition of well-organized modules, making it significantly easier for developers to understand, modify, and maintain.
