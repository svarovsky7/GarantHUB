import React, { useEffect, useState } from 'react';
import {
  Modal,
  Form,
  Input,
  DatePicker,
  TimePicker,
  Select,
  Button,
  Space,
  Row,
  Col,
  ConfigProvider,
  Tag,
  Card,
  Typography,
  Divider,
  Alert,
  Collapse,
  Steps,
  Tooltip,
} from 'antd';
import { 
  SaveOutlined, 
  CloseOutlined, 
  ClockCircleOutlined,
  UserOutlined,
  HomeOutlined,
  ProjectOutlined,
  FileTextOutlined,
  SettingOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/ru';
import locale from 'antd/es/locale/ru_RU';
import styled from 'styled-components';
import { useEngineers } from '@/entities/engineerCall';
import { useUnits } from '@/entities/unit';
import { useClaimsSimple } from '@/entities/claim';
import { useEngineerCallStatuses, useDefaultStatus } from '@/entities/status';
import { useProjects } from '@/shared/hooks/useProjects';
import { useAuthStore } from '@/shared/store/authStore';
import { useProjectId } from '@/shared/hooks/useProjectId';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabaseClient';
import type { EngineerCallFormData, EngineerCallWithNames } from '@/shared/types/engineerCall';

dayjs.locale('ru');

const { TextArea } = Input;
const { Option } = Select;
const { Title, Text } = Typography;
const { Panel } = Collapse;

// Styled Components для современного дизайна модального окна
const StyledModal = styled(Modal)`
  .ant-modal-content {
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  }
  
  .ant-modal-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-bottom: none;
    padding: 24px 32px;
    
    .ant-modal-title {
      color: white;
      font-size: 18px;
      font-weight: 600;
    }
  }
  
  .ant-modal-body {
    padding: 32px;
    background: #fafbfc;
  }
  
  .ant-modal-footer {
    background: white;
    border-top: 1px solid #f0f0f0;
    padding: 16px 32px;
    
    .ant-btn {
      border-radius: 8px;
      font-weight: 500;
      height: 40px;
      padding: 0 20px;
      
      &.ant-btn-primary {
        background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
        border: none;
        box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
        
        &:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
        }
      }
    }
  }
`;

const FormSection = styled(Card)`
  margin-bottom: 24px;
  border-radius: 12px;
  border: 1px solid #e8eaed;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  
  .ant-card-head {
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
    border-bottom: 1px solid #e2e8f0;
    padding: 16px 24px;
    min-height: auto;
    
    .ant-card-head-title {
      font-size: 14px;
      font-weight: 600;
      color: #475569;
      display: flex;
      align-items: center;
      gap: 8px;
    }
  }
  
  .ant-card-body {
    padding: 24px;
    background: white;
  }
`;

const TimeSection = styled.div`
  .time-controls {
    display: flex;
    align-items: end;
    gap: 12px;
    flex-wrap: wrap;
    
    .quick-duration-btn {
      height: 32px;
      border-radius: 6px;
      font-size: 12px;
      border: 1px solid #d1d5db;
      background: white;
      color: #6b7280;
      transition: all 0.2s ease;
      
      &:hover {
        border-color: #3b82f6;
        color: #3b82f6;
      }
      
      &.active {
        background: #3b82f6;
        border-color: #3b82f6;
        color: white;
      }
    }
  }
`;

const StatusSelect = styled(Select)`
  .ant-select-selector {
    border-radius: 8px;
    border: 2px solid #e2e8f0;
    transition: all 0.2s ease;
    
    &:hover {
      border-color: #cbd5e1;
    }
    
    &.ant-select-focused {
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }
  }
`;

const ProgressSteps = styled(Steps)`
  margin-bottom: 32px;
  
  .ant-steps-item-process .ant-steps-item-icon {
    background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
    border-color: #3b82f6;
  }
  
  .ant-steps-item-finish .ant-steps-item-icon {
    background: #10b981;
    border-color: #10b981;
  }
`;

const SmartSuggestion = styled(Alert)`
  margin-bottom: 16px;
  border-radius: 8px;
  border: none;
  
  &.ant-alert-info {
    background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
    border: 1px solid #bfdbfe;
  }
`;

interface EngineerCallModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: EngineerCallFormData) => void;
  initialData?: EngineerCallWithNames | null;
  initialDateTime?: { start: Date; end: Date };
  loading?: boolean;
}

const EngineerCallModal: React.FC<EngineerCallModalProps> = ({
  visible,
  onClose,
  onSubmit,
  initialData,
  initialDateTime,
  loading = false,
}) => {
  const [form] = Form.useForm();
  const profile = useAuthStore((s) => s.profile);
  const currentProjectId = useProjectId();
  const { data: engineers = [] } = useEngineers();
  const { data: projects = [] } = useProjects();
  const { data: statuses = [] } = useEngineerCallStatuses();
  const { data: defaultEngineerCallStatus } = useDefaultStatus('engineer_call');
  
  // Состояние для прогрессивного раскрытия
  const [currentStep, setCurrentStep] = useState(0);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState<number | null>(null);
  
  // Состояния для фильтрации
  const [selectedProject, setSelectedProject] = React.useState<number | null>(null);
  const [selectedBuilding, setSelectedBuilding] = React.useState<string | null>(null);
  const [selectedUnit, setSelectedUnit] = React.useState<number | null>(null);
  
  // Загружаем units для выбранного проекта напрямую
  const { data: units = [], isLoading: unitsLoading, error: unitsError } = useQuery({
    queryKey: ['units-for-engineer-call', selectedProject],
    queryFn: async () => {
      console.log('[EngineerCallModal] Loading units for project:', selectedProject);
      if (!selectedProject) {
        console.log('[EngineerCallModal] No project selected, returning empty array');
        return [];
      }
      
      const { data, error } = await supabase
        .from('units')
        .select('*')
        .eq('project_id', selectedProject)
        .order('name');
        
      if (error) {
        console.error('[EngineerCallModal] Error loading units:', error);
        return [];
      }
      
      console.log('[EngineerCallModal] Units loaded:', data?.length, 'items');
      if (data && data.length > 0) {
        console.log('[EngineerCallModal] First unit sample:', data[0]);
        console.log('[EngineerCallModal] Buildings (parent_id=null):', data.filter(u => u.parent_id === null).length);
        console.log('[EngineerCallModal] Units with parent_id:', data.filter(u => u.parent_id !== null).length);
      }
      return data || [];
    },
    enabled: !!selectedProject,
  });
  
  // Загружаем claims для выбранного проекта с их связями к units
  const { data: projectClaims = [], isLoading: claimsLoading } = useQuery({
    queryKey: ['claims-for-engineer-call', selectedProject, selectedUnit],
    queryFn: async () => {
      console.log('[EngineerCallModal] Loading claims for project:', selectedProject, 'unit:', selectedUnit);
      if (!selectedProject) {
        console.log('[EngineerCallModal] No project selected for claims, returning empty array');
        return [];
      }
      
      // Загружаем претензии с их связями к units
      let query = supabase
        .from('claims')
        .select(`
          id, 
          claim_no, 
          project_id,
          claim_units!inner(unit_id)
        `)
        .eq('project_id', selectedProject);
      
      // Если выбрана квартира, фильтруем по ней
      if (selectedUnit) {
        query = query.eq('claim_units.unit_id', selectedUnit);
      }
        
      const { data, error } = await query;
        
      if (error) {
        console.error('[EngineerCallModal] Error loading claims:', error);
        return [];
      }
      
      // Преобразуем данные в простой формат
      const claims = (data || []).map(claim => ({
        id: claim.id,
        claim_no: claim.claim_no,
        project_id: claim.project_id,
        unit_ids: claim.claim_units?.map((cu: any) => cu.unit_id) || []
      }));
      
      console.log('[EngineerCallModal] Claims loaded:', claims.length, 'items');
      return claims;
    },
    enabled: !!selectedProject,
  });
  
  // Получаем уникальные корпуса из поля building
  const buildings = React.useMemo(() => {
    console.log('[EngineerCallModal] Computing buildings for project:', selectedProject);
    console.log('[EngineerCallModal] Total units available:', units.length);
    
    if (!selectedProject || units.length === 0) {
      console.log('[EngineerCallModal] No project selected or no units available');
      return [];
    }
    
    // Извлекаем уникальные названия корпусов из поля building
    const uniqueBuildings = [...new Set(units.map(u => u.building).filter(Boolean))];
    
    // Сортируем корпуса с учетом чисел в названиях
    const sortedBuildings = uniqueBuildings.sort((a, b) => {
      // Извлекаем числа из строк для правильной сортировки
      const aNum = parseInt(a.match(/\d+/)?.[0] || '0');
      const bNum = parseInt(b.match(/\d+/)?.[0] || '0');
      
      if (aNum !== bNum) {
        return aNum - bNum;
      }
      // Если числа одинаковые или отсутствуют, сортируем по алфавиту
      return a.localeCompare(b, 'ru');
    });
    
    const buildingsList = sortedBuildings.map((buildingName) => ({
      id: buildingName, // Используем название как ID
      name: buildingName,
      project_id: selectedProject
    }));
    
    console.log('[EngineerCallModal] Unique buildings found:', buildingsList);
    return buildingsList;
  }, [units, selectedProject]);
  
  // Фильтруем и сортируем квартиры по выбранному проекту и корпусу
  const filteredUnits = React.useMemo(() => {
    console.log('[EngineerCallModal] Filtering units. Project:', selectedProject, 'Building:', selectedBuilding);
    
    if (!selectedProject || units.length === 0) {
      console.log('[EngineerCallModal] No project selected or no units for filtering');
      return [];
    }
    
    let unitsToSort = units;
    
    // Если выбран корпус, показываем только квартиры этого корпуса
    if (selectedBuilding) {
      unitsToSort = units.filter(u => u.building === selectedBuilding);
      console.log('[EngineerCallModal] Units in selected building:', unitsToSort.length);
    } else {
      console.log('[EngineerCallModal] All project units:', units.length);
    }
    
    // Сортируем квартиры по номеру с учетом чисел и букв
    const sortedUnits = [...unitsToSort].sort((a, b) => {
      // Извлекаем числа из названий квартир
      const aMatch = a.name.match(/^(\d+)(.*)$/);
      const bMatch = b.name.match(/^(\d+)(.*)$/);
      
      if (aMatch && bMatch) {
        const aNum = parseInt(aMatch[1]);
        const bNum = parseInt(bMatch[1]);
        
        if (aNum !== bNum) {
          return aNum - bNum;
        }
        // Если числа одинаковые, сравниваем буквенные суффиксы
        return (aMatch[2] || '').localeCompare(bMatch[2] || '', 'ru');
      }
      
      // Если не удалось извлечь числа, сортируем по алфавиту
      return a.name.localeCompare(b.name, 'ru');
    });
    
    return sortedUnits;
  }, [units, selectedProject, selectedBuilding]);
  
  // Сортируем претензии по номеру
  const filteredClaims = React.useMemo(() => {
    return [...projectClaims].sort((a, b) => {
      // Сортируем по номеру претензии
      const aNo = a.claim_no || '';
      const bNo = b.claim_no || '';
      
      // Пытаемся извлечь числа из номеров претензий
      const aMatch = aNo.match(/(\d+)/);
      const bMatch = bNo.match(/(\d+)/);
      
      if (aMatch && bMatch) {
        const aNum = parseInt(aMatch[1]);
        const bNum = parseInt(bMatch[1]);
        
        if (aNum !== bNum) {
          return aNum - bNum;
        }
      }
      
      // Если не удалось извлечь числа или они равны, сортируем по алфавиту
      return aNo.localeCompare(bNo, 'ru');
    });
  }, [projectClaims]);

  // Получаем статус по умолчанию (первый из списка)
  const getDefaultStatus = () => {
    if (statuses.length > 0) {
      return statuses[0].name;
    }
    return 'scheduled';
  };

  // Функция для генерации времени с шагом 15 минут
  const generateTimeOptions = () => {
    const options = [];
    for (let hour = 8; hour <= 21; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        options.push(dayjs().hour(hour).minute(minute).second(0));
      }
    }
    return options;
  };

  // Функция для округления времени до ближайшего 15-минутного интервала в рамках 8:00-21:00
  const roundToNearestQuarter = (time: Dayjs) => {
    const hour = time.hour();
    const minute = time.minute();
    
    // Если время до 8:00, устанавливаем 8:00
    if (hour < 8) {
      return dayjs().hour(8).minute(0).second(0);
    }
    
    // Если время после 21:00, устанавливаем 21:00
    if (hour > 21) {
      return dayjs().hour(21).minute(0).second(0);
    }
    
    // Округляем минуты до ближайшего 15-минутного интервала
    const roundedMinute = Math.round(minute / 15) * 15;
    return time.minute(roundedMinute).second(0);
  };

  // Проверка, находится ли время в разрешенном диапазоне
  const isTimeInRange = (time: Dayjs) => {
    const hour = time.hour();
    const minute = time.minute();
    return (hour >= 8 && hour < 21) || (hour === 21 && minute === 0);
  };

  // Debug useEffect для отслеживания изменений состояния
  useEffect(() => {
    console.log('[EngineerCallModal] State changed:', {
      selectedProject,
      selectedBuilding,
      selectedUnit,
      unitsLength: units.length,
      buildingsLength: buildings.length,
      filteredUnitsLength: filteredUnits.length,
      claimsLength: projectClaims.length,
      filteredClaimsLength: filteredClaims.length,
      unitsLoading,
      claimsLoading
    });
  }, [selectedProject, selectedBuilding, selectedUnit, units, buildings, filteredUnits, projectClaims, filteredClaims, unitsLoading, claimsLoading]);

  // Заполняем форму при открытии модального окна
  useEffect(() => {
    if (visible) {
      console.log('[EngineerCallModal] Modal opened, visible:', visible);
      if (initialData) {
        // Режим редактирования
        const startDate = dayjs(initialData.start_datetime);
        const endDate = dayjs(initialData.end_datetime);
        form.setFieldsValue({
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
        });
        // Устанавливаем выбранный проект и юнит для фильтрации
        if (initialData.project_id) {
          setSelectedProject(initialData.project_id);
        }
        if (initialData.unit_id) {
          // Найдем корпус для этой квартиры
          const unit = units.find(u => u.id === initialData.unit_id);
          if (unit && unit.building) {
            setSelectedBuilding(unit.building);
          }
          setSelectedUnit(initialData.unit_id);
        }
      } else if (initialDateTime) {
        // Новый вызов с предустановленным временем
        const startDate = dayjs(initialDateTime.start);
        const endDate = dayjs(initialDateTime.end);
        const roundedStartTime = roundToNearestQuarter(startDate);
        const roundedEndTime = roundToNearestQuarter(endDate);
        
        form.setFieldsValue({
          date: startDate,
          startTime: roundedStartTime,
          endTime: roundedEndTime,
          status: getDefaultStatus(),
        });
      } else {
        // Новый вызов без предустановок
        const now = dayjs();
        const startTime = roundToNearestQuarter(now);
        const endTime = startTime.add(1, 'hour');
        
        form.setFieldsValue({
          date: now,
          startTime: startTime,
          endTime: endTime,
          status: getDefaultStatus(),
          engineer_id: profile?.id, // Автоматически подставляем текущего пользователя
          project_id: currentProjectId, // Подставляем текущий проект
        });
        // Устанавливаем выбранный проект для фильтрации
        if (currentProjectId) {
          setSelectedProject(currentProjectId);
        }
      }
    }
  }, [visible, initialData, initialDateTime, form, profile, currentProjectId, units, statuses]);

  const handleFinish = (values: any) => {
    // Объединяем дату с временем начала и окончания
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
    onSubmit(formData);
  };

  const handleClose = () => {
    form.resetFields();
    onClose();
  };
  
  // Функция для установки времени окончания через час после начала
  const handleSetOneHourDuration = () => {
    const startTime = form.getFieldValue('startTime');
    
    if (startTime) {
      // Убеждаемся, что startTime - это dayjs объект
      const startDayjs = dayjs.isDayjs(startTime) ? startTime : dayjs(startTime);
      let endTime = startDayjs.add(1, 'hour');
      
      // Проверяем, не выходит ли время окончания за допустимые пределы
      if (endTime.hour() > 21 || (endTime.hour() === 21 && endTime.minute() > 0)) {
        // Сохраняем дату, но устанавливаем время 21:00
        endTime = startDayjs.hour(21).minute(0).second(0);
      }
      
      form.setFieldsValue({ endTime: endTime });
    }
  };

  // Если статусов нет в БД, используем дефолтные
  const statusOptions = statuses.length > 0 
    ? statuses.map(s => ({ 
        value: s.name, 
        label: s.name, 
        color: s.color || '#8c8c8c' 
      }))
    : [
        { value: 'scheduled', label: 'Запланирован', color: '#1890ff' },
        { value: 'in_progress', label: 'В процессе', color: '#fa8c16' },
        { value: 'completed', label: 'Завершен', color: '#52c41a' },
        { value: 'cancelled', label: 'Отменен', color: '#ff4d4f' },
      ];

  // Функция для быстрого установления продолжительности
  const handleQuickDuration = (minutes: number) => {
    const startTime = form.getFieldValue('startTime');
    if (startTime) {
      const startDayjs = dayjs.isDayjs(startTime) ? startTime : dayjs(startTime);
      let endTime = startDayjs.add(minutes, 'minute');
      
      // Проверяем, не выходит ли время окончания за допустимые пределы
      if (endTime.hour() > 21 || (endTime.hour() === 21 && endTime.minute() > 0)) {
        endTime = startDayjs.hour(21).minute(0).second(0);
      }
      
      form.setFieldsValue({ endTime: endTime });
      setSelectedDuration(minutes);
    }
  };

  // Определяем шаги для прогресса
  const steps = [
    { title: 'Основная информация', icon: <FileTextOutlined /> },
    { title: 'Время и дата', icon: <ClockCircleOutlined /> },
    { title: 'Назначение', icon: <UserOutlined /> },
    { title: 'Завершение', icon: <CheckCircleOutlined /> },
  ];

  // Умные подсказки на основе выбранных данных
  const getSmartSuggestions = () => {
    const suggestions = [];
    const projectId = form.getFieldValue('project_id');
    const unitId = form.getFieldValue('unit_id');
    const startTime = form.getFieldValue('startTime');
    
    if (projectId && !unitId) {
      suggestions.push({
        type: 'info',
        message: 'Выберите квартиру для более точного планирования вызова'
      });
    }
    
    if (startTime && startTime.hour() < 9) {
      suggestions.push({
        type: 'warning',
        message: 'Раннее время вызова. Убедитесь, что инженер и клиент согласны на такое время'
      });
    }
    
    return suggestions;
  };

  return (
    <ConfigProvider locale={locale}>
      <StyledModal
        title={initialData ? 'Редактировать вызов' : 'Новый вызов инженера'}
        open={visible}
        onCancel={handleClose}
        width={900}
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
      >
        {/* Умные подсказки */}
        {getSmartSuggestions().map((suggestion, index) => (
          <SmartSuggestion
            key={index}
            type={suggestion.type as any}
            message={suggestion.message}
            icon={<InfoCircleOutlined />}
            showIcon
            closable
          />
        ))}

        <Form
          form={form}
          layout="vertical"
          onFinish={handleFinish}
          requiredMark="optional"
        >
          {/* Основная информация */}
          <FormSection title={<><FileTextOutlined />Основная информация</>} size="small">
            <Row gutter={16}>
              <Col span={24}>
                <Form.Item
                  name="title"
                  label="Название вызова"
                  rules={[{ required: true, message: 'Введите название вызова' }]}
                  extra="Краткое описание задачи для инженера"
                >
                  <Input 
                    placeholder="Например: Проверка протечки в квартире 123" 
                    size="large"
                    style={{ borderRadius: '8px' }}
                  />
                </Form.Item>
              </Col>
            </Row>
          </FormSection>

          {/* Время и дата */}
          <FormSection title={<><ClockCircleOutlined />Время и дата</>} size="small">
            <TimeSection>
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item
                    name="date"
                    label="Дата вызова"
                    rules={[{ required: true, message: 'Выберите дату' }]}
                  >
                    <DatePicker
                      format="DD.MM.YYYY"
                      style={{ width: '100%', borderRadius: '8px' }}
                      size="large"
                      placeholder="Выберите дату"
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    name="startTime"
                    label="Время начала"
                    rules={[{ required: true, message: 'Укажите время начала' }]}
                  >
                    <TimePicker
                      format="HH:mm"
                      style={{ width: '100%', borderRadius: '8px' }}
                      size="large"
                      placeholder="08:00"
                      minuteStep={15}
                      showNow={false}
                      needConfirm={false}
                      disabledHours={() => {
                        const disabled = [];
                        for (let i = 0; i < 8; i++) disabled.push(i);
                        for (let i = 22; i < 24; i++) disabled.push(i);
                        return disabled;
                      }}
                      onChange={(time) => {
                        setSelectedDuration(null);
                        if (time) {
                          const endTime = form.getFieldValue('endTime');
                          if (!endTime || time.isAfter(endTime) || time.isSame(endTime)) {
                            let newEndTime = time.add(1, 'hour');
                            if (newEndTime.hour() > 21 || (newEndTime.hour() === 21 && newEndTime.minute() > 0)) {
                              newEndTime = time.hour(21).minute(0).second(0);
                            }
                            form.setFieldsValue({ endTime: newEndTime });
                          }
                        }
                      }}
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    name="endTime"
                    label="Время окончания"
                    rules={[
                      { required: true, message: 'Укажите время окончания' },
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          const startTime = getFieldValue('startTime');
                          if (!value || !startTime) return Promise.resolve();
                          const start = dayjs.isDayjs(startTime) ? startTime : dayjs(startTime);
                          const end = dayjs.isDayjs(value) ? value : dayjs(value);
                          if (end.isAfter(start)) return Promise.resolve();
                          return Promise.reject(new Error('Время окончания должно быть позже времени начала'));
                        },
                      }),
                    ]}
                  >
                    <TimePicker
                      format="HH:mm"
                      style={{ width: '100%', borderRadius: '8px' }}
                      size="large"
                      placeholder="09:00"
                      minuteStep={15}
                      showNow={false}
                      needConfirm={false}
                      onChange={() => setSelectedDuration(null)}
                    />
                  </Form.Item>
                </Col>
              </Row>
              
              <div className="time-controls">
                <Text type="secondary" style={{ fontSize: '12px', marginRight: '8px' }}>Быстрая установка:</Text>
                {[30, 60, 90, 120].map(minutes => (
                  <Button
                    key={minutes}
                    size="small"
                    className={`quick-duration-btn ${selectedDuration === minutes ? 'active' : ''}`}
                    onClick={() => handleQuickDuration(minutes)}
                  >
                    {minutes < 60 ? `${minutes}м` : `${minutes / 60}ч`}
                  </Button>
                ))}
              </div>
            </TimeSection>
          </FormSection>

          {/* Назначение и статус */}
          <FormSection title={<><UserOutlined />Назначение и статус</>} size="small">
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item 
                  name="project_id" 
                  label="Проект" 
                  rules={[{ required: true, message: 'Выберите проект' }]}
                  extra="Выберите проект для привязки вызова"
                >
                  <Select
                    placeholder="Выберите проект"
                    size="large"
                    style={{ borderRadius: '8px' }}
                    showSearch
                    optionFilterProp="children"
                    onChange={(value) => {
                      console.log('[EngineerCallModal] Project selected:', value);
                      setSelectedProject(value);
                      setSelectedBuilding(null);
                      setSelectedUnit(null);
                      form.setFieldsValue({ unit_id: null, claim_id: null });
                    }}
                  >
                    {projects.map((project) => (
                      <Option key={project.id} value={project.id}>
                        <Space>
                          <ProjectOutlined />
                          {project.name}
                        </Space>
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="engineer_id" label="Ответственный инженер">
                  <Select
                    placeholder="Выберите инженера"
                    size="large"
                    style={{ borderRadius: '8px' }}
                    showSearch
                    optionFilterProp="children"
                    allowClear
                  >
                    {engineers.map((engineer) => (
                      <Option key={engineer.id} value={engineer.id}>
                        <Space>
                          <UserOutlined />
                          {engineer.name}
                          <Text type="secondary">({engineer.role})</Text>
                        </Space>
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={8}>
                <Form.Item 
                  label={
                    <Space>
                      <span>Корпус</span>
                      {buildings.length > 0 && (
                        <Tag color="blue" style={{ fontSize: '11px', padding: '0 6px' }}>{buildings.length}</Tag>
                      )}
                    </Space>
                  }
                  help={unitsError ? 'Ошибка загрузки данных' : undefined}
                  validateStatus={unitsError ? 'error' : undefined}
                >
                  <Select
                    placeholder={!selectedProject ? "Сначала выберите проект" : unitsLoading ? "Загрузка..." : "Выберите корпус"}
                    size="large"
                    style={{ borderRadius: '8px' }}
                    showSearch
                    optionFilterProp="children"
                    allowClear
                    disabled={!selectedProject || unitsLoading}
                    loading={unitsLoading}
                    value={selectedBuilding}
                    onChange={(value) => {
                      console.log('[EngineerCallModal] Building selected:', value);
                      setSelectedBuilding(value);
                      setSelectedUnit(null);
                      form.setFieldsValue({ unit_id: null, claim_id: null });
                    }}
                  >
                    {buildings.map((building) => (
                      <Option key={building.id} value={building.id}>
                        <Space>
                          <HomeOutlined />
                          {building.name}
                        </Space>
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item 
                  name="unit_id" 
                  label={
                    <Space>
                      <span>Квартира</span>
                      {filteredUnits.length > 0 && (
                        <Tag color="green" style={{ fontSize: '11px', padding: '0 6px' }}>{filteredUnits.length}</Tag>
                      )}
                    </Space>
                  }
                >
                  <Select
                    placeholder={!selectedProject ? "Сначала выберите проект" : unitsLoading ? "Загрузка..." : "Выберите квартиру"}
                    size="large"
                    style={{ borderRadius: '8px' }}
                    showSearch
                    optionFilterProp="children"
                    allowClear
                    disabled={!selectedProject || unitsLoading}
                    loading={unitsLoading}
                    onChange={(value) => {
                      console.log('[EngineerCallModal] Unit selected:', value);
                      setSelectedUnit(value);
                      form.setFieldsValue({ claim_id: null });
                    }}
                  >
                    {filteredUnits.map((unit) => (
                      <Option key={unit.id} value={unit.id}>
                        <Space>
                          <HomeOutlined />
                          {unit.name}
                        </Space>
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item 
                  name="claim_id" 
                  label={
                    <Space>
                      <span>Претензия</span>
                      {filteredClaims.length > 0 && (
                        <Tag color="orange" style={{ fontSize: '11px', padding: '0 6px' }}>{filteredClaims.length}</Tag>
                      )}
                    </Space>
                  }
                >
                  <Select
                    placeholder={!selectedUnit ? "Сначала выберите квартиру" : claimsLoading ? "Загрузка..." : "Выберите претензию"}
                    size="large"
                    style={{ borderRadius: '8px' }}
                    showSearch
                    optionFilterProp="children"
                    allowClear
                    disabled={!selectedUnit || claimsLoading}
                    loading={claimsLoading}
                  >
                    {filteredClaims.map((claim) => (
                      <Option key={claim.id} value={claim.id}>
                        <Space>
                          <FileTextOutlined />
                          {claim.claim_no || `ID: ${claim.id}`}
                        </Space>
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="status" label="Статус вызова">
                  <StatusSelect 
                    placeholder="Выберите статус"
                    size="large"
                  >
                    {statusOptions.map((option) => (
                      <Option key={option.value} value={option.value}>
                        <Space>
                          <span
                            style={{
                              display: 'inline-block',
                              width: 10,
                              height: 10,
                              borderRadius: '50%',
                              backgroundColor: option.color,
                              boxShadow: `0 0 6px ${option.color}30`
                            }}
                          />
                          {option.label}
                        </Space>
                      </Option>
                    ))}
                  </StatusSelect>
                </Form.Item>
              </Col>
            </Row>
          </FormSection>

          {/* Дополнительные настройки (складная секция) */}
          <Collapse 
            ghost 
            expandIconPosition="end"
            style={{ marginBottom: '24px' }}
          >
            <Panel 
              header={
                <Space>
                  <SettingOutlined />
                  <Text strong>Дополнительные параметры</Text>
                </Space>
              } 
              key="advanced"
            >
              <Card style={{ background: '#fafafa', border: '1px solid #f0f0f0' }}>
                <Row gutter={16}>
                  <Col span={24}>
                    <Form.Item 
                      name="notes" 
                      label="Примечания и комментарии"
                      extra="Дополнительная информация о вызове, особые требования"
                    >
                      <TextArea
                        rows={4}
                        placeholder="Введите дополнительные заметки, особые требования к вызову, контактную информацию..."
                        style={{ borderRadius: '8px' }}
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>
            </Panel>
          </Collapse>
        </Form>
      </StyledModal>
    </ConfigProvider>
  );
};

export default EngineerCallModal;