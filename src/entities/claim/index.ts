// Re-export mappers and constants
export { mapClaimSummary, mapClaim, TABLE, SUMMARY_TABLE, LINK_TABLE } from './model/mappers';

// Re-export query hooks
export {
  useClaimsSummary,
  useClaims,
  useClaim,
  useClaimAll,
  useClaimsAllSummary,
  useClaimsAll,
  useClaimsAllLegacy,
  useClaimsSimpleAll,
  useClaimsSimple,
  useClaimIdsByDefectIds,
} from './model/useClaimQueries';

// Re-export mutation hooks
export {
  useCreateClaim,
  useUpdateClaim,
  useDeleteClaim,
} from './model/useClaimMutations';

// Re-export attachment hooks
export {
  useClaimAttachments,
  useRemoveClaimAttachment,
  removeClaimAttachmentsBulk,
  useAddClaimAttachments,
} from './model/useClaimAttachments';

// Re-export link hooks
export {
  useClaimLinks,
  useLinkClaims,
  useUnlinkClaim,
} from './model/useClaimLinks';

// Re-export stats hooks
export {
  useClaimsAllStats,
  useClaimsStats,
} from './model/useClaimStats';

// Re-export helper functions
export {
  closeDefectsForClaim,
  markClaimDefectsPreTrial,
} from './lib/claimHelpers';

// Re-export transformer functions
export {
  signedUrl,
  signedUrlForPreview,
} from './lib/claimTransformers';