import React from 'react';
import { Tooltip } from 'antd';
import dayjs from 'dayjs';
import type { CalendarEvent, EngineerCallWithNames } from '@/shared/types/engineerCall';

interface EventRendererProps {
  event: CalendarEvent;
}

/**
 * Custom event renderer for calendar events
 * Displays event with time and tooltip with details
 */
export const EventRenderer: React.FC<EventRendererProps> = ({ event }) => {
  const call = event.resource as EngineerCallWithNames;
  const startTime = dayjs(call.start_datetime).format('HH:mm');

  return (
    <Tooltip
      title={
        <div>
          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
            {event.title}
          </div>
          <div>
            Время: {startTime} - {dayjs(call.end_datetime).format('HH:mm')}
          </div>
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
          cursor: 'pointer',
        }}
      >
        <span style={{ fontWeight: 600 }}>{startTime}</span> {event.title}
      </div>
    </Tooltip>
  );
};
