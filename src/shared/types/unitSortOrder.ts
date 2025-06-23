export interface UnitSortOrder {
  id?: number;
  project_id: number;
  building?: string | null;
  floor: string;
  sort_direction: import('./sortDirection').SortDirection | null;
}
