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
  Divider,
  Typography,
  Collapse,
  Alert,
  Tooltip,
  Badge,
  Card,
  Segmented,
  Upload,
  List,
  Popconfirm,
  message
} from 'antd';
import { 
  SaveOutlined, 
  CloseOutlined, 
  ClockCircleOutlined,
  CalendarOutlined,
  UserOutlined,
  HomeOutlined,
  ProjectOutlined,
  InfoCircleOutlined,
  FileTextOutlined,
  EnvironmentOutlined,
  FieldTimeOutlined,
  UploadOutlined,
  DeleteOutlined,
  EyeOutlined,
  PaperClipOutlined,
  FileImageOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  FileExcelOutlined,
  FileOutlined,
  ExportOutlined
} from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/ru';
import locale from 'antd/es/locale/ru_RU';
import { 
  useEngineers, 
  useEngineerCallAttachments, 
  addEngineerCallAttachments,
  useDeleteEngineerCallAttachment,
  useUpdateEngineerCallAttachment
} from '@/entities/engineerCall';
import { useUnits } from '@/entities/unit';
import { useClaimsSimple } from '@/entities/claim';
import { useEngineerCallStatuses, useDefaultStatus } from '@/entities/status';
import { useProjects } from '@/shared/hooks/useProjects';
import { useAuthStore } from '@/shared/store/authStore';
import { useProjectId } from '@/shared/hooks/useProjectId';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabaseClient';
import FilePreviewModal from '@/shared/ui/FilePreviewModal';
import EngineerCallAttachments from './EngineerCallAttachments';
import ClaimViewModal from '@/features/claim/ClaimViewModal';
import type { EngineerCallFormData, EngineerCallWithNames } from '@/shared/types/engineerCall';
import type { PreviewFile } from '@/shared/types/previewFile';
import './EngineerCallModal.css';

dayjs.locale('ru');

const { TextArea } = Input;
const { Option } = Select;
const { Title, Text, Paragraph } = Typography;

interface EngineerCallModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: EngineerCallFormData, newFiles?: File[]) => void;
  initialData?: EngineerCallWithNames | null;
  initialDateTime?: { start: Date; end: Date };
  loading?: boolean;
}

const EngineerCallModalModern: React.FC<EngineerCallModalProps> = ({
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
  const { data: allProjects = [] } = useProjects();
  const { data: statuses = [] } = useEngineerCallStatuses();
  const { data: defaultEngineerCallStatus } = useDefaultStatus('engineer_call');
  
  // Состояние для файлов
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [previewFile, setPreviewFile] = useState<PreviewFile | null>(null);
  
  // Состояние для модального окна претензии
  const [viewClaimId, setViewClaimId] = useState<number | null>(null);
  
  // Загружаем существующие вложения
  const { data: remoteFiles = [], refetch: refetchAttachments } = useEngineerCallAttachments(initialData?.id || null);
  const deleteAttachmentMutation = useDeleteEngineerCallAttachment();
  const updateAttachmentMutation = useUpdateEngineerCallAttachment();
  
  // Фильтруем проекты для пользователя
  // Администраторы видят все проекты, другие роли - только назначенные
  const projects = React.useMemo(() => {
    if (!profile) return [];
    
    // Администраторы видят все проекты
    if (profile.role === 'ADMIN') {
      return allProjects;
    }
    
    // Другие роли видят только назначенные проекты
    if (profile.project_ids && profile.project_ids.length > 0) {
      return allProjects.filter(p => profile.project_ids?.includes(p.id));
    }
    
    return [];
  }, [allProjects, profile]);
  
  // Состояния для фильтрации
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [selectedBuilding, setSelectedBuilding] = useState<string | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<number | null>(null);
  
  // Загружаем units для выбранного проекта
  const { data: units = [], isLoading: unitsLoading } = useQuery({
    queryKey: ['units-for-engineer-call', selectedProject],
    queryFn: async () => {
      if (!selectedProject) return [];
      
      const { data, error } = await supabase
        .from('units')
        .select('*')
        .eq('project_id', selectedProject)
        .order('name');
        
      if (error) {
        console.error('Error loading units:', error);
        return [];
      }
      
      return data || [];
    },
    enabled: !!selectedProject,
  });
  
  // Загружаем claims для выбранного проекта
  const { data: projectClaims = [], isLoading: claimsLoading } = useQuery({
    queryKey: ['claims-for-engineer-call', selectedProject, selectedUnit],
    queryFn: async () => {
      if (!selectedProject) return [];
      
      let query = supabase
        .from('claims')
        .select(`
          id, 
          claim_no, 
          project_id,
          claim_units!inner(unit_id)
        `)
        .eq('project_id', selectedProject);
      
      if (selectedUnit) {
        query = query.eq('claim_units.unit_id', selectedUnit);
      }
        
      const { data, error } = await query;
        
      if (error) {
        console.error('Error loading claims:', error);
        return [];
      }
      
      const claims = (data || []).map(claim => ({
        id: claim.id,
        claim_no: claim.claim_no,
        project_id: claim.project_id,
        unit_ids: claim.claim_units?.map((cu: any) => cu.unit_id) || []
      }));
      
      return claims;
    },
    enabled: !!selectedProject,
  });
  
  // Получаем уникальные корпуса
  const buildings = React.useMemo(() => {
    if (!selectedProject || units.length === 0) return [];
    
    const uniqueBuildings = [...new Set(units.map(u => u.building).filter(Boolean))];
    const sortedBuildings = uniqueBuildings.sort((a, b) => {
      const aNum = parseInt(a.match(/\d+/)?.[0] || '0');
      const bNum = parseInt(b.match(/\d+/)?.[0] || '0');
      
      if (aNum !== bNum) return aNum - bNum;
      return a.localeCompare(b, 'ru');
    });
    
    return sortedBuildings.map((buildingName) => ({
      id: buildingName,
      name: buildingName,
      project_id: selectedProject
    }));
  }, [units, selectedProject]);
  
  // Фильтруем и сортируем квартиры
  const filteredUnits = React.useMemo(() => {
    if (!selectedProject || units.length === 0) return [];
    
    let unitsToSort = units;
    
    if (selectedBuilding) {
      unitsToSort = units.filter(u => u.building === selectedBuilding);
    }
    
    const sortedUnits = [...unitsToSort].sort((a, b) => {
      const aMatch = a.name.match(/^(\d+)(.*)$/);
      const bMatch = b.name.match(/^(\d+)(.*)$/);
      
      if (aMatch && bMatch) {
        const aNum = parseInt(aMatch[1]);
        const bNum = parseInt(bMatch[1]);
        
        if (aNum !== bNum) return aNum - bNum;
        return (aMatch[2] || '').localeCompare(bMatch[2] || '', 'ru');
      }
      
      return a.name.localeCompare(b.name, 'ru');
    });
    
    return sortedUnits;
  }, [units, selectedProject, selectedBuilding]);
  
  // Сортируем претензии
  const filteredClaims = React.useMemo(() => {
    return [...projectClaims].sort((a, b) => {
      const aNo = a.claim_no || '';
      const bNo = b.claim_no || '';
      
      const aMatch = aNo.match(/(\d+)/);
      const bMatch = bNo.match(/(\d+)/);
      
      if (aMatch && bMatch) {
        const aNum = parseInt(aMatch[1]);
        const bNum = parseInt(bMatch[1]);
        
        if (aNum !== bNum) return aNum - bNum;
      }
      
      return aNo.localeCompare(bNo, 'ru');
    });
  }, [projectClaims]);

  // Быстрые кнопки установки длительности
  const quickDurations = [
    { label: '30 мин', value: 30 },
    { label: '1 час', value: 60 },
    { label: '2 часа', value: 120 },
  ];

  const setQuickDuration = (minutes: number) => {
    const startTime = form.getFieldValue('startTime');
    
    if (!startTime) {
      message.warning('Сначала выберите время начала');
      return;
    }
    
    // startTime уже является объектом Dayjs
    const startTimeDayjs = dayjs.isDayjs(startTime) ? startTime : dayjs(startTime);
    
    // Добавляем минуты к времени начала
    const endTime = startTimeDayjs.add(minutes, 'minute');
    
    // Устанавливаем время окончания
    form.setFieldsValue({ endTime });
    
    message.success(`Время окончания установлено: ${endTime.format('HH:mm')}`);
  };

  // Статусы с иконками и цветами
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

  // Флаг для отслеживания первичной инициализации формы
  const [formInitialized, setFormInitialized] = useState(false);

  // Заполняем форму при открытии
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
        
        // Устанавливаем начальные значения
        const initialValues: any = {
          date: now,
          startTime,
          endTime,
          status: defaultEngineerCallStatus?.name || statusOptions[0]?.value || 'scheduled',
          engineer_id: profile?.id,
        };
        
        // Для не-администраторов устанавливаем текущий проект если он есть
        // Администраторы могут свободно выбирать любой проект
        if (profile?.role !== 'ADMIN' && currentProjectId) {
          initialValues.project_id = currentProjectId;
          setSelectedProject(currentProjectId);
        }
        
        console.log('[EngineerCall] Setting initial form values:', initialValues);
        form.setFieldsValue(initialValues);
      }
      
      setFormInitialized(true);
    }
    
    // Сбрасываем флаг при закрытии модального окна
    if (!visible && formInitialized) {
      console.log('[EngineerCall] Modal closed, resetting form initialization flag');
      setFormInitialized(false);
    }
  }, [visible, initialData, initialDateTime, formInitialized]);
  
  // Отдельный эффект для установки корпуса при изменении units
  useEffect(() => {
    if (initialData?.unit_id && units.length > 0) {
      const unit = units.find(u => u.id === initialData.unit_id);
      if (unit && unit.building) {
        setSelectedBuilding(unit.building);
      }
    }
  }, [initialData?.unit_id, units]);
  
  // Обработчики файлов
  const handleFilesAdd = (files: File[]) => {
    setNewFiles(prev => [...prev, ...files]);
  };
  
  const handleRemoveNewFile = (index: number) => {
    setNewFiles(prev => prev.filter((_, i) => i !== index));
  };
  
  const handleUpdateNewFileDescription = (index: number, description: string) => {
    // Функция больше не используется, так как убираем описание
  };
  
  const handleRemoveRemoteFile = async (id: string) => {
    if (!initialData?.id) return;
    try {
      await deleteAttachmentMutation.mutateAsync({ attachmentId: id, callId: initialData.id });
      refetchAttachments();
    } catch (error) {
      console.error('Error deleting attachment:', error);
    }
  };
  
  const handleUpdateRemoteFileDescription = async (id: string, description: string) => {
    try {
      await updateAttachmentMutation.mutateAsync({ id, description });
      refetchAttachments();
    } catch (error) {
      console.error('Error updating attachment:', error);
    }
  };
  
  const getSignedUrl = async (path: string, name: string): Promise<string> => {
    const { data, error } = await supabase.storage
      .from('attachments')
      .createSignedUrl(path, 3600);
    
    if (error) {
      console.error('Error getting signed URL:', error);
      return '';
    }
    
    return data?.signedUrl || '';
  };
  
  const getSignedUrlForPreview = async (path: string): Promise<string> => {
    const { data, error } = await supabase.storage
      .from('attachments')
      .createSignedUrl(path, 60);
    
    if (error) {
      console.error('Error getting preview URL:', error);
      return '';
    }
    
    return data?.signedUrl || '';
  };
  
  const handlePreview = (file: PreviewFile) => {
    setPreviewFile(file);
  };

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
    
    // Передаем форму вместе с новыми файлами (для новых вызовов)
    if (!initialData && newFiles.length > 0) {
      await onSubmit(formData, newFiles);
    } else {
      await onSubmit(formData);
      
      // Если есть новые файлы и вызов уже существует, загружаем их
      if (newFiles.length > 0 && initialData?.id && profile?.id) {
        try {
          const filesWithDescription = newFiles.map(file => ({ file, description: '' }));
          await addEngineerCallAttachments(initialData.id, filesWithDescription, profile.id);
          setNewFiles([]);
          refetchAttachments();
        } catch (error) {
          console.error('Error uploading attachments:', error);
        }
      }
    }
  };

  const handleClose = () => {
    form.resetFields();
    setSelectedProject(null);
    setSelectedBuilding(null);
    setSelectedUnit(null);
    setNewFiles([]);
    setPreviewFile(null);
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
          <Button 
            key="cancel" 
            onClick={handleClose} 
            icon={<CloseOutlined />}
          >
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
          {/* Основная информация */}
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="title"
                label="Название вызова"
                rules={[{ required: true, message: 'Введите название' }]}
              >
                <Input 
                  placeholder="Например: Проверка протечки в квартире 123" 
                  prefix={<FileTextOutlined />}
                />
              </Form.Item>
            </Col>
          </Row>

          {/* Время и дата */}
          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item
                name="date"
                label="Дата"
                rules={[{ required: true, message: 'Выберите дату' }]}
              >
                <DatePicker
                  format="DD.MM.YYYY"
                  style={{ width: '100%' }}
                  placeholder="Выберите дату"
                  onChange={(value) => {
                    console.log('[EngineerCall] Date changed to:', value?.format('DD.MM.YYYY'));
                  }}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                name="startTime"
                label="Время начала"
                rules={[{ required: true, message: 'Укажите время' }]}
              >
                <TimePicker
                  format="HH:mm"
                  use12Hours={false}
                  style={{ width: '100%' }}
                  placeholder="08:00"
                  minuteStep={15}
                  showNow={false}
                  needConfirm={false}
                  onChange={(value) => {
                    console.log('[EngineerCall] Start time changed to:', value?.format('HH:mm'));
                  }}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                name="endTime"
                label="Время окончания"
                rules={[
                  { required: true, message: 'Укажите время' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      const startTime = getFieldValue('startTime');
                      if (!value || !startTime) return Promise.resolve();
                      
                      const start = dayjs.isDayjs(startTime) ? startTime : dayjs(startTime);
                      const end = dayjs.isDayjs(value) ? value : dayjs(value);
                      
                      if (end.isAfter(start)) return Promise.resolve();
                      return Promise.reject(new Error('Должно быть позже начала'));
                    },
                  }),
                ]}
              >
                <TimePicker
                  format="HH:mm"
                  use12Hours={false}
                  style={{ width: '100%' }}
                  placeholder="09:00"
                  minuteStep={15}
                  showNow={false}
                  needConfirm={false}
                  onChange={(value) => {
                    console.log('[EngineerCall] End time changed to:', value?.format('HH:mm'));
                  }}
                />
              </Form.Item>
            </Col>
          </Row>
          
          {/* Быстрая установка длительности */}
          <Row style={{ marginTop: -8, marginBottom: 16 }}>
            <Col span={24}>
              <Space size="small">
                <Text type="secondary" style={{ fontSize: '12px' }}>Быстро:</Text>
                {quickDurations.map(duration => (
                  <Tag
                    key={duration.value}
                    style={{ 
                      cursor: 'pointer', 
                      padding: '4px 12px',
                      borderRadius: '16px',
                      fontSize: '13px'
                    }}
                    color="blue"
                    onClick={() => setQuickDuration(duration.value)}
                  >
                    <ClockCircleOutlined style={{ marginRight: 4 }} />
                    {duration.label}
                  </Tag>
                ))}
              </Space>
            </Col>
          </Row>

          {/* Назначение */}
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item 
                name="project_id" 
                label="Проект" 
                rules={[{ required: true, message: 'Выберите проект' }]}
              >
                <Select
                  placeholder="Выберите проект"
                  onChange={(value) => {
                    console.log('[EngineerCall] Project changed to:', value);
                    const allValuesBefore = form.getFieldsValue();
                    console.log('[EngineerCall] Form values BEFORE project change:', allValuesBefore);
                    
                    setSelectedProject(value);
                    setSelectedBuilding(null);
                    setSelectedUnit(null);
                    
                    // Сохраняем текущие значения даты и времени
                    const currentValues = form.getFieldsValue(['date', 'startTime', 'endTime', 'title', 'description', 'status', 'engineer_id']);
                    console.log('[EngineerCall] Preserved values:', currentValues);
                    
                    form.setFieldsValue({ 
                      ...currentValues,
                      unit_id: null, 
                      claim_id: null 
                    });
                    
                    const allValuesAfter = form.getFieldsValue();
                    console.log('[EngineerCall] Form values AFTER project change:', allValuesAfter);
                  }}
                  showSearch
                  optionFilterProp="children"
                >
                  {projects.map((project) => (
                    <Option key={project.id} value={project.id}>
                      {project.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="engineer_id" label="Инженер">
                <Select
                  placeholder="Выберите инженера"
                  showSearch
                  optionFilterProp="children"
                  allowClear
                >
                  {engineers.map((engineer) => (
                    <Option key={engineer.id} value={engineer.id}>
                      {engineer.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item label="Корпус">
                <Select
                  placeholder={!selectedProject ? "Сначала проект" : "Корпус"}
                  showSearch
                  optionFilterProp="children"
                  allowClear
                  disabled={!selectedProject || unitsLoading}
                  loading={unitsLoading}
                  value={selectedBuilding}
                  onChange={(value) => {
                    console.log('[EngineerCall] Building changed to:', value);
                    const allValuesBefore = form.getFieldsValue();
                    console.log('[EngineerCall] Form values BEFORE building change:', allValuesBefore);
                    
                    setSelectedBuilding(value);
                    setSelectedUnit(null);
                    
                    // Сохраняем текущие значения даты и времени
                    const currentValues = form.getFieldsValue(['date', 'startTime', 'endTime', 'title', 'description', 'status', 'engineer_id', 'project_id']);
                    console.log('[EngineerCall] Preserved values:', currentValues);
                    
                    form.setFieldsValue({ 
                      ...currentValues,
                      unit_id: null, 
                      claim_id: null 
                    });
                    
                    const allValuesAfter = form.getFieldsValue();
                    console.log('[EngineerCall] Form values AFTER building change:', allValuesAfter);
                  }}
                >
                  {buildings.map((building) => (
                    <Option key={building.id} value={building.id}>
                      {building.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="unit_id" label="Квартира">
                <Select
                  placeholder={!selectedProject ? "Сначала проект" : "Квартира"}
                  showSearch
                  optionFilterProp="children"
                  allowClear
                  disabled={!selectedProject || unitsLoading}
                  loading={unitsLoading}
                  onChange={(value) => {
                    console.log('[EngineerCall] Unit changed to:', value);
                    const allValuesBefore = form.getFieldsValue();
                    console.log('[EngineerCall] Form values BEFORE unit change:', allValuesBefore);
                    
                    setSelectedUnit(value);
                    
                    // Сохраняем текущие значения даты и времени
                    const currentValues = form.getFieldsValue(['date', 'startTime', 'endTime', 'title', 'description', 'status', 'engineer_id', 'project_id']);
                    console.log('[EngineerCall] Preserved values:', currentValues);
                    
                    form.setFieldsValue({ 
                      ...currentValues,
                      claim_id: null 
                    });
                    
                    const allValuesAfter = form.getFieldsValue();
                    console.log('[EngineerCall] Form values AFTER unit change:', allValuesAfter);
                  }}
                >
                  {filteredUnits.map((unit) => (
                    <Option key={unit.id} value={unit.id}>
                      {unit.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Претензия">
                <div style={{ display: 'flex', gap: '8px', alignItems: 'start', flexDirection: 'column' }}>
                  <Form.Item name="claim_id" noStyle style={{ width: '100%' }}>
                    <Select
                      style={{ width: '100%' }}
                      placeholder={!selectedUnit ? "Сначала квартиру" : "Претензия"}
                      showSearch
                      optionFilterProp="children"
                      allowClear
                      disabled={!selectedUnit || claimsLoading}
                      loading={claimsLoading}
                    >
                      {filteredClaims.map((claim) => (
                        <Option key={claim.id} value={claim.id}>
                          {claim.claim_no || `ID: ${claim.id}`}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                  <Form.Item shouldUpdate={(prevValues, currentValues) => prevValues.claim_id !== currentValues.claim_id} noStyle>
                    {({ getFieldValue }) =>
                      getFieldValue('claim_id') ? (
                        <Button 
                          type="primary"
                          ghost
                          size="small"
                          icon={<EyeOutlined />}
                          onClick={() => {
                            const claimId = getFieldValue('claim_id');
                            if (claimId) {
                              setViewClaimId(claimId);
                            }
                          }}
                          style={{ 
                            marginTop: '4px',
                            borderRadius: '6px'
                          }}
                        >
                          Открыть претензию
                        </Button>
                      ) : null
                    }
                  </Form.Item>
                </div>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item name="status" label="Статус">
                <Select placeholder="Выберите статус">
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
                          }}
                        />
                        {option.label}
                      </Space>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="notes" label="Примечания">
                <TextArea
                  rows={3}
                  placeholder="Дополнительные заметки..."
                  autoSize={{ minRows: 3, maxRows: 6 }}
                />
              </Form.Item>
            </Col>
          </Row>

          {/* Вложения */}
          <Divider orientation="left">
            <Space>
              <PaperClipOutlined />
              <span>Вложения</span>
            </Space>
          </Divider>
          
          <Form.Item label="Файлы">
            <EngineerCallAttachments
              remoteFiles={remoteFiles}
              newFiles={newFiles}
              onAddFiles={handleFilesAdd}
              onRemoveRemote={handleRemoveRemoteFile}
              onRemoveNew={handleRemoveNewFile}
              onPreview={handlePreview}
              loading={false}
            />
          </Form.Item>
        </Form>
        
        {/* Модальное окно предпросмотра файла */}
        {previewFile && (
          <FilePreviewModal
            file={previewFile}
            open={!!previewFile}
            onClose={() => setPreviewFile(null)}
          />
        )}
      </Modal>
      
      {/* Модальное окно просмотра претензии */}
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