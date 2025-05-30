import React from 'react';
import { Modal } from 'antd';
import TicketForm from './TicketForm';

interface Props {
  open: boolean;
  ticketId: string | number | null;
  onClose: () => void;
}

export default function TicketViewModal({ open, ticketId, onClose }: Props) {
  if (!ticketId) return null;
  return (
    <Modal open={open} onCancel={onClose} footer={null} width="80%">
      <TicketForm embedded ticketId={String(ticketId)} onCancel={onClose} onCreated={onClose} />
    </Modal>
  );
}

