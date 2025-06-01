export interface Person {
  id: number;
  full_name: string;
  phone?: string | null;
  email?: string | null;
  passport_series?: string | null;
  passport_number?: string | null;
  description?: string | null;
}
