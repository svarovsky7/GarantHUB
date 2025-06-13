import React from 'react';
import { Modal, Skeleton } from 'antd';
import { useTicket } from '@/entities/ticket';
import TicketForm from './TicketForm';

interface Props {
  open: boolean;
  ticketId: string | number | null;
  onClose: () => void;
}

export default function TicketViewModal({ open, ticketId, onClose }: Props) {
  if (!ticketId) return null;
  const { data: ticket } = useTicket(ticketId);
  const title = ticket
    ? `Замечание (ID ${ticket.id}). Создано ${
        ticket.createdAt ? ticket.createdAt.format('DD.MM.YYYY [в] HH:mm') : ''
      }`
    : 'Замечание';

  return (
    <Modal open={open} onCancel={onClose} footer={null} width="80%" title={title}>
      {ticket ? (
        <TicketForm embedded ticketId={String(ticketId)} onCancel={onClose} onCreated={onClose} />
      ) : (
        <Skeleton active />
      )}
    </Modal>
  );
}

