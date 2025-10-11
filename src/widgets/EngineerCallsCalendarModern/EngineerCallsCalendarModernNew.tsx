import React, { useCallback } from 'react';
import { Card } from 'antd';
import moment from 'moment';
import 'moment/locale/ru';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import type { SlotInfo } from 'react-big-calendar';
import type { CalendarEvent } from '@/shared/types/engineerCall';
import { useCalendarState, useCalendarData } from './model';
import {
  CalendarFilters,
  CalendarHeader,
  CalendarView,
  AgendaView,
  CalendarToolbar,
} from './ui';
import '../EngineerCallsCalendar.css';

// Configure Russian locale for moment
moment.locale('ru');
moment.updateLocale('ru', {
  week: {
    dow: 1,
    doy: 4,
  },
  weekdays: 'воскресенье_понедельник_вторник_среда_четверг_пятница_суббота'.split('_'),
  weekdaysShort: 'вс_пн_вт_ср_чт_пт_сб'.split('_'),
  weekdaysMin: 'вс_пн_вт_ср_чт_пт_сб'.split('_'),
  months:
    'январь_февраль_март_апрель_май_июнь_июль_август_сентябрь_октябрь_ноябрь_декабрь'.split(
      '_'
    ),
  monthsShort: 'янв_фев_мар_апр_май_июн_июл_авг_сен_окт_ноя_дек'.split('_'),
  longDateFormat: {
    LT: 'HH:mm',
    LTS: 'HH:mm:ss',
    L: 'DD.MM.YYYY',
    LL: 'D MMMM YYYY г.',
    LLL: 'D MMMM YYYY г., HH:mm',
    LLLL: 'dddd, D MMMM YYYY г., HH:mm',
  },
  calendar: {
    sameDay: '[Сегодня в] HH:mm',
    nextDay: '[Завтра в] HH:mm',
    lastDay: '[Вчера в] HH:mm',
    nextWeek: 'dddd [в] HH:mm',
    lastWeek: 'dddd [в] HH:mm',
    sameElse: 'L',
  },
});

interface CalendarProps {
  onSelectSlot: (slotInfo: SlotInfo) => void;
  onSelectEvent: (event: CalendarEvent) => void;
  onCreateNew: () => void;
  onDeleteEvent?: (id: string) => void;
}

/**
 * Refactored EngineerCallsCalendarModern component
 *
 * Architecture:
 * - State management: useCalendarState hook
 * - Data fetching: useCalendarData hook
 * - UI components: Extracted to ui/ folder
 * - Main component: Composition layer (~150 lines)
 *
 * Features:
 * - Multiple calendar views (month, week, day, agenda)
 * - Filtering by project, engineers, date range
 * - "Only my meetings" toggle with localStorage persistence
 * - Statistics display
 * - Russian locale support
 * - Weekend and holiday highlighting
 */
const EngineerCallsCalendarModernNew: React.FC<CalendarProps> = ({
  onSelectSlot,
  onSelectEvent,
  onCreateNew,
  onDeleteEvent,
}) => {
  // State management
  const {
    view,
    setView,
    date,
    setDate,
    selectedProjectId,
    setSelectedProjectId,
    selectedEngineerIds,
    setSelectedEngineerIds,
    dateRange,
    setDateRange,
    onlyMyMeetings,
    handleOnlyMyMeetingsChange,
  } = useCalendarState();

  // Data fetching and processing
  const {
    events,
    projects,
    engineers,
    dbStatuses,
    statusOptions,
    statistics,
    isLoading,
    projectsLoading,
    engineersLoading,
  } = useCalendarData({
    date,
    dateRange,
    selectedProjectId,
    selectedEngineerIds,
    onlyMyMeetings,
  });

  // Navigation handler for agenda view
  const handleAgendaNavigate = useCallback(
    (action: string) => {
      if (action === 'PREV') {
        setDate(moment(date).subtract(1, 'month').toDate());
      } else if (action === 'NEXT') {
        setDate(moment(date).add(1, 'month').toDate());
      } else if (action === 'TODAY') {
        setDate(new Date());
      }
    },
    [date, setDate]
  );

  // Loading state
  if (isLoading) {
    return (
      <Card
        loading={true}
        style={{
          height: '600px',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        }}
      >
        Загрузка календаря...
      </Card>
    );
  }

  return (
    <div>
      {/* Filters */}
      <CalendarFilters
        projects={projects}
        selectedProjectId={selectedProjectId}
        onProjectChange={setSelectedProjectId}
        projectsLoading={projectsLoading}
        engineers={engineers}
        selectedEngineerIds={selectedEngineerIds}
        onEngineersChange={setSelectedEngineerIds}
        engineersLoading={engineersLoading}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        onlyMyMeetings={onlyMyMeetings}
        onOnlyMyMeetingsChange={handleOnlyMyMeetingsChange}
      />

      {/* Calendar Card */}
      <Card
        className="calendar-card"
        style={{
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          border: 'none',
        }}
        styles={{
          body: { padding: '24px' },
          header: { padding: 0, border: 'none' },
        }}
      >
        {/* Header with statistics and create button */}
        <CalendarHeader
          statistics={statistics}
          dbStatuses={dbStatuses}
          onCreateNew={onCreateNew}
        />

        {/* Calendar or Agenda View */}
        {view === 'agenda' ? (
          <>
            <CalendarToolbar
              label={moment(date).format('MMMM YYYY')}
              onNavigate={handleAgendaNavigate}
              onView={setView}
              view={view}
            />
            <AgendaView
              events={events}
              statusOptions={statusOptions}
              onSelectEvent={onSelectEvent}
              onDeleteEvent={onDeleteEvent}
            />
          </>
        ) : (
          <CalendarView
            events={events}
            view={view}
            date={date}
            onView={setView}
            onNavigate={setDate}
            onSelectSlot={onSelectSlot}
            onSelectEvent={onSelectEvent}
          />
        )}
      </Card>
    </div>
  );
};

export default EngineerCallsCalendarModernNew;
