import React, { useMemo, useState } from 'react';
import { Tag, Dropdown, MenuProps, Spin, message } from 'antd';
import { DownOutlined } from '@ant-design/icons';
import { useTicketStatuses } from '@/entities/ticketStatus';
import { useUpdateTicket } from '@/entities/ticket';

interface TicketStatusSelectProps {
  ticketId: number;
  statusId: number;
  /** Цвет тега. Если null, используется серый. */
  statusColor: string | null;
  /** Название статуса. */
  statusName: string;
}

/**
 * Выпадающий список для смены статуса замечания напрямую из таблицы.
 */
export default function TicketStatusSelect({
  ticketId,
  statusId,
  statusColor,
  statusName,
}: TicketStatusSelectProps) {
  const { data: statuses = [], isLoading } = useTicketStatuses();
  const updateMutation = useUpdateTicket();
  const [pending, setPending] = useState(false);

  /** Элементы меню после загрузки справочника. */
  const items = useMemo<MenuProps['items']>(() => {
    return statuses.map((s) => ({
      key: String(s.id),
      label: s.name,
      icon: (
        <span
          style={{
            display: 'inline-block',
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: s.color || '#d9d9d9',
            marginRight: 6,
          }}
        />
      ),
    }));
  }, [statuses]);

  const onSelect: MenuProps['onClick'] = async ({ key }) => {
    const id = Number(key);
    if (id === statusId) return;
    try {
      setPending(true);
      await updateMutation.mutateAsync({ id: ticketId, updates: { status_id: id } });
      message.success('Статус обновлён');
    } catch (e: any) {
      message.error(e.message);
    } finally {
      setPending(false);
    }
  };

  if (isLoading) return <Spin size="small" />;

  return (
    <Dropdown menu={{ items, onClick: onSelect }} trigger={['click']}>
      <Tag
        color={statusColor || 'default'}
        style={{ cursor: 'pointer', userSelect: 'none', display: 'inline-flex', alignItems: 'center' }}
      >
        {pending ? <Spin size="small" /> : statusName}
        <DownOutlined style={{ fontSize: 10, marginLeft: 4 }} />
      </Tag>
    </Dropdown>
  );
}
