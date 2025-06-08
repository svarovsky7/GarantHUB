import type { Person } from './person';

export interface Unit {
  id: number;
  name: string;
  building: string | null;
  section: string | null;
  floor: string | null;
  project_id: number;
  person_id: string | null;
  persons: Person[];
}
