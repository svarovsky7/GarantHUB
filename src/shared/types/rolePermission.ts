export interface RolePermission {
  role_name: string;
  pages: string[];
  edit_tables: string[];
  delete_tables: string[];
  /** Ограничить видимость только назначенным проектом */
  only_assigned_project: boolean;
  /** Разрешить работу с досудебными претензиями */
  allow_pretrial_claim: boolean;
}

export type RoleName = 'ADMIN' | 'ENGINEER' | 'LAWYER' | 'CONTRACTOR';

export const DEFAULT_ROLE_PERMISSIONS: Record<RoleName, RolePermission> = {
  ADMIN: {
    role_name: 'ADMIN',
    pages: [
      'dashboard',
      'structure',
      'claims',
      'defects',
      'court-cases',
      'correspondence',
      'admin',
    ],
    // Администратор имеет полные права на все справочники
    edit_tables: ['defects', 'court_cases', 'letters', 'claims'],
    delete_tables: ['defects', 'court_cases', 'letters', 'claims'],
    only_assigned_project: false,
    allow_pretrial_claim: true,
  },
  ENGINEER: {
    role_name: 'ENGINEER',
    pages: ['dashboard', 'structure', 'claims', 'defects', 'court-cases', 'correspondence'],
    // Инженер теперь может управлять претензиями
    edit_tables: ['defects', 'letters', 'claims'],
    delete_tables: ['defects', 'letters', 'claims'],
    only_assigned_project: false,
    allow_pretrial_claim: true,
  },
  LAWYER: {
    role_name: 'LAWYER',
    pages: ['dashboard', 'structure', 'claims', 'defects', 'court-cases', 'correspondence'],
    edit_tables: ['court_cases', 'letters'],
    delete_tables: ['court_cases', 'letters'],
    only_assigned_project: false,
    allow_pretrial_claim: true,
  },
  CONTRACTOR: {
    role_name: 'CONTRACTOR',
    pages: ['defects'],
    edit_tables: [],
    delete_tables: [],
    only_assigned_project: false,
    allow_pretrial_claim: true,
  },
};
