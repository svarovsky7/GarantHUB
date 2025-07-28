export interface SystemSetting {
  id: number;
  setting_key: string;
  setting_value: string;
  description?: string;
  created_at: string;
  updated_at: string;
  updated_by?: string;
}

export interface SystemSettingUpdate {
  setting_key: string;
  setting_value: string;
}

export type SystemSettingKey = 
  | 'registration_enabled'
  | 'maintenance_mode'
  | 'max_file_size_mb';