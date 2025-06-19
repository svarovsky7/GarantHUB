export interface RolePermission {
  role_name: string;
  pages: string[];
  edit_tables: string[];
  delete_tables: string[];
  /** Ограничить видимость только назначенным проектом */
  only_assigned_project: boolean;
}

export type RoleName = 'ADMIN' | 'ENGINEER' | 'LAWYER' | 'CONTRACTOR';

export const DEFAULT_ROLE_PERMISSIONS: Record<RoleName, RolePermission> = {
  ADMIN: {
    role_name: 'ADMIN',
    pages: [
      'dashboard',
      'structure',
      'tickets',
      'claims',
      'defects',
      'court-cases',
      'correspondence',
      'admin',
    ],
    // Администратор имеет полные права на все справочники
    edit_tables: ['tickets', 'defects', 'court_cases', 'letters', 'claims'],
    delete_tables: ['tickets', 'defects', 'court_cases', 'letters', 'claims'],
    only_assigned_project: false,
  },
  ENGINEER: {
    role_name: 'ENGINEER',
    pages: ['dashboard', 'structure', 'tickets', 'claims', 'defects', 'court-cases', 'correspondence'],
    // Инженер теперь может управлять претензиями
    edit_tables: ['tickets', 'defects', 'letters', 'claims'],
    delete_tables: ['tickets', 'defects', 'letters', 'claims'],
    only_assigned_project: false,
  },
  LAWYER: {
    role_name: 'LAWYER',
    pages: ['dashboard', 'structure', 'tickets', 'claims', 'defects', 'court-cases', 'correspondence'],
    edit_tables: ['court_cases', 'letters'],
    delete_tables: ['court_cases', 'letters'],
    only_assigned_project: false,
  },
  CONTRACTOR: {
    role_name: 'CONTRACTOR',
    pages: ['defects'],
    edit_tables: [],
    delete_tables: [],
    only_assigned_project: false,
  },
};
