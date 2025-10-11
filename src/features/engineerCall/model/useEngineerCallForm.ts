import { useEffect, useState } from 'react';
import { Form } from 'antd';
import dayjs from 'dayjs';
import type { EngineerCallWithNames } from '@/shared/types/engineerCall';
import { useAuthStore } from '@/shared/store/authStore';
import { useProjectId } from '@/shared/hooks/useProjectId';
import { useDefaultStatus } from '@/entities/status';

interface UseEngineerCallFormProps {
  visible: boolean;
  initialData?: EngineerCallWithNames | null;
  initialDateTime?: { start: Date; end: Date };
  statusOptions: Array<{ value: string; label: string; color: string }>;
}

export const useEngineerCallForm = ({
  visible,
  initialData,
  initialDateTime,
  statusOptions,
}: UseEngineerCallFormProps) => {
  const [form] = Form.useForm();
  const profile = useAuthStore((s) => s.profile);
  const currentProjectId = useProjectId();
  const { data: defaultEngineerCallStatus } = useDefaultStatus('engineer_call');

  const [formInitialized, setFormInitialized] = useState(false);
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [selectedBuilding, setSelectedBuilding] = useState<string | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<number | null>(null);

  useEffect(() => {
    console.log('[EngineerCall] useEffect triggered. visible:', visible, 'formInitialized:', formInitialized);

    if (visible && !formInitialized) {
      console.log('[EngineerCall] Initializing form...');

      if (initialData) {
        const startDate = dayjs(initialData.start_datetime);
        const endDate = dayjs(initialData.end_datetime);
        const formValues = {
          title: initialData.title,
          date: startDate,
          startTime: startDate,
          endTime: endDate,
          project_id: initialData.project_id,
          engineer_id: initialData.engineer_id,
          unit_id: initialData.unit_id,
          claim_id: initialData.claim_id,
          status: initialData.status,
          notes: initialData.notes,
        };
        console.log('[EngineerCall] Setting form values for edit:', formValues);
        form.setFieldsValue(formValues);
        if (initialData.project_id) {
          setSelectedProject(initialData.project_id);
        }
        if (initialData.unit_id) {
          setSelectedUnit(initialData.unit_id);
        }
      } else if (initialDateTime) {
        const startDate = dayjs(initialDateTime.start);
        const endDate = dayjs(initialDateTime.end);

        const formValues = {
          date: startDate,
          startTime: startDate,
          endTime: endDate,
          status: defaultEngineerCallStatus?.name || statusOptions[0]?.value || 'scheduled',
        };
        console.log('[EngineerCall] Setting form values with initialDateTime:', formValues);
        form.setFieldsValue(formValues);
      } else {
        const now = dayjs();
        const startTime = now.add(1, 'hour').startOf('hour');
        const endTime = startTime.add(1, 'hour');

        const initialValues: any = {
          date: now,
          startTime,
          endTime,
          status: defaultEngineerCallStatus?.name || statusOptions[0]?.value || 'scheduled',
          engineer_id: profile?.id,
        };

        if (profile?.role !== 'ADMIN' && currentProjectId) {
          initialValues.project_id = currentProjectId;
          setSelectedProject(currentProjectId);
        }

        console.log('[EngineerCall] Setting initial form values:', initialValues);
        form.setFieldsValue(initialValues);
      }

      setFormInitialized(true);
    }

    if (!visible && formInitialized) {
      console.log('[EngineerCall] Modal closed, resetting form initialization flag');
      setFormInitialized(false);
    }
  }, [visible, initialData, initialDateTime, formInitialized, defaultEngineerCallStatus, statusOptions, profile, currentProjectId]);

  const resetForm = () => {
    form.resetFields();
    setSelectedProject(null);
    setSelectedBuilding(null);
    setSelectedUnit(null);
  };

  return {
    form,
    selectedProject,
    setSelectedProject,
    selectedBuilding,
    setSelectedBuilding,
    selectedUnit,
    setSelectedUnit,
    resetForm,
  };
};
