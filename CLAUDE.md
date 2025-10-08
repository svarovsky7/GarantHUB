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

**CRITICAL**: Always reference `supabase/migrations/prod.sql` for accurate database structure. This auto-generated file contains complete schema definitions including tables, columns, types, functions, triggers, indexes, and views.

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
- Location: `supabase/migrations/prod.sql`
- Contains: Complete schema definitions, functions, triggers, indexes, views
- Usage: Always consult this file for accurate database structure information

## Supabase Folder Structure

The `supabase/` directory contains database schemas, migrations, exports, and AI-friendly context files.

### Directory Overview

```
supabase/
├── migrations/         # Database migration files
│   ├── prod.sql       # Complete production schema (auto-generated)
│   └── *.sql          # Individual migration files with timestamps
├── exports/           # Database structure exports (JSON format)
│   ├── tables.json    # Table definitions with columns, types, constraints
│   ├── indexes.json   # Database indexes for performance optimization
│   ├── functions.json # PostgreSQL functions and stored procedures
│   ├── triggers.json  # Database triggers and event handlers
│   └── enums.json     # Enumerated types (status types, roles, etc.)
└── ai_context/        # AI-optimized database documentation
    ├── ai_manifest.json        # Generation metadata with SHA256 hashes
    ├── ai_tables_min.json      # Compact table descriptions (~43KB)
    ├── ai_tables_full.json     # Full table details with descriptions
    ├── ai_relations.json       # Foreign key relationships (~15KB, 73 relations)
    ├── ai_functions_min.json   # Function signatures and descriptions
    ├── ai_functions_full.json  # Complete function definitions
    ├── ai_triggers_min.json    # Trigger definitions
    ├── ai_enums_min.json       # Enum type definitions
    ├── ai_examples.sql         # SQL query examples (12 examples)
    └── README.md               # Documentation for AI context files
```

### supabase/migrations/

**Purpose**: Version-controlled database schema changes and complete production schema.

**Key Files**:
- `prod.sql` - Auto-generated complete production schema (current source of truth)
- `YYYYMMDD_*.sql` - Timestamped migration files for incremental changes

**Usage**:
- Always reference `prod.sql` for complete schema structure
- Create new migrations using `mcp__supabase__apply_migration` tool
- Migrations are applied sequentially to maintain schema version history

### supabase/exports/

**Purpose**: JSON exports of database metadata for analysis and documentation.

**Generated By**: Database export tools (manually triggered)

**Key Files**:
- `tables.json` - Complete table definitions including columns, types, constraints, primary keys
- `indexes.json` - Index definitions for query optimization
- `functions.json` - PostgreSQL function definitions (13 functions including triggers)
- `triggers.json` - Trigger definitions (2 triggers for court case calculations)
- `enums.json` - Enumerated type definitions (status types, roles, entity types)

**Usage**:
- Source data for generating AI context files
- Reference for understanding database structure without SQL parsing
- Used by `scripts/generate-ai-context.mjs` for AI context generation

### supabase/ai_context/

**Purpose**: AI-optimized database documentation for Claude and other AI assistants.

**Generated By**: `npm run ai-context` (runs `scripts/generate-ai-context.mjs`)

**Statistics** (as of generation):
- 41 tables documented
- 73 foreign key relationships extracted
- 13 PostgreSQL functions
- 2 database triggers
- 12 SQL usage examples
- Total size: ~165KB across 9 files

**Key Files**:

1. **ai_manifest.json** - Generation metadata
   - Timestamp of generation
   - SHA256 hashes of source files (tables.json, indexes.json, prod.sql, etc.)
   - File integrity tracking for cache invalidation

2. **ai_tables_min.json** (~43KB) - Compact table descriptions
   - Table name, columns with types, nullability
   - Primary keys, foreign keys, constraints
   - Optimized for AI context window efficiency

3. **ai_tables_full.json** - Extended table documentation
   - Includes human-readable descriptions
   - Usage notes and relationships
   - More detailed than minimal version

4. **ai_relations.json** (~15KB) - Foreign key relationships
   - 73 extracted relationships between tables
   - Includes constraint names, source/target tables and columns
   - Extracted using heuristic analysis from prod.sql

5. **ai_functions_min.json** - Function signatures
   - Function names, parameters, return types
   - Brief descriptions of functionality

6. **ai_functions_full.json** - Complete function definitions
   - Full SQL source code
   - Detailed parameter descriptions
   - Usage examples where applicable

7. **ai_triggers_min.json** - Trigger definitions
   - Trigger names, associated tables, timing (BEFORE/AFTER)
   - Event types (INSERT, UPDATE, DELETE)

8. **ai_enums_min.json** - Enumerated types
   - Status types (claim_status, court_case_status, defect_status, etc.)
   - Role types, entity types, unit types

9. **ai_examples.sql** (~3.6KB) - SQL usage examples
   - 12 practical examples demonstrating common operations:
     - Creating projects, units, defects, claims
     - Linking entities (claim-defect, claim-unit relationships)
     - Using optimized summary views (claims_summary, defects_summary)
     - Court case management with automatic calculations
     - User profile queries

**Regeneration**:
```bash
npm run ai-context  # Regenerates all AI context files from latest exports
```

**When to Regenerate**:
- After significant schema changes (new tables, columns, relationships)
- After updating `supabase/exports/*.json` files
- When ai_manifest.json source file hashes are outdated
- Before providing database documentation to AI assistants

**Usage by AI**:
- AI assistants read these files to understand database structure
- Optimized for token efficiency (minimal versions prioritized)
- Examples provide patterns for common operations
- Relations file enables accurate JOIN query generation

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