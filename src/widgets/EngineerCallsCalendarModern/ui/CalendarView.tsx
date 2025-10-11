import React, { useMemo, useCallback } from 'react';
import { Calendar as BigCalendar, momentLocalizer, View, SlotInfo } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { isWeekend, isHoliday } from '@/shared/utils/russianHolidays';
import type { CalendarEvent } from '@/shared/types/engineerCall';
import { CalendarToolbar } from './CalendarToolbar';
import { EventRenderer } from './EventRenderer';

const localizer = momentLocalizer(moment);

interface CalendarViewProps {
  events: CalendarEvent[];
  view: View;
  date: Date;
  onView: (view: View) => void;
  onNavigate: (date: Date) => void;
  onSelectSlot: (slotInfo: SlotInfo) => void;
  onSelectEvent: (event: CalendarEvent) => void;
}

/**
 * Main calendar view component using react-big-calendar
 * Handles month, week, day views with custom styling
 */
export const CalendarView: React.FC<CalendarViewProps> = ({
  events,
  view,
  date,
  onView,
  onNavigate,
  onSelectSlot,
  onSelectEvent,
}) => {
  // Custom formats for Russian locale with 24-hour format
  const formats = useMemo(
    () => ({
      monthHeaderFormat: (date: Date) => {
        const month = moment(date).format('MMMM YYYY');
        return month.charAt(0).toUpperCase() + month.slice(1);
      },
      weekdayFormat: (date: Date) => {
        const dayNames = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
        const dayIndex = moment(date).day();
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
        return `${startStr.charAt(0).toUpperCase() + startStr.slice(1)} — ${
          endStr.charAt(0).toUpperCase() + endStr.slice(1)
        }`;
      },
      agendaDateFormat: (date: Date) => {
        const formatted = moment(date).format('D MMMM, dddd');
        return formatted.charAt(0).toUpperCase() + formatted.slice(1);
      },
      agendaTimeFormat: (date: Date) => moment(date).format('HH:mm'),
      agendaTimeRangeFormat: ({ start, end }: { start: Date; end: Date }) =>
        `${moment(start).format('HH:mm')} — ${moment(end).format('HH:mm')}`,
      timeGutterFormat: (date: Date) => moment(date).format('HH:mm'),
      eventTimeRangeFormat: ({ start, end }: { start: Date; end: Date }) =>
        `${moment(start).format('HH:mm')} — ${moment(end).format('HH:mm')}`,
      eventTimeRangeStartFormat: () => 'HH:mm',
      eventTimeRangeEndFormat: () => 'HH:mm',
      selectRangeFormat: ({ start, end }: { start: Date; end: Date }) =>
        `${moment(start).format('HH:mm')} — ${moment(end).format('HH:mm')}`,
    }),
    []
  );

  // Russian messages
  const messages = useMemo(
    () => ({
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
    }),
    []
  );

  // Day styling for weekends and holidays
  const dayPropGetter = useCallback((date: Date) => {
    const isToday = moment(date).isSame(moment(), 'day');
    const weekend = isWeekend(date);
    const holiday = isHoliday(date);

    let style: React.CSSProperties = {};

    if (weekend) {
      style.backgroundColor = 'rgba(0, 0, 0, 0.04)';
    }

    if (holiday) {
      style.backgroundColor = 'rgba(255, 77, 79, 0.08)';
      style.fontWeight = 600;
    }

    if (isToday) {
      style.backgroundColor = 'rgba(24, 144, 255, 0.1)';
      style.borderRadius = '8px';
      style.border = '2px solid #1890ff';
    }

    return { style };
  }, []);

  // Event styling
  const eventPropGetter = useCallback(
    (event: CalendarEvent) => ({
      style: {
        backgroundColor: event.color,
        border: 'none',
        color: 'white',
      },
    }),
    []
  );

  // Memoized event component
  const EventComponent = useCallback(
    ({ event }: { event: CalendarEvent }) => <EventRenderer event={event} />,
    []
  );

  return (
    <div
      style={{
        height: '700px',
        background: 'white',
        borderRadius: '8px',
        border: '1px solid #f0f0f0',
      }}
    >
      <BigCalendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        view={view}
        date={date}
        onView={onView}
        onNavigate={onNavigate}
        onSelectSlot={onSelectSlot}
        onSelectEvent={onSelectEvent}
        selectable
        popup
        formats={formats}
        messages={messages}
        culture="ru"
        firstDayOfWeek={1}
        components={{
          toolbar: CalendarToolbar,
          event: EventComponent,
        }}
        eventPropGetter={eventPropGetter}
        dayPropGetter={dayPropGetter}
        style={{
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial',
        }}
        min={new Date(0, 0, 0, 8, 0, 0)}
        max={new Date(0, 0, 0, 21, 0, 0)}
        step={15}
        timeslots={4}
      />
    </div>
  );
};
