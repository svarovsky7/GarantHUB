import { useMemo } from 'react';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import { useEngineerCalls, useEngineers } from '@/entities/engineerCall';
import { useEngineerCallStatuses } from '@/entities/status/status';
import { useProjects } from '@/shared/hooks/useProjects';
import { useAuthStore } from '@/shared/store/authStore';
import type { CalendarEvent, EngineerCallWithNames } from '@/shared/types/engineerCall';

interface UseCalendarDataParams {
  date: Date;
  dateRange: [Dayjs | null, Dayjs | null];
  selectedProjectId: string | null;
  selectedEngineerIds: string[];
  onlyMyMeetings: boolean;
}

/**
 * Hook for fetching and processing calendar data
 * - Fetches engineer calls, engineers, projects, statuses
 * - Filters calls based on user selections
 * - Transforms calls into calendar events
 * - Calculates statistics
 */
export const useCalendarData = ({
  date,
  dateRange,
  selectedProjectId,
  selectedEngineerIds,
  onlyMyMeetings,
}: UseCalendarDataParams) => {
  const profile = useAuthStore((s) => s.profile);

  // Fetch data
  const { data: projects = [], isLoading: projectsLoading } = useProjects();
  const { data: engineers = [], isLoading: engineersLoading } = useEngineers();
  const { data: dbStatuses = [] } = useEngineerCallStatuses();

  // Calculate query date range
  const queryDateRange = useMemo(() => {
    if (dateRange[0] && dateRange[1]) {
      return {
        start: dateRange[0].startOf('day').toDate(),
        end: dateRange[1].endOf('day').toDate(),
      };
    }
    const start = dayjs(date).startOf('month').subtract(7, 'days').toDate();
    const end = dayjs(date).endOf('month').add(7, 'days').toDate();
    return { start, end };
  }, [date, dateRange]);

  const { data: engineerCalls = [], isLoading } = useEngineerCalls(
    queryDateRange.start,
    queryDateRange.end,
    selectedProjectId ? Number(selectedProjectId) : null
  );

  // Filter calls
  const filteredCalls = useMemo(() => {
    let filtered = [...engineerCalls];

    if (onlyMyMeetings && profile?.id) {
      filtered = filtered.filter((call) => call.engineer_id === profile.id);
    }

    if (!onlyMyMeetings && selectedEngineerIds.length > 0) {
      filtered = filtered.filter(
        (call) => call.engineer_id && selectedEngineerIds.includes(call.engineer_id)
      );
    }

    return filtered;
  }, [engineerCalls, selectedEngineerIds, onlyMyMeetings, profile?.id]);

  // Create status color map
  const statusColorMap = useMemo(() => {
    const map: Record<string, string> = {};
    dbStatuses.forEach((status) => {
      if (status.color) {
        map[status.name] = status.color;
      }
    });
    // Fallback for legacy English statuses
    map['scheduled'] = '#1890ff';
    map['in_progress'] = '#fa8c16';
    map['completed'] = '#52c41a';
    map['cancelled'] = '#ff4d4f';
    return map;
  }, [dbStatuses]);

  // Transform calls into calendar events
  const events: CalendarEvent[] = useMemo(() => {
    return filteredCalls.map((call) => {
      const startDate = new Date(call.start_datetime);
      const endDate = new Date(call.end_datetime);
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

  // Status options
  const statusOptions = useMemo(() => {
    if (dbStatuses.length > 0) {
      return dbStatuses.map((status) => ({
        value: status.name,
        label: status.name,
        color: status.color || '#8c8c8c',
      }));
    }
    return [
      { value: 'Запланировано', label: 'Запланировано', color: '#1976d2' },
      { value: 'Проведено', label: 'Проведено', color: '#19d21c' },
      { value: 'Отменено', label: 'Отменено', color: '#c20f0f' },
    ];
  }, [dbStatuses]);

  // Statistics
  const statistics = useMemo(() => {
    const stats: Record<string, number> = {
      total: filteredCalls.length,
    };

    dbStatuses.forEach((status) => {
      stats[status.name] = 0;
    });

    filteredCalls.forEach((call) => {
      if (call.status && stats.hasOwnProperty(call.status)) {
        stats[call.status]++;
      }
    });

    return stats;
  }, [filteredCalls, dbStatuses]);

  return {
    events,
    filteredCalls,
    projects,
    engineers,
    dbStatuses,
    statusOptions,
    statistics,
    isLoading,
    projectsLoading,
    engineersLoading,
  };
};
