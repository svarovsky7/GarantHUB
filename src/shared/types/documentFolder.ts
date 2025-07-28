export interface DocumentFolder {
  id: number;
  name: string;
  description?: string;
  project_id?: number;
  created_at: string;
  created_by?: string;
  updated_at: string;
}

export interface DocumentFolderFormData {
  name: string;
  description?: string;
  project_id?: number;
}

export interface DocumentFolderWithAuthor extends DocumentFolder {
  authorName?: string;
}