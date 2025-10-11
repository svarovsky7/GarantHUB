# Component Tree Structure

## Visual Hierarchy

```
EngineerCallModalModern (Refactored)
├── ConfigProvider (Ant Design - Russian locale)
│   └── Modal
│       ├── Form
│       │   ├── CallBasicInfo
│       │   │   └── Form.Item (title)
│       │   │       └── Input
│       │   │
│       │   ├── CallDateTime
│       │   │   ├── Form.Item (date)
│       │   │   │   └── DatePicker
│       │   │   ├── Form.Item (startTime)
│       │   │   │   └── TimePicker
│       │   │   ├── Form.Item (endTime)
│       │   │   │   └── TimePicker (with validator)
│       │   │   └── Quick Duration Buttons
│       │   │       └── Tag x3 (30min, 1hr, 2hr)
│       │   │
│       │   ├── CallAssignment
│       │   │   ├── Form.Item (project_id)
│       │   │   │   └── Select (projects)
│       │   │   └── Form.Item (engineer_id)
│       │   │       └── Select (engineers)
│       │   │
│       │   ├── CallLocation
│       │   │   ├── Form.Item (building)
│       │   │   │   └── Select (buildings - filtered)
│       │   │   ├── Form.Item (unit_id)
│       │   │   │   └── Select (units - filtered)
│       │   │   └── Form.Item (claim_id)
│       │   │       ├── Select (claims - filtered)
│       │   │       └── Button (View Claim)
│       │   │
│       │   ├── CallStatusAndNotes
│       │   │   ├── Form.Item (status)
│       │   │   │   └── Select (statuses with colors)
│       │   │   └── Form.Item (notes)
│       │   │       └── TextArea
│       │   │
│       │   └── CallAttachmentsSection
│       │       └── Form.Item (files)
│       │           └── EngineerCallAttachments
│       │               ├── Upload Button
│       │               ├── Remote Files List
│       │               └── New Files List
│       │
│       └── FilePreviewModal (conditional)
│
└── ClaimViewModal (conditional - outside main modal)
```

## Data Flow Diagram

```
┌─────────────────────────────────────────┐
│   EngineerCallModalModern (Main)        │
│                                          │
│  Props:                                  │
│  - visible, onClose, onSubmit           │
│  - initialData, initialDateTime         │
└────────────┬────────────────────────────┘
             │
             ├─────────────────────────────────┐
             │                                 │
             v                                 v
┌──────────────────────┐          ┌──────────────────────┐
│   Custom Hooks       │          │   External Data      │
├──────────────────────┤          ├──────────────────────┤
│                      │          │                      │
│ useEngineerCallForm  │◄─────────┤ useEngineers()       │
│ ├─ form              │          │ useStatuses()        │
│ ├─ selectedProject   │          │ useProjects()        │
│ ├─ selectedBuilding  │          │ useAuthStore()       │
│ └─ selectedUnit      │          └──────────────────────┘
│                      │
│ useProjectData       │
│ ├─ projects          │
│ ├─ units             │
│ ├─ buildings         │
│ └─ claims            │
│                      │
│ useFilteredData      │
│ ├─ filteredUnits     │
│ └─ filteredClaims    │
│                      │
│ useCallAttachments   │
│ ├─ remoteFiles       │
│ ├─ newFiles          │
│ └─ handlers          │
└──────────┬───────────┘
           │
           │ Data flows down to UI components
           │
           v
┌─────────────────────────────────────────┐
│         UI Components (Props)            │
├─────────────────────────────────────────┤
│                                          │
│ CallBasicInfo                            │
│ - No props (uses Form context)          │
│                                          │
│ CallDateTime                             │
│ - form (for quick duration buttons)     │
│                                          │
│ CallAssignment                           │
│ - form, projects, engineers              │
│ - onProjectChange handler                │
│                                          │
│ CallLocation                             │
│ - form, selected states                  │
│ - buildings, filteredUnits, filteredClaims│
│ - loading states                         │
│ - change handlers, onViewClaim           │
│                                          │
│ CallStatusAndNotes                       │
│ - statusOptions                          │
│                                          │
│ CallAttachmentsSection                   │
│ - remoteFiles, newFiles                  │
│ - file handlers                          │
└─────────────────────────────────────────┘
```

## Hook Dependencies

```
useEngineerCallForm
├─ Inputs: visible, initialData, initialDateTime, statusOptions
├─ External: useAuthStore, useProjectId, useDefaultStatus
└─ Returns: form, selected states, setters, resetForm

useProjectData
├─ Inputs: selectedProject, selectedUnit
├─ External: useProjects, useAuthStore, useQuery (Supabase)
└─ Returns: projects, units, buildings, claims, loading states

useFilteredData
├─ Inputs: units, claims, selectedProject, selectedBuilding
├─ External: None (pure transformation)
└─ Returns: filteredUnits, filteredClaims

useEngineerCallAttachments
├─ Inputs: callId, userId
├─ External: useEngineerCallAttachments (entity), useMutations
└─ Returns: files, previewFile, handlers
```

## State Management Strategy

### Local State (useState)
- `viewClaimId` - Modal state for claim viewer
- `formInitialized` - Form initialization flag (in hook)
- `selectedProject/Building/Unit` - Filter states (in hook)
- `newFiles` - Pending file uploads (in hook)
- `previewFile` - File preview state (in hook)

### Form State (Ant Design Form)
- `title` - Call title
- `date` - Call date
- `startTime` - Start time
- `endTime` - End time
- `project_id` - Selected project
- `engineer_id` - Assigned engineer
- `unit_id` - Selected unit
- `claim_id` - Related claim
- `status` - Call status
- `notes` - Additional notes

### Server State (React Query)
- `engineers` - All engineers list
- `statuses` - Engineer call statuses
- `projects` - User's accessible projects
- `units` - Units for selected project
- `claims` - Claims for selected project/unit
- `remoteFiles` - Existing attachments

### Global State (Zustand)
- `profile` - Current user profile
- `currentProjectId` - Active project

## Component Communication

```
Parent (Modal)
│
├─ Provides to children:
│  ├─ Form instance (via Form.Provider context)
│  ├─ Data from hooks (via props)
│  └─ Event handlers (via props)
│
├─ Receives from children:
│  ├─ Form changes (via Form context)
│  ├─ User interactions (via handler callbacks)
│  └─ None (children are presentational)
│
└─ External communication:
   ├─ onSubmit → Parent component (form data + files)
   ├─ onClose → Parent component (modal closed)
   └─ Supabase → File uploads, data queries
```

## Performance Considerations

### Current Implementation
- **No memoization**: Components re-render on any parent state change
- **All hooks run**: Even if their data isn't needed
- **Inline functions**: New function references on every render

### Optimization Opportunities
```
1. Memoize UI components
   - React.memo(CallBasicInfo)
   - React.memo(CallDateTime)
   - etc.

2. Memoize callbacks
   - useCallback(handleProjectChange, [deps])
   - useCallback(handleBuildingChange, [deps])
   - etc.

3. Conditional hook execution
   - Skip useProjectData if no project selected
   - Skip useFilteredData if no data loaded

4. Debounce filters
   - Debounce building/unit selection
   - Reduce query frequency
```

## Error Handling Flow

```
UI Component → Form Validation → Ant Design Error Display
     ↓              ↓
User Input     Invalid Input → Show error message under field
     ↓              ↓
Submit         Valid Input → handleFinish()
                    ↓
              Format data → EngineerCallFormData
                    ↓
              onSubmit (prop callback)
                    ↓
         ┌──────────┴──────────┐
         │                     │
    New Call            Existing Call
         │                     │
    With files          Without files
         │                     │
    Pass files          Update only
    to onSubmit         ↓
         │         Upload new files
         │         (if any)
         │              │
         └──────────────┘
                    ↓
              Success/Error handling
              in parent component
```

## File Organization Rationale

### Why `ui/` folder?
- Groups related UI components
- Clear separation from business logic
- Easy to find component files
- Follows FSD layer structure

### Why `model/` folder?
- Houses business logic hooks
- Separates data management from presentation
- Makes testing easier
- Reusable across different UI implementations

### Why index files?
- Clean imports in parent component
- Explicit public API
- Easy to refactor internal structure
- Follows FSD slice pattern

## Import Strategy

### Main Modal Imports
```typescript
// External libraries
import React, { ... } from 'react';
import { Modal, Form, ... } from 'antd';
import dayjs from 'dayjs';

// Entity layer (data fetching)
import { useEngineers, ... } from '@/entities/engineerCall';

// Feature layer (sibling components)
import FilePreviewModal from '@/shared/ui/FilePreviewModal';
import ClaimViewModal from '@/features/claim/ClaimViewModal';

// Same feature (local imports)
import { CallBasicInfo, ... } from './ui';
import { useEngineerCallForm, ... } from './model';
```

### Component Imports
```typescript
// Minimal external dependencies
import React from 'react';
import { Form, Input, ... } from 'antd';
import type { FormInstance } from 'antd';

// Clear prop interfaces
interface CallDateTimeProps {
  form: FormInstance;
}
```

This structure ensures:
- Clear dependency flow (top-down)
- No circular dependencies
- Minimal coupling between components
- Easy to trace data flow
