import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/shared/api/supabaseClient";
import type { SystemSetting, SystemSettingUpdate, SystemSettingKey } from "@/shared/types/systemSettings";

export const useSystemSettings = () => {
  return useQuery({
    queryKey: ["systemSettings"],
    queryFn: async (): Promise<SystemSetting[]> => {
      const { data, error } = await supabase
        .from("system_settings")
        .select("*")
        .order("setting_key");

      if (error) throw error;
      return data || [];
    },
  });
};

export const useSystemSetting = (settingKey: SystemSettingKey) => {
  return useQuery({
    queryKey: ["systemSetting", settingKey],
    queryFn: async (): Promise<SystemSetting | null> => {
      const { data, error } = await supabase
        .from("system_settings")
        .select("*")
        .eq("setting_key", settingKey)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data || null;
    },
  });
};

export const useUpdateSystemSetting = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (setting: SystemSettingUpdate): Promise<SystemSetting> => {
      // Сначала пытаемся обновить существующую запись
      const { data: updateData, error: updateError } = await supabase
        .from("system_settings")
        .update({
          setting_value: setting.setting_value,
          updated_at: new Date().toISOString(),
        })
        .eq("setting_key", setting.setting_key)
        .select()
        .single();

      // Если запись существует и обновилась успешно
      if (updateData && !updateError) {
        return updateData;
      }

      // Если запись не найдена (error code PGRST116), создаём новую
      if (updateError && updateError.code === 'PGRST116') {
        const { data: insertData, error: insertError } = await supabase
          .from("system_settings")
          .insert({
            setting_key: setting.setting_key,
            setting_value: setting.setting_value,
          })
          .select()
          .single();

        if (insertError) throw insertError;
        return insertData;
      }

      // Если произошла другая ошибка
      if (updateError) throw updateError;
      
      throw new Error("Unexpected error in useUpdateSystemSetting");
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["systemSettings"] });
      queryClient.invalidateQueries({ queryKey: ["systemSetting", data.setting_key] });
    },
  });
};