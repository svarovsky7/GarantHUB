export interface Unit {
  id: number;
  project_id: number | null;
  name: string;
  building?: string | null;
  floor?: number | null;
  person_id?: string | null;
  locked?: boolean | null;
}
