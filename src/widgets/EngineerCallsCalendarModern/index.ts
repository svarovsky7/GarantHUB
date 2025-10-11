/**
 * EngineerCallsCalendarModern Widget
 *
 * A comprehensive calendar widget for managing engineer service calls.
 *
 * Features:
 * - Multiple views: month, week, day, agenda (table)
 * - Filtering: by project, engineers, date range
 * - "Only my meetings" toggle with localStorage persistence
 * - Statistics display by status
 * - Russian locale support with 24-hour format
 * - Weekend and holiday highlighting
 * - Real-time updates via Supabase
 *
 * Architecture:
 * - Original file preserved: EngineerCallsCalendarModern.tsx
 * - Refactored file: EngineerCallsCalendarModernNew.tsx
 * - Model hooks: model/useCalendarState.ts, model/useCalendarData.ts
 * - UI components: ui/* (6 components)
 */

// Export refactored version as default
export { default } from './EngineerCallsCalendarModernNew';

// Also export as named export
export { default as EngineerCallsCalendarModernNew } from './EngineerCallsCalendarModernNew';

// Export hooks for reuse
export { useCalendarState, useCalendarData } from './model';

// Export UI components for customization
export {
  CalendarToolbar,
  EventRenderer,
  CalendarFilters,
  CalendarHeader,
  CalendarView,
  AgendaView,
} from './ui';
