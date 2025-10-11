import React from 'react';

interface CalendarToolbarProps {
  label: string;
  onNavigate: (action: 'PREV' | 'TODAY' | 'NEXT') => void;
  onView: (view: string) => void;
  view: string;
}

/**
 * Custom toolbar for react-big-calendar
 * Provides navigation controls and view switching
 */
export const CalendarToolbar: React.FC<CalendarToolbarProps> = ({
  label,
  onNavigate,
  onView,
  view,
}) => {
  return (
    <div className="rbc-toolbar">
      <span className="rbc-btn-group">
        <button type="button" onClick={() => onNavigate('PREV')}>
          ←
        </button>
        <button type="button" onClick={() => onNavigate('TODAY')}>
          Сегодня
        </button>
        <button type="button" onClick={() => onNavigate('NEXT')}>
          →
        </button>
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
