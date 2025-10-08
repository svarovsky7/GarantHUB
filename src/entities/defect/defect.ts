// Re-export all hooks and utilities from the new modular structure
export type { NewDefect } from './model/types';

// Query hooks - optimized summary view
export { useDefectsSummary } from './model/useDefects';

// Query hooks - individual defects
export {
  useDefects,
  useDefect,
  useDefectFileCounts,
  useDefectsByIds,
  useDefectsWithNames,
} from './model/useDefects';

// Mutation hooks - CRUD operations
export {
  useCreateDefects,
  useUpdateDefect,
  useDeleteDefect,
  useAddDefectAttachments,
  useRemoveDefectAttachment,
} from './model/useDefectMutations';

// Mutation hooks - status management
export {
  useUpdateDefectStatus,
  useFixDefect,
  useCancelDefectFix,
} from './model/useDefectStatus';

// Utility functions
export {
  mapDefectSummary,
  signedUrl,
  removeDefectAttachmentsBulk,
} from './lib/defectHelpers';
