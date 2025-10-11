import React, { useEffect, useState } from 'react';
import { Modal, Form, Button, Space, ConfigProvider } from 'antd';
import { SaveOutlined, CloseOutlined, CalendarOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import 'dayjs/locale/ru';
import locale from 'antd/es/locale/ru_RU';
import { useEngineers, addEngineerCallAttachments } from '@/entities/engineerCall';
import { useEngineerCallStatuses, useDefaultStatus } from '@/entities/status';
import { useAuthStore } from '@/shared/store/authStore';
import FilePreviewModal from '@/shared/ui/FilePreviewModal';
import ClaimViewModal from '@/features/claim/ClaimViewModal';
import type { EngineerCallFormData, EngineerCallWithNames } from '@/shared/types/engineerCall';

// Import extracted components
import {
  CallBasicInfo,
  CallDateTime,
  CallAssignment,
  CallLocation,
  CallStatusAndNotes,
  CallAttachmentsSection,
} from './ui';

// Import custom hooks
import {
  useEngineerCallForm,
  useProjectData,
  useFilteredData,
  useEngineerCallAttachments,
} from './model';

dayjs.locale('ru');

interface EngineerCallModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: EngineerCallFormData, newFiles?: File[]) => void;
  initialData?: EngineerCallWithNames | null;
  initialDateTime?: { start: Date; end: Date };
  loading?: boolean;
}

/**
 * Main modal component for creating/editing engineer calls
 * Refactored into smaller, modular components
 */
const EngineerCallModalModern: React.FC<EngineerCallModalProps> = ({
  visible,
  onClose,
  onSubmit,
  initialData,
  initialDateTime,
  loading = false,
}) => {
  const profile = useAuthStore((s) => s.profile);
  const { data: engineers = [] } = useEngineers();
  const { data: statuses = [] } = useEngineerCallStatuses();
  const { data: defaultEngineerCallStatus } = useDefaultStatus('engineer_call');

  // Modal state for claim view
  const [viewClaimId, setViewClaimId] = useState<number | null>(null);

  // Status options configuration
  const statusOptions = statuses.length > 0
    ? statuses.map((s) => ({
        value: s.name,
        label: s.name,
        color: s.color || '#8c8c8c',
      }))
    : [
        { value: 'scheduled', label: 'Запланирован', color: '#1890ff' },
        { value: 'in_progress', label: 'В процессе', color: '#fa8c16' },
        { value: 'completed', label: 'Завершен', color: '#52c41a' },
        { value: 'cancelled', label: 'Отменен', color: '#ff4d4f' },
      ];

  // Form state management hook
  const {
    form,
    selectedProject,
    setSelectedProject,
    selectedBuilding,
    setSelectedBuilding,
    selectedUnit,
    setSelectedUnit,
    resetForm,
  } = useEngineerCallForm({
    visible,
    initialData,
    initialDateTime,
    statusOptions,
  });

  // Project data hook
  const { projects, units, unitsLoading, buildings, projectClaims, claimsLoading } = useProjectData(
    selectedProject,
    selectedUnit
  );

  // Filtered data hook
  const { filteredUnits, filteredClaims } = useFilteredData(
    units,
    projectClaims,
    selectedProject,
    selectedBuilding
  );

  // Attachments management hook
  const {
    remoteFiles,
    newFiles,
    previewFile,
    handleFilesAdd,
    handleRemoveNewFile,
    handleRemoveRemoteFile,
    handlePreview,
    handleClosePreview,
    uploadNewFiles,
    resetAttachments,
    refetchAttachments,
  } = useEngineerCallAttachments(initialData?.id || null, profile?.id);

  // Set building when units are loaded for edit mode
  useEffect(() => {
    if (initialData?.unit_id && units.length > 0) {
      const unit = units.find((u) => u.id === initialData.unit_id);
      if (unit && unit.building) {
        setSelectedBuilding(unit.building);
      }
    }
  }, [initialData?.unit_id, units, setSelectedBuilding]);

  // Project change handler
  const handleProjectChange = (projectId: number) => {
    setSelectedProject(projectId);
    setSelectedBuilding(null);
    setSelectedUnit(null);
  };

  // Building change handler
  const handleBuildingChange = (building: string | null) => {
    setSelectedBuilding(building);
    setSelectedUnit(null);
  };

  // Unit change handler
  const handleUnitChange = (unitId: number | null) => {
    setSelectedUnit(unitId);
  };

  // View claim handler
  const handleViewClaim = (claimId: number) => {
    setViewClaimId(claimId);
  };

  // Form submission handler
  const handleFinish = async (values: any) => {
    const date = dayjs(values.date).format('YYYY-MM-DD');
    const startDateTime = dayjs(`${date} ${values.startTime.format('HH:mm')}`);
    const endDateTime = dayjs(`${date} ${values.endTime.format('HH:mm')}`);

    const formData: EngineerCallFormData = {
      title: values.title,
      start_datetime: startDateTime.toDate(),
      end_datetime: endDateTime.toDate(),
      project_id: values.project_id,
      engineer_id: values.engineer_id,
      unit_id: values.unit_id,
      claim_id: values.claim_id,
      status: values.status || 'scheduled',
      notes: values.notes,
    };

    // For new calls with files, pass files to onSubmit
    if (!initialData && newFiles.length > 0) {
      await onSubmit(formData, newFiles);
    } else {
      await onSubmit(formData);

      // For existing calls, upload files separately
      if (newFiles.length > 0 && initialData?.id && profile?.id) {
        try {
          await uploadNewFiles();
        } catch (error) {
          console.error('Error uploading attachments:', error);
        }
      }
    }
  };

  // Close handler
  const handleClose = () => {
    resetForm();
    resetAttachments();
    setViewClaimId(null);
    onClose();
  };

  return (
    <ConfigProvider locale={locale}>
      <Modal
        title={
          <Space>
            <CalendarOutlined style={{ fontSize: '18px', color: '#1890ff' }} />
            <span style={{ fontSize: '16px', fontWeight: 500 }}>
              {initialData ? 'Редактировать вызов' : 'Новый вызов инженера'}
            </span>
          </Space>
        }
        open={visible}
        onCancel={handleClose}
        width={900}
        centered
        footer={[
          <Button key="cancel" onClick={handleClose} icon={<CloseOutlined />}>
            Отмена
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={loading}
            onClick={() => form.submit()}
            icon={<SaveOutlined />}
          >
            {initialData ? 'Сохранить' : 'Создать'}
          </Button>,
        ]}
        styles={{ body: { padding: '16px' } }}
        className="modern-modal"
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFinish}
          requiredMark="optional"
          size="middle"
        >
          {/* Basic Information */}
          <CallBasicInfo />

          {/* Date and Time */}
          <CallDateTime form={form} />

          {/* Assignment - Project and Engineer */}
          <CallAssignment
            form={form}
            projects={projects}
            engineers={engineers}
            onProjectChange={handleProjectChange}
          />

          {/* Location - Building, Unit, Claim */}
          <CallLocation
            form={form}
            selectedProject={selectedProject}
            selectedBuilding={selectedBuilding}
            buildings={buildings}
            filteredUnits={filteredUnits}
            filteredClaims={filteredClaims}
            selectedUnit={selectedUnit}
            unitsLoading={unitsLoading}
            claimsLoading={claimsLoading}
            onBuildingChange={handleBuildingChange}
            onUnitChange={handleUnitChange}
            onViewClaim={handleViewClaim}
          />

          {/* Status and Notes */}
          <CallStatusAndNotes statusOptions={statusOptions} />

          {/* Attachments */}
          <CallAttachmentsSection
            remoteFiles={remoteFiles}
            newFiles={newFiles}
            onAddFiles={handleFilesAdd}
            onRemoveRemote={handleRemoveRemoteFile}
            onRemoveNew={handleRemoveNewFile}
            onPreview={handlePreview}
          />
        </Form>

        {/* File Preview Modal */}
        {previewFile && (
          <FilePreviewModal file={previewFile} open={!!previewFile} onClose={handleClosePreview} />
        )}
      </Modal>

      {/* Claim View Modal */}
      {viewClaimId && (
        <ClaimViewModal
          open={!!viewClaimId}
          claimId={viewClaimId}
          onClose={() => setViewClaimId(null)}
        />
      )}
    </ConfigProvider>
  );
};

export default EngineerCallModalModern;
