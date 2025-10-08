# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

GarantHUB is a comprehensive project management system for construction defects, claims, court cases, correspondence tracking, and document management. Built with React, TypeScript, Vite, and Supabase.

## Essential Commands

```bash
# Development
npm run dev              # Start dev server on http://localhost:3000
npm run build           # Production build with Vite
npm run preview         # Preview production build

# Code Quality - ALWAYS RUN BEFORE COMMITTING
npm run lint            # ESLint check with max-warnings=0
npm run typecheck       # TypeScript type checking (strict mode disabled)

# Testing
npm run test            # Run tests (custom test file - no test framework currently)

# Maintenance
npm run clean-cache     # Clear node_modules cache
npm run audit:fix       # Fix npm vulnerabilities
npm run analyze         # Analyze bundle size
```

## Architecture: Feature-Sliced Design (FSD)

The codebase follows a strict hierarchical structure where each layer can only import from layers below:

```
src/
├── app/        # Application initialization, routing, providers
├── pages/      # Route pages, composed from widgets
├── widgets/    # Complex UI blocks (tables, forms, cards)
├── features/   # User interactions (modals, forms, actions)
├── entities/   # Business entities (data models, API)
└── shared/     # Reusable utilities, UI components, types
```

**Key principles:**
- Each slice exports public API via `index.ts`
- Use absolute imports: `@/shared`, `@/entities`, etc.
- Components and logic co-located within slices
- No cross-imports between slices of the same layer

## Core Technologies & Patterns

### State Management
- **Authentication**: Zustand store at `src/shared/store/authStore.ts`
- **Server State**: TanStack Query with centralized keys in `src/shared/utils/queryKeys.ts`
- **Project Context**: Active project stored in localStorage, managed by authStore
- **Form State**: React Hook Form with Zod/Yup validation

### UI Framework
- **Primary**: Ant Design (antd) - use for all new components
- **Legacy**: Some MUI components exist but prefer Ant Design
- **Custom Components**: Wrapper components in `src/shared/ui/`
- **Icons**: Lucide React for new icons, MUI icons for legacy
- **Date Handling**: dayjs for all date operations

### Database & API
- **Supabase**: PostgreSQL with Row Level Security
- **Real-time**: Subscriptions via `useRealtimeUpdates` hook
- **File Storage**: Supabase Storage bucket (VITE_ATTACH_BUCKET)
- **API Helpers**: `fetchPaged`, `fetchByChunks` in `src/shared/api/fetchAll.ts`
- **Debug Wrapper**: Custom fetch wrapper logs Supabase errors with request IDs

### Routing & Permissions
- **Router**: React Router v6 with lazy loading in `src/app/Router.tsx`
- **Auth Guard**: `RequireAuth` component checks authentication
- **Permissions**: `RequirePermission` component for role-based access
- **Roles**: ADMIN, ENGINEER, USER with granular permissions

## Database Schema

**CRITICAL**: Always reference `supabase/schemas/prod.sql` for accurate database structure. This auto-generated file contains complete schema definitions including tables, columns, types, functions, triggers, indexes, and views.

**Main tables:**
- `units` - Project structure hierarchy  
- `defects` - Construction defects tracking
- `claims` - Claims management (`claims_summary` view for optimized reads)
- `court_cases` - Court case proceedings
- `letters` - Correspondence tracking
- `document_folders` - Document organization
- `engineer_calls` - Service calls scheduling
- `attachments` - File attachments system

**Key relationships:**
- All entities relate to `units` via `project_id`
- `defects` can be linked to `claims` and `court_cases`
- `attachments` use polymorphic associations (entity_type, entity_id)
- `document_folders` contain hierarchical document organization
- `claim_links` table for parent-child claim relationships

**Database Reference File:**
- Location: `supabase/schemas/prod.sql`
- Contains: Complete schema definitions, functions, triggers, indexes, views
- Usage: Always consult this file for accurate database structure information

## Bundle Optimization

The build is configured with manual chunking in `vite.config.ts`:
- vendor-react: React core libraries
- vendor-antd: Ant Design components
- vendor-mui: Material-UI components (legacy)
- vendor-query: TanStack Query
- vendor-supabase: Supabase client

Path aliases are configured in both `vite.config.ts` and `tsconfig.json` for consistency.

## Critical Performance Requirements

### React Optimization Checklist
- Use `React.memo` for list item components
- Wrap event handlers with `useCallback`
- Apply `useMemo` for expensive computations
- Implement pagination for large datasets (see ClaimsPagePaginated)
- Use React Query's selective invalidation

### Query Patterns
```typescript
// Standard query with project filtering
const { data } = useQuery({
  queryKey: ['entity-name', projectId, filters],
  queryFn: async () => {
    let query = supabase.from('table').select('*');
    if (projectId) query = query.eq('project_id', projectId);
    return query;
  },
  enabled: !!projectId
});

// Use summary views for performance
// Example: claims_summary instead of claims with joins
```

## Environment Configuration

Required `.env` variables:
```
VITE_SUPABASE_URL=<Supabase project URL>
VITE_SUPABASE_ANON_KEY=<Anon key>
VITE_ATTACH_BUCKET=<Storage bucket name>
```

Legacy support for `REACT_APP_` prefixed variables is maintained for backward compatibility. The Supabase client initialization will throw an error if these variables are not set.

## Working with Forms

Use Ant Design Form components with proper validation:
```typescript
<Form form={form} onFinish={handleSubmit}>
  <Form.Item name="field" rules={[{ required: true }]}>
    <Input />
  </Form.Item>
</Form>
```

Implement optimistic updates with React Query:
```typescript
const mutation = useMutation({
  mutationFn: updateFn,
  onMutate: async (newData) => {
    await queryClient.cancelQueries({ queryKey });
    const previousData = queryClient.getQueryData(queryKey);
    queryClient.setQueryData(queryKey, newData);
    return { previousData };
  },
  onError: (err, newData, context) => {
    queryClient.setQueryData(queryKey, context.previousData);
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey });
  }
});
```

## Code Style Guidelines

- **TypeScript**: Strict mode disabled, avoid `any` types
- **Components**: Functional components with hooks only
- **Imports**: Use absolute paths (`@/shared`, `@/entities`, etc.)
- **Error Handling**: Always wrap async operations in try/catch
- **UI Feedback**: Show loading states, success/error notifications via notistack
- **Date Handling**: Use dayjs for date operations (already configured)
- **Memoization**: Use React.memo for list items, useCallback for event handlers
- **ESLint**: Max warnings set to 0 - fix all warnings before committing

## Key Files and Patterns

### Authentication & Authorization
- Auth store: `src/shared/store/authStore.ts`
- Auth guard: `src/shared/components/RequireAuth.tsx`
- Permission guard: `src/shared/components/RequirePermission.tsx`

### API & Data Fetching
- Supabase client: `src/shared/api/supabaseClient.ts` (includes debug fetch wrapper)
- Query keys: `src/shared/utils/queryKeys.ts`
- Real-time updates: `src/shared/hooks/useRealtimeUpdates.ts`
- Batch fetching: `src/shared/api/fetchAll.ts`

### Common Hooks
- `useProjects` - Project selection and management
- `useRealtimeUpdates` - Subscribe to database changes
- `usePermissions` - Check user permissions
- `useNotify` - Display notifications
- `useProjectId` - Get current project ID
- `useProjectFilter` - Filter data by project

### File Uploads
Files are uploaded to Supabase Storage (bucket name from VITE_ATTACH_BUCKET env var) with metadata stored in `attachments` table. Use entity-specific attachment helpers (e.g., `addClaimAttachments`).

## Testing

```bash
npm run test  # Runs tests/claim.test.cjs (custom test file - no test framework currently)
```

## Permission System

The app uses role-based access control with three main roles:
- **ADMIN**: Full system access, can manage all projects (not restricted to assigned projects)
- **ENGINEER**: Technical staff access to defects and service calls
- **USER**: Standard access to assigned projects

Permissions are checked per page/feature via `RequirePermission` component. Admin users bypass project assignment restrictions and can work with any project.

## Development Server Configuration

- Port: 3000 (configured in `vite.config.ts`)
- HMR overlay disabled for cleaner development experience
- Optimized dependencies pre-bundled for faster cold starts

## Common Entity Patterns

Entities follow a consistent pattern with:
- Query hooks using TanStack Query
- Optimistic updates for mutations
- Summary views for performance (e.g., `claims_summary`)
- Attachment handling via polymorphic associations
- Project-based filtering using `useProjectFilter`
- Real-time updates via Supabase channels
- Batch operations for large datasets (chunks of 1000)

## MCP Server Integration

The project includes Model Context Protocol (MCP) servers configured in `.mcp.json`:
- **supabase**: Database operations and migrations
- **playwright-official**: Browser automation for testing
- **context7**: Documentation retrieval for libraries
- **sequential-thinking**: Problem-solving assistance
- **filesystem**: File system operations

## Supabase Database Operations

When working with the database via MCP tools:
- The Supabase MCP server is configured in read-only mode for safety
- Use `mcp__supabase__execute_sql` for SELECT queries only
- For DDL operations (CREATE, ALTER, DROP), use `mcp__supabase__apply_migration` which creates versioned migration files
- Always check `mcp__supabase__get_advisors` after schema changes to catch security issues (missing RLS policies) and performance problems
- Use `mcp__supabase__list_tables` to discover table structures before querying
- Migration naming convention: snake_case (e.g., `add_engineer_calls_table`)

## Recent Additions

- **Engineer Calls**: Service call scheduling system with calendar views
- **Russian Holidays**: Holiday calculation for scheduling (`src/shared/utils/russianHolidays.ts`)
- **Court Cases Stats**: Statistics widget (`src/widgets/CourtCasesStatsBlock.tsx`)
- **Role-Based Features**: Conditional rendering based on permissions (`src/widgets/RoleBasedFeatures.tsx`)
- **Personal Cabinet**: User personal cabinet page (`src/pages/PersonalCabinetPage/`)
- **Dashboard Entities**: Dashboard-specific entities (`src/entities/dashboard/`)