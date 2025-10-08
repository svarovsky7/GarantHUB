import React, { useCallback, useMemo, useState } from 'react';
import { Calendar, momentLocalizer, View, SlotInfo } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/ru';
import 'react-big-calendar/lib/css/react-big-calendar.css';

// Устанавливаем русскую локаль по умолчанию
moment.locale('ru');
import { isWeekend, isHoliday } from '@/shared/utils/russianHolidays';
import { 
  Button, 
  Card, 
  Space, 
  Tag, 
  Tooltip, 
  Badge, 
  Row, 
  Col, 
  Statistic,
  Typography,
  Select,
  DatePicker,
  Table,
  Divider,
  Switch,
  ConfigProvider
} from 'antd';
import locale from 'antd/es/locale/ru_RU';
import { 
  PlusOutlined, 
  CalendarOutlined, 
  ClockCircleOutlined,
  UserOutlined,
  HomeOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  CloseCircleOutlined,
  ScheduleOutlined,
  ProjectOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import { useEngineerCalls, useEngineers } from '@/entities/engineerCall';
import { useEngineerCallStatuses } from '@/entities/status/status';
import type { CalendarEvent, EngineerCallWithNames } from '@/shared/types/engineerCall';
import { useProjects } from '@/shared/hooks/useProjects';
import { useAuthStore } from '@/shared/store/authStore';
import dayjs from 'dayjs';
import 'dayjs/locale/ru';
import './EngineerCallsCalendar.css';

const { Title } = Typography;
const { RangePicker } = DatePicker;

// Настройка локализации moment для русского языка с 24-часовым форматом
moment.updateLocale('ru', {
  week: {
    dow: 1, // Неделя начинается с понедельника
    doy: 4  // Первая неделя года содержит 4 января
  },
  weekdays: 'воскресенье_понедельник_вторник_среда_четверг_пятница_суббота'.split('_'),
  weekdaysShort: 'вс_пн_вт_ср_чт_пт_сб'.split('_'),
  weekdaysMin: 'вс_пн_вт_ср_чт_пт_сб'.split('_'),
  months: 'январь_февраль_март_апрель_май_июнь_июль_август_сентябрь_октябрь_ноябрь_декабрь'.split('_'),
  monthsShort: 'янв_фев_мар_апр_май_июн_июл_авг_сен_окт_ноя_дек'.split('_'),
  longDateFormat: {
    LT: 'HH:mm',
    LTS: 'HH:mm:ss',
    L: 'DD.MM.YYYY',
    LL: 'D MMMM YYYY г.',
    LLL: 'D MMMM YYYY г., HH:mm',
    LLLL: 'dddd, D MMMM YYYY г., HH:mm'
  },
  calendar: {
    sameDay: '[Сегодня в] HH:mm',
    nextDay: '[Завтра в] HH:mm',
    lastDay: '[Вчера в] HH:mm',
    nextWeek: 'dddd [в] HH:mm',
    lastWeek: 'dddd [в] HH:mm',
    sameElse: 'L'
  }
});

// Установка локали для dayjs
dayjs.locale('ru');

// Создаем localizer с явным указанием локали
const localizer = momentLocalizer(moment);

interface CalendarProps {
  onSelectSlot: (slotInfo: SlotInfo) => void;
  onSelectEvent: (event: CalendarEvent) => void;
  onCreateNew: () => void;
  onDeleteEvent?: (id: string) => void;
}

// Удалил весь неработающий код CustomToolbar и связанные компоненты

// Кастомный компонент тулбара с закрепленными кнопками переключения видов
const CustomToolbar: React.FC<any> = ({ label, onNavigate, onView, view }) => {
  return (
    <div className="rbc-toolbar">
      <span className="rbc-btn-group">
        <button type="button" onClick={() => onNavigate('PREV')}>←</button>
        <button type="button" onClick={() => onNavigate('TODAY')}>Сегодня</button>
        <button type="button" onClick={() => onNavigate('NEXT')}>→</button>
      </span>
      <span className="rbc-toolbar-label">{label}</span>
      <span className="rbc-btn-group">
        <button
          type="button"
          className={view === 'month' ? 'rbc-active' : ''}
          onClick={() => onView('month')}
        >
          Месяц
        </button>
        <button
          type="button"
          className={view === 'week' ? 'rbc-active' : ''}
          onClick={() => onView('week')}
        >
          Неделя
        </button>
        <button
          type="button"
          className={view === 'day' ? 'rbc-active' : ''}
          onClick={() => onView('day')}
        >
          День
        </button>
        <button
          type="button"
          className={view === 'agenda' ? 'rbc-active' : ''}
          onClick={() => onView('agenda')}
        >
          Список
        </button>
      </span>
    </div>
  );
};

const EngineerCallsCalendarModern: React.FC<CalendarProps> = ({
  onSelectSlot,
  onSelectEvent,
  onCreateNew,
  onDeleteEvent,
}) => {
  const [view, setView] = useState<View>('month');
  const [date, setDate] = useState(new Date());
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedEngineerIds, setSelectedEngineerIds] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null]>([null, null]);
  
  // Получаем профиль текущего пользователя
  const profile = useAuthStore((s) => s.profile);
  
  // Состояние для переключателя "Только мои встречи" с сохранением в localStorage
  const [onlyMyMeetings, setOnlyMyMeetings] = useState<boolean>(() => {
    const saved = localStorage.getItem('engineerCalls_onlyMyMeetings');
    return saved === 'true';
  });
  
  // Сохраняем состояние переключателя при изменении
  const handleOnlyMyMeetingsChange = (checked: boolean) => {
    setOnlyMyMeetings(checked);
    localStorage.setItem('engineerCalls_onlyMyMeetings', String(checked));
  };
  
  // Получаем список проектов, инженеров и статусов
  const { data: projects = [], isLoading: projectsLoading } = useProjects();
  const { data: engineers = [], isLoading: engineersLoading } = useEngineers();
  const { data: dbStatuses = [] } = useEngineerCallStatuses();

  // Получаем начало и конец периода для запроса
  const queryDateRange = useMemo(() => {
    // Если задан фильтр по периоду, используем его
    if (dateRange[0] && dateRange[1]) {
      return {
        start: dateRange[0].startOf('day').toDate(),
        end: dateRange[1].endOf('day').toDate()
      };
    }
    // Иначе показываем текущий месяц с буфером
    const start = dayjs(date).startOf('month').subtract(7, 'days').toDate();
    const end = dayjs(date).endOf('month').add(7, 'days').toDate();
    return { start, end };
  }, [date, dateRange]);

  const { data: engineerCalls = [], isLoading } = useEngineerCalls(
    queryDateRange.start,
    queryDateRange.end,
    selectedProjectId ? Number(selectedProjectId) : null
  );

  // Фильтруем вызовы по выбранным фильтрам
  const filteredCalls = useMemo(() => {
    let filtered = [...engineerCalls];
    
    // Фильтр "Только мои встречи" - показывать только вызовы, где текущий пользователь назначен инженером
    if (onlyMyMeetings && profile?.id) {
      filtered = filtered.filter(call => call.engineer_id === profile.id);
    }
    
    // Фильтр по инженерам (не применяется если включен "Только мои встречи")
    if (!onlyMyMeetings && selectedEngineerIds.length > 0) {
      filtered = filtered.filter(call => 
        call.engineer_id && selectedEngineerIds.includes(call.engineer_id)
      );
    }
    
    return filtered;
  }, [engineerCalls, selectedEngineerIds, onlyMyMeetings, profile?.id]);

  // Создаем карту статусов из БД для быстрого доступа
  const statusColorMap = useMemo(() => {
    const map: Record<string, string> = {};
    dbStatuses.forEach(status => {
      if (status.color) {
        map[status.name] = status.color;
      }
    });
    // Добавляем fallback для старых английских статусов (если есть)
    map['scheduled'] = '#1890ff';
    map['in_progress'] = '#fa8c16';
    map['completed'] = '#52c41a';
    map['cancelled'] = '#ff4d4f';
    return map;
  }, [dbStatuses]);

  // Преобразуем вызовы в события календаря
  const events: CalendarEvent[] = useMemo(() => {
    return filteredCalls.map((call) => {
      // Убедимся, что даты правильно парсятся
      const startDate = new Date(call.start_datetime);
      const endDate = new Date(call.end_datetime);
      
      // Определяем цвет по статусу
      const color = statusColorMap[call.status] || '#8c8c8c';
      
      return {
        id: call.id,
        title: call.title || 'Без названия',
        start: startDate,
        end: endDate,
        resource: call,
        color: color,
      };
    });
  }, [filteredCalls, statusColorMap]);

  // Опции статусов из БД
  const statusOptions = useMemo(() => {
    // Если статусы есть в БД, используем их
    if (dbStatuses.length > 0) {
      return dbStatuses.map(status => ({
        value: status.name,
        label: status.name,
        color: status.color || '#8c8c8c'
      }));
    }
    // Fallback на случай если статусы еще не загрузились
    return [
      { value: 'Запланировано', label: 'Запланировано', color: '#1976d2' },
      { value: 'Проведено', label: 'Проведено', color: '#19d21c' },
      { value: 'Отменено', label: 'Отменено', color: '#c20f0f' },
    ];
  }, [dbStatuses]);

  // Статистика по статусам (для отфильтрованных вызовов)
  const statistics = useMemo(() => {
    const stats: Record<string, number> = {
      total: filteredCalls.length
    };
    
    // Инициализируем счетчики для всех статусов из БД
    dbStatuses.forEach(status => {
      stats[status.name] = 0;
    });
    
    // Подсчитываем вызовы по статусам
    filteredCalls.forEach(call => {
      if (call.status && stats.hasOwnProperty(call.status)) {
        stats[call.status]++;
      }
    });
    
    return stats;
  }, [filteredCalls, dbStatuses]);

  // Колонки для таблицы в режиме agenda
  const agendaColumns = useMemo(() => [
    {
      title: 'Дата',
      dataIndex: 'start',
      key: 'date',
      sorter: (a: CalendarEvent, b: CalendarEvent) => 
        a.start.getTime() - b.start.getTime(),
      render: (date: Date) => dayjs(date).format('DD.MM.YYYY'),
    },
    {
      title: 'Время',
      dataIndex: 'start',
      key: 'time',
      render: (_: Date, record: CalendarEvent) => {
        const call = record.resource as EngineerCallWithNames;
        return `${dayjs(call.start_datetime).format('HH:mm')} - ${dayjs(call.end_datetime).format('HH:mm')}`;
      },
    },
    {
      title: 'Название',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      sorter: (a: CalendarEvent, b: CalendarEvent) => 
        a.title.localeCompare(b.title, 'ru'),
    },
    {
      title: 'Проект',
      key: 'project',
      ellipsis: true,
      render: (_: any, record: CalendarEvent) => {
        const call = record.resource as EngineerCallWithNames;
        return (
          <Space>
            <ProjectOutlined />
            <span>{call?.project_name || 'Не указан'}</span>
          </Space>
        );
      },
      sorter: (a: CalendarEvent, b: CalendarEvent) => {
        const callA = a.resource as EngineerCallWithNames;
        const callB = b.resource as EngineerCallWithNames;
        return (callA?.project_name || '').localeCompare(callB?.project_name || '', 'ru');
      },
    },
    {
      title: 'Квартира',
      key: 'unit',
      ellipsis: true,
      render: (_: any, record: CalendarEvent) => {
        const call = record.resource as EngineerCallWithNames;
        return call?.unit_name ? (
          <Space>
            <HomeOutlined />
            <span>{call.unit_name}</span>
          </Space>
        ) : null;
      },
      sorter: (a: CalendarEvent, b: CalendarEvent) => {
        const callA = a.resource as EngineerCallWithNames;
        const callB = b.resource as EngineerCallWithNames;
        return (callA?.unit_name || '').localeCompare(callB?.unit_name || '', 'ru');
      },
    },
    {
      title: 'Инженер',
      key: 'engineer',
      ellipsis: true,
      render: (_: any, record: CalendarEvent) => {
        const call = record.resource as EngineerCallWithNames;
        return call?.engineer_name ? (
          <Space>
            <UserOutlined />
            <span>{call.engineer_name}</span>
          </Space>
        ) : (
          <span style={{ color: '#bfbfbf' }}>Не назначен</span>
        );
      },
      sorter: (a: CalendarEvent, b: CalendarEvent) => {
        const callA = a.resource as EngineerCallWithNames;
        const callB = b.resource as EngineerCallWithNames;
        return (callA?.engineer_name || '').localeCompare(callB?.engineer_name || '', 'ru');
      },
    },
    {
      title: 'Статус',
      key: 'status',
      filters: statusOptions.map(opt => ({ text: opt.label, value: opt.value })),
      onFilter: (value: any, record: CalendarEvent) => {
        const call = record.resource as EngineerCallWithNames;
        return call.status === value;
      },
      render: (_: any, record: CalendarEvent) => {
        const call = record.resource as EngineerCallWithNames;
        const status = statusOptions.find(s => s.value === call.status);
        return (
          <Tag color={status?.color || '#8c8c8c'}>
            {status?.label || call.status}
          </Tag>
        );
      },
    },
    {
      title: 'Действия',
      key: 'actions',
      width: 100,
      align: 'center' as const,
      render: (_: any, record: CalendarEvent) => (
        <Space>
          <Tooltip title="Удалить">
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                if (onDeleteEvent) {
                  const call = record.resource as EngineerCallWithNames;
                  onDeleteEvent(call.id);
                }
              }}
            />
          </Tooltip>
        </Space>
      ),
    },
  ], [statusOptions, onDeleteEvent]);

  // Упрощенный компонент события
  const EventComponent = useCallback(({ event }: { event: CalendarEvent }) => {
    const call = event.resource as EngineerCallWithNames;
    const startTime = dayjs(call.start_datetime).format('HH:mm');
    
    return (
      <Tooltip
        title={
          <div>
            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
              {event.title}
            </div>
            <div>Время: {startTime} - {dayjs(call.end_datetime).format('HH:mm')}</div>
            {call?.engineer_name && <div>Инженер: {call.engineer_name}</div>}
            {call?.unit_name && <div>Квартира: {call.unit_name}</div>}
          </div>
        }
      >
        <div 
          style={{ 
            backgroundColor: event.color,
            color: 'white',
            padding: '2px 6px',
            borderRadius: '3px',
            fontSize: '12px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            cursor: 'pointer'
          }}
        >
          <span style={{ fontWeight: 600 }}>{startTime}</span> {event.title}
        </div>
      </Tooltip>
    );
  }, []);

  // Кастомные форматы для календаря с правильными русскими днями недели и 24-часовым форматом
  const formats = useMemo(() => ({
    monthHeaderFormat: (date: Date) => {
      const month = moment(date).format('MMMM YYYY');
      // Делаем первую букву заглавной
      return month.charAt(0).toUpperCase() + month.slice(1);
    },
    weekdayFormat: (date: Date) => {
      const dayNames = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
      const dayIndex = moment(date).day();
      // Корректируем индекс для понедельника как первого дня
      const adjustedIndex = dayIndex === 0 ? 6 : dayIndex - 1;
      return dayNames[adjustedIndex];
    },
    dayFormat: (date: Date) => moment(date).format('D'),
    dayHeaderFormat: (date: Date) => {
      const formatted = moment(date).format('D MMMM YYYY, dddd');
      return formatted.charAt(0).toUpperCase() + formatted.slice(1);
    },
    dayRangeHeaderFormat: ({ start, end }: { start: Date; end: Date }) => {
      const startStr = moment(start).format('D MMMM');
      const endStr = moment(end).format('D MMMM YYYY');
      return `${startStr.charAt(0).toUpperCase() + startStr.slice(1)} — ${endStr.charAt(0).toUpperCase() + endStr.slice(1)}`;
    },
    agendaDateFormat: (date: Date) => {
      const formatted = moment(date).format('D MMMM, dddd');
      return formatted.charAt(0).toUpperCase() + formatted.slice(1);
    },
    agendaTimeFormat: (date: Date) => moment(date).format('HH:mm'),
    agendaTimeRangeFormat: ({ start, end }: { start: Date; end: Date }) =>
      `${moment(start).format('HH:mm')} — ${moment(end).format('HH:mm')}`,
    timeGutterFormat: (date: Date) => moment(date).format('HH:mm'),
    // Дополнительные форматы для полной локализации
    eventTimeRangeFormat: ({ start, end }: { start: Date; end: Date }, culture?: string, localizer?: any) =>
      `${moment(start).format('HH:mm')} — ${moment(end).format('HH:mm')}`,
    eventTimeRangeStartFormat: () => 'HH:mm',
    eventTimeRangeEndFormat: () => 'HH:mm',
    selectRangeFormat: ({ start, end }: { start: Date; end: Date }, culture?: string, localizer?: any) =>
      `${moment(start).format('HH:mm')} — ${moment(end).format('HH:mm')}`,
  }), []);

  // Сообщения на русском языке
  const messages = useMemo(() => ({
    today: 'Сегодня',
    previous: 'Назад',
    next: 'Вперед',
    month: 'Месяц',
    week: 'Неделя',
    day: 'День',
    agenda: 'Список',
    date: 'Дата',
    time: 'Время',
    event: 'Событие',
    noEventsInRange: 'Нет событий в этом периоде',
    showMore: (total: number) => `+ еще ${total}`,
  }), []);

  if (isLoading) {
    return (
      <Card 
        loading={true} 
        style={{ 
          height: '600px',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
        }}
      >
        Загрузка календаря...
      </Card>
    );
  }

  return (
    <div>
      {/* Фильтры */}
      <Card
        style={{
          marginBottom: '24px',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
        }}
        styles={{
          body: { padding: '16px 24px' }
        }}
      >
        <Row gutter={[16, 16]}>
          {/* Первая строка: фильтры */}
          <Col xs={24} sm={12} md={6}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center',
                gap: '8px',
                marginBottom: '4px'
              }}>
                <ProjectOutlined style={{ color: '#1890ff', fontSize: '16px' }} />
                <span style={{ fontWeight: 500 }}>Проект</span>
              </div>
              <Select
                placeholder="Все проекты"
                style={{ width: '100%' }}
                allowClear
                showSearch
                optionFilterProp="children"
                value={selectedProjectId}
                onChange={setSelectedProjectId}
                loading={projectsLoading}
                size="large"
              >
                {projects.map(project => (
                  <Select.Option key={project.id} value={project.id}>
                    {project.name}
                  </Select.Option>
                ))}
              </Select>
            </Space>
          </Col>
          
          <Col xs={24} sm={12} md={8}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center',
                gap: '8px',
                marginBottom: '4px'
              }}>
                <UserOutlined style={{ color: '#1890ff', fontSize: '16px' }} />
                <span style={{ fontWeight: 500 }}>Инженеры</span>
              </div>
              <Select
                mode="multiple"
                placeholder="Все инженеры"
                style={{ width: '100%' }}
                allowClear
                showSearch
                optionFilterProp="children"
                value={selectedEngineerIds}
                onChange={setSelectedEngineerIds}
                loading={engineersLoading}
                size="large"
                maxTagCount={2}
                disabled={onlyMyMeetings}
              >
                {engineers.map(engineer => (
                  <Select.Option key={engineer.id} value={engineer.id}>
                    {engineer.name}
                  </Select.Option>
                ))}
              </Select>
            </Space>
          </Col>
          
          <Col xs={24} sm={12} md={8}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center',
                gap: '8px',
                marginBottom: '4px'
              }}>
                <CalendarOutlined style={{ color: '#1890ff', fontSize: '16px' }} />
                <span style={{ fontWeight: 500 }}>Период</span>
              </div>
              <ConfigProvider locale={locale}>
                <RangePicker
                  style={{ width: '100%' }}
                  size="large"
                  value={dateRange}
                  onChange={(dates) => setDateRange(dates || [null, null])}
                  format="DD.MM.YYYY"
                  placeholder={['Начало', 'Конец']}
                  allowClear
                />
              </ConfigProvider>
            </Space>
          </Col>
        </Row>
        
        {/* Вторая строка: переключатель "Только мои встречи" */}
        <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
          <Col xs={24}>
            <Space>
              <Switch
                checked={onlyMyMeetings}
                onChange={handleOnlyMyMeetingsChange}
                checkedChildren="Мои встречи"
                unCheckedChildren="Все встречи"
              />
              <span style={{ 
                color: onlyMyMeetings ? '#1890ff' : '#8c8c8c',
                fontWeight: onlyMyMeetings ? 500 : 400
              }}>
                {onlyMyMeetings 
                  ? 'Показаны только встречи, где вы назначены инженером' 
                  : 'Показаны все доступные встречи'}
              </span>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Календарь */}
      <Card
        className="calendar-card"
        style={{
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          border: 'none'
        }}
        styles={{
          body: { padding: '24px' },
          header: { padding: 0, border: 'none' }
        }}
      >
        {/* Заголовок с кнопкой и статистикой */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <Space>
            <CalendarOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
            <Title level={4} style={{ margin: 0 }}>Календарь вызовов</Title>
            <Divider type="vertical" />
            <Space>
              <span>Всего: <strong>{statistics.total}</strong></span>
              {dbStatuses.length > 0 && (
                <>
                  {dbStatuses.map((status, index) => (
                    <React.Fragment key={status.name}>
                      <Divider type="vertical" />
                      <span>
                        {status.name}: 
                        <strong style={{ color: status.color || '#8c8c8c', marginLeft: '4px' }}>
                          {statistics[status.name] || 0}
                        </strong>
                      </span>
                    </React.Fragment>
                  ))}
                </>
              )}
            </Space>
          </Space>
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={onCreateNew}
            size="large"
            style={{
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none',
              boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)'
            }}
          >
            Добавить вызов
          </Button>
        </div>
          {view === 'agenda' ? (
            <>
              <CustomToolbar 
                label={moment(date).format('MMMM YYYY')}
                onNavigate={(action: string) => {
                  if (action === 'PREV') {
                    setDate(moment(date).subtract(1, 'month').toDate());
                  } else if (action === 'NEXT') {
                    setDate(moment(date).add(1, 'month').toDate());
                  } else if (action === 'TODAY') {
                    setDate(new Date());
                  }
                }}
                onView={setView}
                view={view}
              />
              <Table
                columns={agendaColumns}
                dataSource={events}
                rowKey="id"
                tableLayout="auto"
                pagination={{
                  defaultPageSize: 10,
                  pageSizeOptions: ['10', '20', '50', '100'],
                  showSizeChanger: true,
                  showTotal: (total) => `Всего: ${total} вызовов`,
                }}
                onRow={(record) => ({
                  onClick: () => onSelectEvent(record),
                  style: { cursor: 'pointer' },
                })}
                locale={{
                  filterTitle: 'Фильтр',
                  filterConfirm: 'OK',
                  filterReset: 'Сброс',
                  emptyText: 'Нет вызовов',
                  sortTitle: 'Сортировка',
                }}
                size="middle"
                style={{ width: '100%' }}
              />
            </>
          ) : (
            <div style={{ 
              height: '700px',
              background: 'white',
              borderRadius: '8px',
              border: '1px solid #f0f0f0'
            }}>
              <Calendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                view={view}
                date={date}
                onView={setView}
                onNavigate={setDate}
                onSelectSlot={onSelectSlot}
                onSelectEvent={onSelectEvent}
                selectable
                popup
                formats={formats}
                messages={messages}
                culture="ru"
                firstDayOfWeek={1}
                components={{
                  toolbar: CustomToolbar,
                  event: EventComponent,
                }}
                eventPropGetter={(event) => ({
                  style: {
                    backgroundColor: event.color,
                    border: 'none',
                    color: 'white',
                  }
                })}
                dayPropGetter={(date) => {
                  const isToday = moment(date).isSame(moment(), 'day');
                  const weekend = isWeekend(date);
                  const holiday = isHoliday(date);
                  
                  let style: React.CSSProperties = {};
                  
                  // Выходные дни - светло-серый фон
                  if (weekend) {
                    style.backgroundColor = 'rgba(0, 0, 0, 0.04)';
                  }
                  
                  // Праздничные дни - светло-красный фон
                  if (holiday) {
                    style.backgroundColor = 'rgba(255, 77, 79, 0.08)';
                    style.fontWeight = 600;
                  }
                  
                  // Сегодняшний день - синий фон
                  if (isToday) {
                    style.backgroundColor = 'rgba(24, 144, 255, 0.1)';
                    style.borderRadius = '8px';
                    style.border = '2px solid #1890ff';
                  }
                  
                  return { style };
                }}
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial',
                }}
                min={new Date(0, 0, 0, 8, 0, 0)}
                max={new Date(0, 0, 0, 21, 0, 0)}
                step={15}
                timeslots={4}
              />
            </div>
          )}
      </Card>
    </div>
  );
};

export default EngineerCallsCalendarModern;