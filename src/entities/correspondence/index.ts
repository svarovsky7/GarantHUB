// Query hooks - letters
export { useLetters, useLetter } from './model/useLetters';

// Query hooks - links
export { useLetterLinks } from './model/useLetterLinks';

// Mutation hooks - CRUD operations
export {
  useAddLetter,
  useUpdateLetter,
  useDeleteLetter,
  useUpdateLetterStatus,
  useUpdateLetterDirection,
} from './model/useLetterMutations';

// Mutation hooks - link management
export { useLinkLetters, useUnlinkLetter } from './model/useLetterLinks';

// Utility functions - contact resolution
export {
  getContactIds,
  getSenderName,
  getReceiverName,
} from './lib/contactResolver';

// Utility functions - transformers and file operations
export {
  extractFileName,
  transformAttachment,
  signedUrl,
  signedUrlForPreview,
} from './lib/letterTransformers';
