import React, { useMemo } from 'react';
import { Table, Space, Tag, Tooltip, Button } from 'antd';
import {
  ProjectOutlined,
  HomeOutlined,
  UserOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import type { CalendarEvent, EngineerCallWithNames } from '@/shared/types/engineerCall';

interface StatusOption {
  value: string;
  label: string;
  color: string;
}

interface AgendaViewProps {
  events: CalendarEvent[];
  statusOptions: StatusOption[];
  onSelectEvent: (event: CalendarEvent) => void;
  onDeleteEvent?: (id: string) => void;
}

/**
 * Agenda view - table-based list of events
 * Provides sortable, filterable table with all event details
 */
export const AgendaView: React.FC<AgendaViewProps> = ({
  events,
  statusOptions,
  onSelectEvent,
  onDeleteEvent,
}) => {
  const columns = useMemo(
    () => [
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
          return `${dayjs(call.start_datetime).format('HH:mm')} - ${dayjs(
            call.end_datetime
          ).format('HH:mm')}`;
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
          return (callA?.project_name || '').localeCompare(
            callB?.project_name || '',
            'ru'
          );
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
          return (callA?.engineer_name || '').localeCompare(
            callB?.engineer_name || '',
            'ru'
          );
        },
      },
      {
        title: 'Статус',
        key: 'status',
        filters: statusOptions.map((opt) => ({ text: opt.label, value: opt.value })),
        onFilter: (value: any, record: CalendarEvent) => {
          const call = record.resource as EngineerCallWithNames;
          return call.status === value;
        },
        render: (_: any, record: CalendarEvent) => {
          const call = record.resource as EngineerCallWithNames;
          const status = statusOptions.find((s) => s.value === call.status);
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
    ],
    [statusOptions, onDeleteEvent]
  );

  return (
    <Table
      columns={columns}
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
  );
};
