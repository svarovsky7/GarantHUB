import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/shared/api/supabaseClient";
import { slugify, ATTACH_BUCKET, getFileSize } from "@/entities/attachment/attachment";
import type { Document, DocumentWithAuthor, DocumentFormData } from "@/shared/types/document";
import type { Attachment } from "@/shared/types/attachment";
import { queryKeys } from "@/shared/utils/queryKeys";

// Получение всех документов (из таблицы attachments с префиксом "documents/")
export const useDocuments = () => {
  return useQuery({
    queryKey: queryKeys.documents(),
    queryFn: async (): Promise<DocumentWithAuthor[]> => {
      const { data, error } = await supabase
        .from("attachments")
        .select(`
          *,
          folder:document_folder_files(
            document_folders(*)
          )
        `)
        .like("storage_path", "documents/%")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Получаем информацию о пользователях отдельным запросом
      const userIds = [...new Set(data.map(doc => doc.created_by).filter(Boolean))];
      if (userIds.length === 0) {
        return data.map((doc) => ({
          ...doc,
          title: doc.original_name || "Без названия",
          authorName: undefined,
        }));
      }

      const { data: users } = await supabase
        .from("profiles")
        .select("id, name")
        .in("id", userIds);

      const userMap = new Map(users?.map(user => [user.id, user.name]) || []);

      // Получаем размеры файлов
      const documentsWithSizes = await Promise.all(
        data.map(async (doc) => {
          const fileSize = await getFileSize(doc.storage_path);
          return {
            ...doc,
            title: doc.original_name || "Без названия",
            authorName: userMap.get(doc.created_by!) || undefined,
            file_size: fileSize,
            folders: doc.folder?.map((f: any) => f.document_folders).filter(Boolean) || [],
          };
        })
      );

      return documentsWithSizes;
    },
  });
};

// Получение документов по папке
export const useDocumentsByFolder = (folderId: number) => {
  return useQuery({
    queryKey: ['documents-by-folder', folderId],
    queryFn: async (): Promise<DocumentWithAuthor[]> => {
      const { data, error } = await supabase
        .from("attachments")
        .select(`
          *,
          folder:document_folder_files!inner(
            document_folders(*)
          )
        `)
        .like("storage_path", "documents/%")
        .eq("document_folder_files.folder_id", folderId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Получаем информацию о пользователях отдельным запросом
      const userIds = [...new Set(data.map(doc => doc.created_by).filter(Boolean))];
      if (userIds.length === 0) {
        return data.map((doc) => ({
          ...doc,
          title: doc.original_name || "Без названия",
          authorName: undefined,
        }));
      }

      const { data: users } = await supabase
        .from("profiles")
        .select("id, name")
        .in("id", userIds);

      const userMap = new Map(users?.map(user => [user.id, user.name]) || []);

      // Получаем размеры файлов
      const documentsWithSizes = await Promise.all(
        data.map(async (doc) => {
          const fileSize = await getFileSize(doc.storage_path);
          return {
            ...doc,
            title: doc.original_name || "Без названия",
            authorName: userMap.get(doc.created_by!) || undefined,
            file_size: fileSize,
            folders: doc.folder?.map((f: any) => f.document_folders).filter(Boolean) || [],
          };
        })
      );

      return documentsWithSizes;
    },
    enabled: !!folderId,
  });
};

// Функция загрузки документа (использует существующую логику из attachment.ts)
const uploadDocument = async (file: File): Promise<{ path: string; type: string; url: string }> => {
  const safe = slugify(file.name);
  const path = `documents/${Date.now()}_${safe}`;

  const { error } = await supabase
    .storage.from(ATTACH_BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type });

  if (error?.message?.includes('Bucket not found')) {
    throw new Error(`Storage bucket «${ATTACH_BUCKET}» отсутствует.`);
  }
  if (error) throw error;

  const {
    data: { publicUrl },
  } = supabase.storage.from(ATTACH_BUCKET).getPublicUrl(path);

  return { path, type: file.type, url: publicUrl };
};

// Создание документа
export const useCreateDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: DocumentFormData): Promise<Attachment> => {
      // Получаем текущего пользователя
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Пользователь не авторизован");

      // Загружаем файл
      const uploaded = await uploadDocument(data.file);

      // Создаем запись в таблице attachments
      const attachmentData = {
        path: uploaded.url,
        mime_type: uploaded.type,
        original_name: data.title, // Заголовок документа храним в original_name
        storage_path: uploaded.path,
        description: data.description || null,
        created_by: user.user.id,
        uploaded_by: user.user.id,
      };

      const { data: document, error } = await supabase
        .from("attachments")
        .insert(attachmentData)
        .select()
        .single();

      if (error) throw error;

      // Если указаны папки, связываем документ с папками
      if (data.folder_ids && data.folder_ids.length > 0) {
        const folderLinks = data.folder_ids.map(folderId => ({
          folder_id: folderId,
          attachment_id: document.id,
          created_by: user.user.id
        }));

        const { error: linkError } = await supabase
          .from("document_folder_files")
          .insert(folderLinks);

        if (linkError) throw linkError;
      }

      return document;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.documents() });
    },
  });
};

// Удаление документа
export const useDeleteDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number): Promise<void> => {
      // Сначала получаем информацию о файле
      const { data: document, error: fetchError } = await supabase
        .from("attachments")
        .select("storage_path")
        .eq("id", id)
        .single();

      if (fetchError) throw fetchError;

      // Удаляем файл из Storage
      const { error: storageError } = await supabase.storage
        .from(ATTACH_BUCKET)
        .remove([document.storage_path]);

      if (storageError) throw storageError;

      // Удаляем запись из БД
      const { error } = await supabase
        .from("attachments")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.documents() });
    },
  });
};

// Получение ссылки для скачивания файла
export const useDownloadDocument = () => {
  return useMutation({
    mutationFn: async (storagePath: string): Promise<string> => {
      // Создаем signed URL с параметром download для принудительного скачивания
      const { data, error } = await supabase.storage
        .from(ATTACH_BUCKET)
        .createSignedUrl(storagePath, 60, { download: true });

      if (error) throw error;
      return data.signedUrl;
    },
  });
};

// Обновление документа
export const useUpdateDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, title, description }: { id: number; title?: string; description?: string }): Promise<Attachment> => {
      const updateData: any = {};
      
      if (title !== undefined) {
        updateData.original_name = title;
      }
      
      if (description !== undefined) {
        updateData.description = description;
      }

      const { data: document, error } = await supabase
        .from("attachments")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return document;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.documents() });
    },
  });
};

// Получение ссылки для просмотра файла
export const usePreviewDocument = () => {
  return useMutation({
    mutationFn: async (storagePath: string): Promise<string> => {
      // Создаем signed URL без download для просмотра в браузере
      const { data, error } = await supabase.storage
        .from(ATTACH_BUCKET)
        .createSignedUrl(storagePath, 60);

      if (error) throw error;
      return data.signedUrl;
    },
  });
};

// Управление связями документов с папками
export const useUpdateDocumentFolders = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ documentId, folderIds }: { documentId: number; folderIds: number[] }): Promise<void> => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Пользователь не авторизован");

      // Сначала удаляем все существующие связи
      const { error: deleteError } = await supabase
        .from("document_folder_files")
        .delete()
        .eq("attachment_id", documentId);

      if (deleteError) throw deleteError;

      // Затем добавляем новые связи, если они есть
      if (folderIds.length > 0) {
        const folderLinks = folderIds.map(folderId => ({
          folder_id: folderId,
          attachment_id: documentId,
          created_by: user.user.id
        }));

        const { error: insertError } = await supabase
          .from("document_folder_files")
          .insert(folderLinks);

        if (insertError) throw insertError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.documents() });
    },
  });
};