export interface Unit {
  id: number;
  project_id: number | null;
  name: string;
  building?: string | null;
  floor?: number | null;
  section?: string | null;
  person_id?: string | null;
}
