# Engineer Call Feature

## Overview

This feature provides a comprehensive modal interface for creating and editing engineer calls (service appointments). It has been refactored from a single 933-line component into a modular, maintainable structure following Feature-Sliced Design principles.

## Quick Start

### Using the Component

```typescript
import EngineerCallModalModern from '@/features/engineerCall/EngineerCallModalModern';

// In your component
<EngineerCallModalModern
  visible={isModalOpen}
  onClose={handleClose}
  onSubmit={handleSubmit}
  initialData={callToEdit} // Optional: for editing
  initialDateTime={{ start: new Date(), end: new Date() }} // Optional: from calendar
  loading={isSaving}
/>
```

### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `visible` | `boolean` | Yes | Modal visibility state |
| `onClose` | `() => void` | Yes | Called when modal closes |
| `onSubmit` | `(data, files?) => void` | Yes | Called on form submission |
| `initialData` | `EngineerCallWithNames` | No | Call data for editing |
| `initialDateTime` | `{start, end}` | No | Pre-set date/time (from calendar) |
| `loading` | `boolean` | No | Submit button loading state |

## Directory Structure

```
src/features/engineerCall/
├── README.md                                 # This file
├── REFACTORING.md                            # Detailed refactoring documentation
├── COMPONENT_TREE.md                         # Visual component hierarchy
├── EngineerCallModalModern.tsx               # Original component (933 lines)
├── EngineerCallModalModern.refactored.tsx    # Refactored version (~240 lines)
├── EngineerCallAttachments.tsx               # Attachments list component (shared)
├── ui/                                        # UI Components (~550 lines total)
│   ├── index.ts                              # Public exports
│   ├── CallBasicInfo.tsx                     # Title input
│   ├── CallDateTime.tsx                      # Date/time selection
│   ├── CallAssignment.tsx                    # Project/engineer selection
│   ├── CallLocation.tsx                      # Building/unit/claim selection
│   ├── CallStatusAndNotes.tsx                # Status/notes fields
│   └── CallAttachmentsSection.tsx            # File attachments section
└── model/                                     # Business Logic (~380 lines total)
    ├── index.ts                              # Public exports
    ├── useEngineerCallForm.ts                # Form state management
    ├── useProjectData.ts                     # Data loading (projects/units/claims)
    ├── useFilteredData.ts                    # Data filtering/sorting
    └── useEngineerCallAttachments.ts         # File attachment handling
```

## Key Features

### 1. Cascading Dropdowns
- **Project** → Units/Claims
- **Building** → Units (filtered)
- **Unit** → Claims (filtered)

Form values are preserved when changing filters (date, time, status, etc. don't reset).

### 2. Quick Duration Buttons
Set end time quickly:
- 30 minutes
- 1 hour
- 2 hours

### 3. File Attachments
- Upload multiple files
- Preview images and PDFs
- Delete existing attachments
- Update attachment descriptions

### 4. Smart Defaults
- **New Call**: Next hour, 1-hour duration
- **From Calendar**: Use clicked time slot
- **Edit Mode**: Load existing data
- **Non-Admin Users**: Current project pre-selected

### 5. Role-Based Access
- **Admin**: See all projects, full access
- **Engineer/User**: See assigned projects only

### 6. Validation
- Required fields: title, date, start/end time, project
- End time must be after start time
- All fields validated on submission

### 7. Claim Integration
- View claim details directly from modal
- Claims filtered by selected unit
- Quick navigation to full claim view

## Component Responsibilities

### UI Components (`ui/`)

Each component is **presentational** - it receives data via props and calls callbacks for user actions.

- **No business logic** inside components
- **No direct API calls** or data fetching
- **Minimal state** (only UI-specific state like hover, focus)
- **Type-safe props** with clear interfaces

### Custom Hooks (`model/`)

Hooks encapsulate **business logic and data management**.

- **Data fetching** from Supabase
- **State management** for complex interactions
- **Side effects** (form initialization, file uploads)
- **Computed values** (filtering, sorting)

## Usage Examples

### Creating a New Call

```typescript
const [isOpen, setIsOpen] = useState(false);

const handleSubmit = async (data: EngineerCallFormData, files?: File[]) => {
  try {
    const result = await createEngineerCall(data);

    if (files && files.length > 0) {
      await uploadFiles(result.id, files);
    }

    message.success('Вызов создан');
    setIsOpen(false);
  } catch (error) {
    message.error('Ошибка при создании');
  }
};

<EngineerCallModalModern
  visible={isOpen}
  onClose={() => setIsOpen(false)}
  onSubmit={handleSubmit}
/>
```

### Editing an Existing Call

```typescript
const [editingCall, setEditingCall] = useState<EngineerCallWithNames | null>(null);

const handleEdit = (call: EngineerCallWithNames) => {
  setEditingCall(call);
};

const handleSubmit = async (data: EngineerCallFormData) => {
  if (!editingCall) return;

  try {
    await updateEngineerCall(editingCall.id, data);
    message.success('Вызов обновлен');
    setEditingCall(null);
  } catch (error) {
    message.error('Ошибка при обновлении');
  }
};

<EngineerCallModalModern
  visible={!!editingCall}
  initialData={editingCall}
  onClose={() => setEditingCall(null)}
  onSubmit={handleSubmit}
  loading={isUpdating}
/>
```

### Creating from Calendar Click

```typescript
const handleCalendarSlotClick = (slotInfo: SlotInfo) => {
  setInitialDateTime({
    start: slotInfo.start,
    end: slotInfo.end,
  });
  setIsOpen(true);
};

<EngineerCallModalModern
  visible={isOpen}
  initialDateTime={initialDateTime}
  onClose={() => {
    setIsOpen(false);
    setInitialDateTime(undefined);
  }}
  onSubmit={handleSubmit}
/>
```

## Customization

### Adding a New Field

1. **Add Form Item** to appropriate UI component:
```typescript
// ui/CallBasicInfo.tsx
<Form.Item name="priority" label="Приоритет">
  <Select>
    <Option value="high">Высокий</Option>
    <Option value="normal">Обычный</Option>
  </Select>
</Form.Item>
```

2. **Update Form Type**:
```typescript
// shared/types/engineerCall.ts
export interface EngineerCallFormData {
  // ... existing fields
  priority?: 'high' | 'normal' | 'low';
}
```

3. **Update Submit Handler**:
```typescript
// EngineerCallModalModern.refactored.tsx
const formData: EngineerCallFormData = {
  // ... existing fields
  priority: values.priority,
};
```

### Adding a New Section

1. **Create UI Component**:
```typescript
// ui/CallPriority.tsx
export const CallPriority: React.FC = () => {
  return (
    <Form.Item name="priority" label="Приоритет">
      {/* ... */}
    </Form.Item>
  );
};
```

2. **Export from index**:
```typescript
// ui/index.ts
export { default as CallPriority } from './CallPriority';
```

3. **Import and use**:
```typescript
// EngineerCallModalModern.refactored.tsx
import { CallPriority } from './ui';

// In render
<CallPriority />
```

### Creating a Custom Hook

```typescript
// model/useEngineerCallValidation.ts
export const useEngineerCallValidation = () => {
  const validateTitle = (title: string) => {
    if (title.length < 5) {
      return 'Название слишком короткое';
    }
    return null;
  };

  return { validateTitle };
};
```

## Testing

### Unit Testing Hooks

```typescript
import { renderHook } from '@testing-library/react-hooks';
import { useFilteredData } from './model/useFilteredData';

test('filters units by building', () => {
  const units = [
    { id: 1, name: '101', building: 'A', project_id: 1 },
    { id: 2, name: '102', building: 'B', project_id: 1 },
  ];

  const { result } = renderHook(() =>
    useFilteredData(units, [], 1, 'A')
  );

  expect(result.current.filteredUnits).toHaveLength(1);
  expect(result.current.filteredUnits[0].name).toBe('101');
});
```

### Component Testing

```typescript
import { render, screen } from '@testing-library/react';
import { Form } from 'antd';
import CallBasicInfo from './ui/CallBasicInfo';

test('renders title input', () => {
  render(
    <Form>
      <CallBasicInfo />
    </Form>
  );

  const input = screen.getByPlaceholderText(/Проверка протечки/);
  expect(input).toBeInTheDocument();
});
```

### Integration Testing

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import EngineerCallModalModern from './EngineerCallModalModern.refactored';

test('submits form with valid data', async () => {
  const handleSubmit = jest.fn();

  render(
    <EngineerCallModalModern
      visible={true}
      onClose={jest.fn()}
      onSubmit={handleSubmit}
    />
  );

  // Fill form
  fireEvent.change(screen.getByLabelText('Название вызова'), {
    target: { value: 'Test Call' }
  });

  // Submit
  fireEvent.click(screen.getByText('Создать'));

  await waitFor(() => {
    expect(handleSubmit).toHaveBeenCalled();
  });
});
```

## Performance

### Current Performance Characteristics

- **Initial Render**: ~50-100ms (depends on data size)
- **Form Interaction**: Instant (no debouncing needed)
- **Dropdown Filter**: Instant (memoized data)
- **File Upload**: Depends on file size and network

### Optimization Opportunities

1. **Memoization**: Add React.memo to UI components
2. **Lazy Loading**: Code-split modal and attachments
3. **Virtual Scrolling**: For long unit/claim lists (>1000 items)
4. **Debouncing**: On building/unit search inputs

## Troubleshooting

### Form Values Reset When Changing Project

**Issue**: Date, time, or status resets when selecting a different project.

**Solution**: This is intentional for unit/claim fields, but date/time/status should persist. Check that `currentValues` includes all fields you want to preserve in the `handleProjectChange` function.

### Attachments Not Uploading

**Issue**: Files aren't appearing after submission.

**Solution**:
1. Check Supabase Storage bucket permissions
2. Verify `VITE_ATTACH_BUCKET` env variable
3. Ensure user has upload permissions
4. Check network tab for upload errors

### Cascading Dropdowns Not Working

**Issue**: Unit dropdown doesn't update when selecting building.

**Solution**: Verify filter states are being updated correctly. Check console logs for form value preservation.

## Migration from Original

To switch from original to refactored version:

```bash
# Backup original
mv EngineerCallModalModern.tsx EngineerCallModalModern.original.tsx

# Use refactored
mv EngineerCallModalModern.refactored.tsx EngineerCallModalModern.tsx
```

No code changes needed - the API is identical!

## Related Documentation

- **[REFACTORING.md](./REFACTORING.md)** - Detailed refactoring process and decisions
- **[COMPONENT_TREE.md](./COMPONENT_TREE.md)** - Visual component hierarchy and data flow
- **Feature-Sliced Design** - Architecture pattern used for organization

## Contributing

When modifying this feature:

1. **Keep components small** - Each component should fit on one screen
2. **Extract logic to hooks** - Keep UI components presentational
3. **Preserve form values** - Don't reset unrelated fields on filter changes
4. **Add TypeScript types** - All props and return values should be typed
5. **Test thoroughly** - Test create, edit, and calendar scenarios
6. **Update documentation** - Keep README and REFACTORING.md in sync

## License

This code is part of the GarantHUB project.
