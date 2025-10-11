import { useState, useCallback } from 'react';
import { View } from 'react-big-calendar';
import type { Dayjs } from 'dayjs';

/**
 * Hook for managing calendar state (view, date, filters)
 */
export const useCalendarState = () => {
  const [view, setView] = useState<View>('month');
  const [date, setDate] = useState(new Date());
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedEngineerIds, setSelectedEngineerIds] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null]>([null, null]);

  // "Only my meetings" toggle with localStorage persistence
  const [onlyMyMeetings, setOnlyMyMeetings] = useState<boolean>(() => {
    const saved = localStorage.getItem('engineerCalls_onlyMyMeetings');
    return saved === 'true';
  });

  const handleOnlyMyMeetingsChange = useCallback((checked: boolean) => {
    setOnlyMyMeetings(checked);
    localStorage.setItem('engineerCalls_onlyMyMeetings', String(checked));
  }, []);

  return {
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
  };
};
