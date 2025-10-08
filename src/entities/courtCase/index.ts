// Query hooks - optimized summary view
export { useCourtCasesSummary } from './model/useCourtCaseSummary';

// Query hooks - legacy
export { useCourtCases, useCourtCase } from './model/useCourtCases';

// Mutation hooks - CRUD operations
export {
  useAddCourtCase,
  useUpdateCourtCase,
  useDeleteCourtCase,
  useCaseLinks,
  useLinkCases,
  useUnlinkCase,
  useUpdateCourtCaseFull,
} from './model/useCourtCaseMutations';

// Defect management hooks
export {
  useCaseDefects,
  useAddDefect,
  useDeleteDefect,
  useUpdateDefect,
} from './lib/courtCaseDefects';

// Utility functions
export {
  mapCourtCaseSummary,
  signedUrl,
  isCaseNumberUnique,
} from './lib/courtCaseTransformers';
