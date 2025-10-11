# Repository Guidelines

## Project Structure & Module Organization
GarantHUB follows a feature-sliced React layout. Application shell and routing live in `src/app`, page-level views in `src/pages`, reusable composites in `src/widgets`, and user-facing fragments in `src/features`. Domain entities and state are in `src/entities`, while cross-cutting utilities, services, and styles belong in `src/shared`. The Vite entry point is `src/main.tsx` with global styles in `src/index.css`. Static assets reside in `public/`; production bundles land in `dist/` after builds. Supabase SQL dumps and exports sit under `supabase/`, and maintainer scripts (including `generate-ai-context.mjs`) are kept in `scripts/`.

## Build, Test, and Development Commands
Install dependencies once with `npm install`. Start the local dev server on port 3000 using `npm run dev`; Vite hot reload is enabled with overlay warnings disabled by default. Produce an optimized bundle via `npm run build` and review it locally with `npm run preview`. Enforce linting rules through `npm run lint` (fails on warnings) and type assertions with `npm run typecheck`. Execute the current regression suite using `npm run test`, which runs `node tests/claim.test.cjs`. Populate Supabase env vars beforehand. When dependency caches misbehave, reset them with `npm run clean-cache`.

## Coding Style & Naming Conventions
Use TypeScript with React function components, two-space indentation, double quotes, and trailing semicolons, mirroring `src/main.tsx`. Honor ESLint settings from `eslint.config.js`, which loads React, hooks, and import rules plus TypeScript checks. Alias imports (`@/...`, `@features/...`) should match the folder names in `src`. Components stay in PascalCase, hooks in camelCase with the `use` prefix, and shared constants or utilities only live in `src/shared` when they are framework-agnostic.

## Testing Guidelines
Add new suites beneath `tests/`, naming files `<subject>.test.(ts|cjs)` so the Node runner discovers them. Prefer Vitest-compatible syntax but ensure execution via `npm run test` until the harness changes. Cover critical flows such as the claim lifecycle, Supabase integration, and major widgets, and document any required fixtures or service mocks. Supply `.env.example` updates whenever tests rely on new Supabase or bucket variables.

## Environment & Supabase Setup
Secrets belong in `.env`; the app at minimum expects `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and `VITE_ATTACH_BUCKET`. Regenerate SQL dumps with the Supabase CLI when schemas change and commit updates to `supabase/migrations/prod.sql` alongside migration notes. Keep exports in `supabase/exports/` anonymized before sharing outside the team.

## Commit & Pull Request Guidelines
Recent history mixes Russian summary commits ("Исправленная версия ...") with conventional `chore:` prefixes. Standardize on `<type>: <imperative summary>` (e.g., `feat: add claim timeline widget`) so the log stays searchable. Limit each commit to one logical change and reference issue IDs when applicable. Pull requests should list scope, manual or automated checks executed (`npm run lint`, `npm run test`), affected routes or Supabase resources, and include screenshots or schema diffs for user-facing updates. Request review before merging and tie Supabase changes to their corresponding SQL artifacts.
