export interface Contractor {
  id: number;
  name: string;
  description?: string | null;
  inn?: string | null;
  phone?: string | null;
  email?: string | null;
  created_at?: string | null;
}
