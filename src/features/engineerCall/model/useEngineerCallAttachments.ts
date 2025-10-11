import { useState } from 'react';
import { supabase } from '@/shared/api/supabaseClient';
import {
  useEngineerCallAttachments as useAttachments,
  addEngineerCallAttachments,
  useDeleteEngineerCallAttachment,
  useUpdateEngineerCallAttachment,
} from '@/entities/engineerCall';
import type { PreviewFile } from '@/shared/types/previewFile';

export const useEngineerCallAttachments = (callId: number | null, userId?: string) => {
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [previewFile, setPreviewFile] = useState<PreviewFile | null>(null);

  const { data: remoteFiles = [], refetch: refetchAttachments } = useAttachments(callId ? String(callId) : null);
  const deleteAttachmentMutation = useDeleteEngineerCallAttachment();
  const updateAttachmentMutation = useUpdateEngineerCallAttachment();

  const handleFilesAdd = (files: File[]) => {
    setNewFiles((prev) => [...prev, ...files]);
  };

  const handleRemoveNewFile = (index: number) => {
    setNewFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRemoveRemoteFile = async (id: string) => {
    if (!callId) return;
    try {
      await deleteAttachmentMutation.mutateAsync({ attachmentId: id, callId: String(callId) });
      refetchAttachments();
    } catch (error) {
      console.error('Error deleting attachment:', error);
    }
  };

  const handleUpdateRemoteFileDescription = async (id: string, description: string) => {
    try {
      await updateAttachmentMutation.mutateAsync({ id, description });
      refetchAttachments();
    } catch (error) {
      console.error('Error updating attachment:', error);
    }
  };

  const handlePreview = (file: PreviewFile) => {
    setPreviewFile(file);
  };

  const handleClosePreview = () => {
    setPreviewFile(null);
  };

  const uploadNewFiles = async () => {
    if (newFiles.length > 0 && callId && userId) {
      try {
        const filesWithDescription = newFiles.map((file) => ({ file, description: '' }));
        await addEngineerCallAttachments(String(callId), filesWithDescription, userId);
        setNewFiles([]);
        refetchAttachments();
      } catch (error) {
        console.error('Error uploading attachments:', error);
        throw error;
      }
    }
  };

  const resetAttachments = () => {
    setNewFiles([]);
    setPreviewFile(null);
  };

  return {
    remoteFiles,
    newFiles,
    previewFile,
    handleFilesAdd,
    handleRemoveNewFile,
    handleRemoveRemoteFile,
    handleUpdateRemoteFileDescription,
    handlePreview,
    handleClosePreview,
    uploadNewFiles,
    resetAttachments,
    refetchAttachments,
  };
};
