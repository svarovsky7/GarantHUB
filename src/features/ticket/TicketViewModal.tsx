import React from 'react';
import { Modal, Skeleton, Typography } from 'antd';
import { useTicket } from '@/entities/ticket';
import TicketFormAntdEdit from './TicketFormAntdEdit';

interface Props {
  open: boolean;
  ticketId: string | number | null;
  onClose: () => void;
}

/** Модальное окно просмотра замечания */
export default function TicketViewModal({ open, ticketId, onClose }: Props) {
  if (!ticketId) return null;
  const { data: ticket } = useTicket(ticketId);
  const titleText = ticket
    ? `Замечание №${ticket.id}. Создано ${
        ticket.createdAt ? ticket.createdAt.format('DD.MM.YYYY [в] HH:mm') : ''
      }`
    : 'Замечание';

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width="80%"
      title={<Typography.Title level={4} style={{ margin: 0 }}>{titleText}</Typography.Title>}
    >
      {ticket ? (
        <TicketFormAntdEdit
          embedded
          ticketId={String(ticketId)}
          onCancel={onClose}
          onCreated={onClose}
        />
      ) : (
        <Skeleton active />
      )}
    </Modal>
  );
}

