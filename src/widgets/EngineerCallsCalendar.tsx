import React, { useCallback, useMemo, useState } from 'react';
import { Calendar, momentLocalizer, View, SlotInfo } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/ru';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Button, Card, Space, Tag, Tooltip, Badge, Typography, Divider } from 'antd';
import { 
  PlusOutlined, 
  CalendarOutlined, 
  UserOutlined, 
  HomeOutlined, 
  PhoneOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined
} from '@ant-design/icons';
import { useEngineerCalls } from '@/entities/engineerCall';
import type { CalendarEvent, EngineerCallWithNames } from '@/shared/types/engineerCall';
import dayjs from 'dayjs';
import 'dayjs/locale/ru';
import styled from 'styled-components';

// Настройка локализации moment для русского языка
moment.locale('ru', {
  months: ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'],
  monthsShort: ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'],
  weekdays: ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'],
  weekdaysShort: ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'],
  weekdaysMin: ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'],
  week: {
    dow: 1, // Понедельник - первый день недели
    doy: 4
  }
});
dayjs.locale('ru');

const { Title, Text } = Typography;
const localizer = momentLocalizer(moment);

// Styled Components для современного дизайна
const StyledCard = styled(Card)`
  .ant-card-head {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-bottom: none;
    
    .ant-card-head-title {
      color: white;
      font-weight: 600;
    }
    
    .ant-card-extra {
      .ant-btn-primary {
        background: rgba(255, 255, 255, 0.2);
        border: 1px solid rgba(255, 255, 255, 0.3);
        backdrop-filter: blur(10px);
        transition: all 0.3s ease;
        
        &:hover {
          background: rgba(255, 255, 255, 0.3);
          border-color: rgba(255, 255, 255, 0.5);
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        }
      }
    }
  }
  
  .ant-card-body {
    padding: 0;
    background: #f8fafc;
  }
  
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  border: none;
  overflow: hidden;
`;

const CalendarWrapper = styled.div`
  height: 700px;
  padding: 24px;
  
  .rbc-calendar {
    background: white;
    border-radius: 12px;
    border: none;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial;
  }
  
  .rbc-header {
    background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
    border-bottom: 1px solid #e2e8f0;
    color: #475569;
    font-weight: 600;
    padding: 16px 8px;
    text-transform: uppercase;
    font-size: 11px;
    letter-spacing: 1px;
  }
  
  .rbc-today {
    background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  }
  
  .rbc-off-range-bg {
    background: #f8fafc;
  }
  
  .rbc-date-cell {
    padding: 8px;
    
    button {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      border: none;
      background: transparent;
      color: #64748b;
      font-weight: 500;
      transition: all 0.2s ease;
      
      &:hover {
        background: #e2e8f0;
        color: #334155;
      }
    }
    
    &.rbc-now button {
      background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
      color: white;
      box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
    }
  }
  
  .rbc-event {
    border: none !important;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    transition: all 0.2s ease;
    
    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    }
  }
  
  .rbc-slot-selection {
    background: rgba(59, 130, 246, 0.2);
    border: 2px solid #3b82f6;
    border-radius: 6px;
  }
  
  .rbc-toolbar {
    margin-bottom: 24px;
    padding: 0 4px;
    
    .rbc-btn-group {
      button {
        border: 1px solid #e2e8f0;
        background: white;
        color: #64748b;
        font-weight: 500;
        padding: 8px 16px;
        border-radius: 8px;
        margin-right: 2px;
        transition: all 0.2s ease;
        
        &:hover {
          background: #f1f5f9;
          border-color: #cbd5e1;
          color: #334155;
        }
        
        &.rbc-active {
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          border-color: #3b82f6;
          color: white;
          box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
        }
      }
    }
    
    .rbc-toolbar-label {
      font-size: 20px;
      font-weight: 600;
      color: #1e293b;
      margin: 0 24px;
    }
  }
`;

const EventCard = styled.div<{ status: string }>`
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  line-height: 1.4;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 3px;
    background: ${props => {
      switch (props.status) {
        case 'completed': return '#10b981';
        case 'in_progress': return '#f59e0b';
        case 'cancelled': return '#ef4444';
        default: return '#3b82f6';
      }
    }};
    opacity: 0.8;
  }
  
  .event-title {
    font-weight: 600;
    margin-bottom: 2px;
    display: block;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .event-meta {
    font-size: 10px;
    opacity: 0.9;
    display: flex;
    align-items: center;
    gap: 4px;
  }
`;

const StatusIndicator = styled.div<{ color: string }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${props => props.color};
  flex-shrink: 0;
  box-shadow: 0 0 6px rgba(0, 0, 0, 0.2);
`;

const TooltipContent = styled.div`
  .tooltip-title {
    font-weight: 600;
    font-size: 14px;
    margin-bottom: 8px;
    color: white;
  }
  
  .tooltip-row {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 4px;
    font-size: 12px;
    
    &:last-child {
      margin-bottom: 0;
    }
    
    .anticon {
      opacity: 0.8;
      min-width: 12px;
    }
  }
  
  .status-tag {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    background: rgba(255, 255, 255, 0.2);
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 11px;
  }
`;

interface CalendarProps {
  onSelectSlot: (slotInfo: SlotInfo) => void;
  onSelectEvent: (event: CalendarEvent) => void;
  onCreateNew: () => void;
}

const EngineerCallsCalendar: React.FC<CalendarProps> = ({
  onSelectSlot,
  onSelectEvent,
  onCreateNew,
}) => {
  const [view, setView] = useState<View>('month');
  const [date, setDate] = useState(new Date());

  // Получаем начало и конец видимого периода
  const dateRange = useMemo(() => {
    const start = dayjs(date).startOf('month').subtract(7, 'days').toDate();
    const end = dayjs(date).endOf('month').add(7, 'days').toDate();
    return { start, end };
  }, [date]);

  const { data: engineerCalls = [], isLoading } = useEngineerCalls(
    dateRange.start,
    dateRange.end
  );

  // Преобразуем вызовы в события календаря
  const events: CalendarEvent[] = useMemo(() => {
    return engineerCalls.map((call) => ({
      id: call.id,
      title: call.title,
      start: new Date(call.start_datetime),
      end: new Date(call.end_datetime),
      resource: call,
      color: getStatusColor(call.status),
    }));
  }, [engineerCalls]);

  // Улучшенные цвета для статусов с градиентами
  function getStatusColor(status: string): string {
    switch (status) {
      case 'scheduled':
        return '#3b82f6'; // современный синий
      case 'in_progress':
        return '#f59e0b'; // современный оранжевый
      case 'completed':
        return '#10b981'; // современный зеленый
      case 'cancelled':
        return '#ef4444'; // современный красный
      default:
        return '#6b7280'; // современный серый
    }
  }
  
  // Функция для получения контрастного цвета текста
  function getTextColor(backgroundColor: string): string {
    // Для темных фонов используем белый текст, для светлых - темный
    const darkColors = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6'];
    return darkColors.includes(backgroundColor) ? 'white' : '#1f2937';
  }

  // Современный компонент события с улучшенным дизайном
  const EventComponent = useCallback(({ event }: { event: CalendarEvent }) => {
    const call = event.resource as EngineerCallWithNames;
    const statusLabels: Record<string, string> = {
      scheduled: 'Запланирован',
      in_progress: 'В процессе',
      completed: 'Завершен',
      cancelled: 'Отменен',
    };

    const timeRange = `${dayjs(event.start).format('HH:mm')} - ${dayjs(event.end).format('HH:mm')}`;

    return (
      <Tooltip
        title={
          <TooltipContent>
            <div className="tooltip-title">{event.title}</div>
            <div className="tooltip-row">
              <ClockCircleOutlined />
              <span>{timeRange}</span>
            </div>
            {call?.engineer_name && (
              <div className="tooltip-row">
                <UserOutlined />
                <span>{call.engineer_name}</span>
              </div>
            )}
            {call?.unit_name && (
              <div className="tooltip-row">
                <HomeOutlined />
                <span>{call.unit_name}</span>
              </div>
            )}
            {call?.location && (
              <div className="tooltip-row">
                <EnvironmentOutlined />
                <span>{call.location}</span>
              </div>
            )}
            {call?.contact_name && (
              <div className="tooltip-row">
                <PhoneOutlined />
                <span>{call.contact_name}</span>
              </div>
            )}
            <div className="tooltip-row">
              <div className="status-tag">
                <StatusIndicator color={event.color || '#6b7280'} />
                {statusLabels[call?.status || 'scheduled']}
              </div>
            </div>
          </TooltipContent>
        }
        overlayStyle={{ maxWidth: '300px' }}
        color="rgba(15, 23, 42, 0.95)"
      >
        <EventCard status={call?.status || 'scheduled'}>
          <span className="event-title">{event.title}</span>
          <div className="event-meta">
            <ClockCircleOutlined />
            <span>{timeRange}</span>
            {call?.engineer_name && (
              <>
                <UserOutlined />
                <span>{call.engineer_name.split(' ')[0]}</span>
              </>
            )}
          </div>
        </EventCard>
      </Tooltip>
    );
  }, []);

  // Кастомные форматы для календаря
  const formats = useMemo(() => ({
    monthHeaderFormat: (date: Date) => moment(date).format('MMMM YYYY'),
    weekdayFormat: (date: Date) => moment(date).format('ddd'), // Сокращенное название дня недели
    dayFormat: (date: Date) => moment(date).format('D'),
    dayHeaderFormat: (date: Date) => moment(date).format('D MMMM YYYY, dddd'),
    dayRangeHeaderFormat: ({ start, end }: { start: Date; end: Date }) =>
      `${moment(start).format('D MMMM')} — ${moment(end).format('D MMMM YYYY')}`,
    agendaDateFormat: (date: Date) => moment(date).format('D MMMM, dddd'),
    agendaTimeFormat: (date: Date) => moment(date).format('HH:mm'),
    agendaTimeRangeFormat: ({ start, end }: { start: Date; end: Date }) =>
      `${moment(start).format('HH:mm')} — ${moment(end).format('HH:mm')}`,
    timeGutterFormat: (date: Date) => moment(date).format('HH:mm'),
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

  // Статистика по статусам для отображения в хедере
  const statusStats = useMemo(() => {
    const stats = events.reduce((acc, event) => {
      const status = (event.resource as EngineerCallWithNames)?.status || 'scheduled';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return [
      { label: 'Запланировано', value: stats.scheduled || 0, color: '#3b82f6' },
      { label: 'В процессе', value: stats.in_progress || 0, color: '#f59e0b' },
      { label: 'Завершено', value: stats.completed || 0, color: '#10b981' },
      { label: 'Отменено', value: stats.cancelled || 0, color: '#ef4444' },
    ].filter(stat => stat.value > 0);
  }, [events]);

  if (isLoading) {
    return (
      <StyledCard loading={true} style={{ height: '600px' }}>
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <Text type="secondary">Загрузка календаря...</Text>
        </div>
      </StyledCard>
    );
  }

  return (
    <StyledCard
      title={
        <Space size="large">
          <Space>
            <CalendarOutlined />
            <span>Календарь вызовов инженеров</span>
          </Space>
          {statusStats.length > 0 && (
            <Space split={<Divider type="vertical" />}>
              {statusStats.map(stat => (
                <Badge
                  key={stat.label}
                  count={stat.value}
                  color={stat.color}
                  showZero={false}
                  size="small"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    fontSize: '11px'
                  }}
                >
                  <Text style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '12px' }}>
                    {stat.label}
                  </Text>
                </Badge>
              ))}
            </Space>
          )}
        </Space>
      }
      extra={
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={onCreateNew}
          size="large"
          style={{ borderRadius: '8px' }}
        >
          Добавить вызов
        </Button>
      }
    >
      <CalendarWrapper>
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
          components={{
            event: EventComponent,
          }}
          eventPropGetter={(event) => ({
            style: {
              backgroundColor: event.color,
              borderColor: event.color,
              color: getTextColor(event.color || '#6b7280'),
            },
          })}
          step={15}
          timeslots={4}
          min={new Date(2023, 0, 1, 8, 0)}
          max={new Date(2023, 0, 1, 21, 0)}
        />
      </CalendarWrapper>
    </StyledCard>
  );
};

export default EngineerCallsCalendar;