import React from 'react';
import dayjs from 'dayjs';
import { Modal, Typography, Skeleton } from 'antd';
import { useLetter } from '@/entities/correspondence';
import LetterFormAntdEdit from './LetterFormAntdEdit';

interface Props {
  open: boolean;
  letterId: string | number | null;
  onClose: () => void;
}

/** Модальное окно просмотра письма */
export default function LetterViewModal({ open, letterId, onClose }: Props) {
  const { data: letter } = useLetter(letterId ?? undefined);
  if (!open || !letterId) return null;
  const titleText = letter
    ? `Письмо №${letter.number} от ${dayjs(letter.date).format('DD.MM.YYYY')} (${
        letter.type === 'incoming' ? 'входящее' : 'исходящее'
      })`
    : 'Письмо';

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width="80%"
      destroyOnClose
      title={<Typography.Title level={4} style={{ margin: 0 }}>{titleText}</Typography.Title>}
    >
      {letter ? (
        <LetterFormAntdEdit embedded letterId={String(letterId)} onCancel={onClose} onSaved={onClose} />
      ) : (
        <Skeleton active />
      )}
    </Modal>
  );
}
