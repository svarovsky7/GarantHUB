import React, { useState } from 'react';
import { SlotInfo } from 'react-big-calendar';
import { message } from 'antd';
import EngineerCallsCalendar from '@/widgets/EngineerCallsCalendarModern';
import EngineerCallModal from '@/features/engineerCall/EngineerCallModalModern.refactored';
import {
  useCreateEngineerCall,
  useUpdateEngineerCall,
  useDeleteEngineerCall,
  addEngineerCallAttachments,
} from '@/entities/engineerCall';
import { useAuthStore } from '@/shared/store/authStore';
import type { CalendarEvent, EngineerCallFormData, EngineerCallWithNames } from '@/shared/types/engineerCall';

const EngineerCallsPage: React.FC = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCall, setSelectedCall] = useState<EngineerCallWithNames | null>(null);
  const [initialDateTime, setInitialDateTime] = useState<{ start: Date; end: Date } | undefined>();

  const createMutation = useCreateEngineerCall();
  const updateMutation = useUpdateEngineerCall();
  const deleteMutation = useDeleteEngineerCall();
  const profile = useAuthStore((s) => s.profile);

  // Обработчик выбора слота в календаре (для создания нового вызова)
  const handleSelectSlot = (slotInfo: SlotInfo) => {
    setSelectedCall(null);
    setInitialDateTime({
      start: slotInfo.start,
      end: slotInfo.end,
    });
    setModalVisible(true);
  };

  // Обработчик выбора существующего события
  const handleSelectEvent = (event: CalendarEvent) => {
    const call = event.resource as EngineerCallWithNames;
    setSelectedCall(call);
    setInitialDateTime(undefined);
    setModalVisible(true);
  };

  // Обработчик создания нового вызова через кнопку
  const handleCreateNew = () => {
    setSelectedCall(null);
    setInitialDateTime(undefined);
    setModalVisible(true);
  };

  // Обработчик закрытия модального окна
  const handleModalClose = () => {
    setModalVisible(false);
    setSelectedCall(null);
    setInitialDateTime(undefined);
  };

  // Обработчик отправки формы
  const handleFormSubmit = async (formData: EngineerCallFormData, newFiles?: File[]) => {
    try {
      let result;
      if (selectedCall) {
        // Обновление существующего вызова
        result = await updateMutation.mutateAsync({
          id: selectedCall.id,
          formData,
        });
      } else {
        // Создание нового вызова
        result = await createMutation.mutateAsync(formData);
      }
      
      // Если есть новые файлы и вызов создан/обновлен, загружаем их
      if (result && newFiles && newFiles.length > 0 && profile?.id) {
        try {
          const filesWithDescription = newFiles.map(file => ({ file, description: '' }));
          await addEngineerCallAttachments(result.id, filesWithDescription, profile.id);
        } catch (error) {
          console.error('Error uploading attachments:', error);
          message.warning('Вызов сохранен, но произошла ошибка при загрузке файлов');
        }
      }
      
      handleModalClose();
    } catch (error) {
      console.error('Error saving engineer call:', error);
      message.error('Произошла ошибка при сохранении вызова');
    }
  };

  // Обработчик удаления вызова
  const handleDeleteCall = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
    } catch (error) {
      console.error('Error deleting engineer call:', error);
      message.error('Произошла ошибка при удалении вызова');
    }
  };

  return (
    <>
      <EngineerCallsCalendar
        onSelectSlot={handleSelectSlot}
        onSelectEvent={handleSelectEvent}
        onCreateNew={handleCreateNew}
        onDeleteEvent={handleDeleteCall}
      />
      
      <EngineerCallModal
        visible={modalVisible}
        onClose={handleModalClose}
        onSubmit={handleFormSubmit}
        initialData={selectedCall}
        initialDateTime={initialDateTime}
        loading={createMutation.isPending || updateMutation.isPending}
      />
    </>
  );
};

export default EngineerCallsPage;