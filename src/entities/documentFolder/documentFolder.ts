import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/shared/api/supabaseClient";
import type { DocumentFolder, DocumentFolderFormData, DocumentFolderWithAuthor } from "@/shared/types/documentFolder";
import { queryKeys } from "@/shared/utils/queryKeys";

// Получение всех папок документов
export const useDocumentFolders = () => {
  return useQuery({
    queryKey: queryKeys.documentFolders(),
    queryFn: async (): Promise<DocumentFolderWithAuthor[]> => {
      const { data, error } = await supabase
        .from("document_folders")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;

      // Получаем информацию о пользователях отдельным запросом
      const userIds = [...new Set(data.map(folder => folder.created_by).filter(Boolean))];
      if (userIds.length === 0) {
        return data.map((folder) => ({
          ...folder,
          authorName: undefined,
        }));
      }

      const { data: users } = await supabase
        .from("profiles")
        .select("id, name")
        .in("id", userIds);

      const userMap = new Map(users?.map(user => [user.id, user.name]) || []);

      return data.map((folder) => ({
        ...folder,
        authorName: userMap.get(folder.created_by!) || undefined,
      }));
    },
  });
};

// Получение папок документов с учетом проекта
export const useDocumentFoldersByProject = (projectId?: number | null) => {
  return useQuery({
    queryKey: queryKeys.documentFolders(projectId),
    queryFn: async (): Promise<DocumentFolderWithAuthor[]> => {
      let query = supabase
        .from("document_folders")
        .select("*");

      // Фильтруем по проекту или показываем только общие папки
      if (projectId) {
        query = query.or(`project_id.eq.${projectId},project_id.is.null`);
      } else {
        query = query.is("project_id", null);
      }

      const { data, error } = await query.order("name", { ascending: true });

      if (error) throw error;

      // Получаем информацию о пользователях отдельным запросом
      const userIds = [...new Set(data.map(folder => folder.created_by).filter(Boolean))];
      if (userIds.length === 0) {
        return data.map((folder) => ({
          ...folder,
          authorName: undefined,
        }));
      }

      const { data: users } = await supabase
        .from("profiles")
        .select("id, name")
        .in("id", userIds);

      const userMap = new Map(users?.map(user => [user.id, user.name]) || []);

      return data.map((folder) => ({
        ...folder,
        authorName: userMap.get(folder.created_by!) || undefined,
      }));
    },
    enabled: projectId !== undefined, // Не выполняем запрос, пока projectId не определен
  });
};

// Создание папки документов
export const useCreateDocumentFolder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: DocumentFolderFormData): Promise<DocumentFolder> => {
      // Получаем текущего пользователя
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Пользователь не авторизован");

      const { data: folder, error } = await supabase
        .from("document_folders")
        .insert({
          name: data.name,
          description: data.description || null,
          project_id: data.project_id || null,
          created_by: user.user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return folder;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.documentFolders() });
    },
  });
};

// Обновление папки документов
export const useUpdateDocumentFolder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & Partial<DocumentFolderFormData>): Promise<DocumentFolder> => {
      const updateData: any = {};
      
      if (data.name !== undefined) {
        updateData.name = data.name;
      }
      
      if (data.description !== undefined) {
        updateData.description = data.description;
      }

      if (data.project_id !== undefined) {
        updateData.project_id = data.project_id;
      }

      updateData.updated_at = new Date().toISOString();

      const { data: folder, error } = await supabase
        .from("document_folders")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return folder;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.documentFolders() });
    },
  });
};

// Удаление папки документов
export const useDeleteDocumentFolder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number): Promise<void> => {
      // Проверяем, есть ли документы в папке
      const { data: documents, error: checkError } = await supabase
        .from("attachments")
        .select("id")
        .eq("folder_id", id)
        .limit(1);

      if (checkError) throw checkError;

      if (documents && documents.length > 0) {
        throw new Error("Невозможно удалить папку, содержащую документы. Сначала переместите или удалите документы.");
      }

      // Удаляем папку
      const { error } = await supabase
        .from("document_folders")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.documentFolders() });
    },
  });
};