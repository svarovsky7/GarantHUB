export interface RolePermission {
  role_name: string;
  pages: string[];
  edit_tables: string[];
  delete_tables: string[];
  /** Ограничить видимость только назначенным проектом */
  only_assigned_project: boolean;
}

/** Специальная отметка в массиве pages для разрешения досудебных претензий */
export const PRETRIAL_FLAG = 'pretrial-claim';

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
      PRETRIAL_FLAG,
    ],
    // Администратор имеет полные права на все справочники
    edit_tables: ['defects', 'court_cases', 'letters', 'claims'],
    delete_tables: ['defects', 'court_cases', 'letters', 'claims'],
    only_assigned_project: false,
  },
  ENGINEER: {
    role_name: 'ENGINEER',
    pages: [
      'dashboard',
      'structure',
      'claims',
      'defects',
      'court-cases',
      'correspondence',
      PRETRIAL_FLAG,
    ],
    // Инженер теперь может управлять претензиями
    edit_tables: ['defects', 'letters', 'claims'],
    delete_tables: ['defects', 'letters', 'claims'],
    only_assigned_project: false,
  },
  LAWYER: {
    role_name: 'LAWYER',
    pages: [
      'dashboard',
      'structure',
      'claims',
      'defects',
      'court-cases',
      'correspondence',
      PRETRIAL_FLAG,
    ],
    edit_tables: ['court_cases', 'letters'],
    delete_tables: ['court_cases', 'letters'],
    only_assigned_project: false,
  },
  CONTRACTOR: {
    role_name: 'CONTRACTOR',
    pages: ['defects', PRETRIAL_FLAG],
    edit_tables: [],
    delete_tables: [],
    only_assigned_project: false,
  },
};
