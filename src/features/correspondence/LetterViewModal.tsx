import React from 'react';
import { Modal, Typography } from 'antd';
import LetterFormAntdEdit from './LetterFormAntdEdit';
import { useLetter } from '@/entities/correspondence';

interface Props {
  open: boolean;
  letterId: string | number | null;
  onClose: () => void;
}

/** Модальное окно просмотра письма */
export default function LetterViewModal({ open, letterId, onClose }: Props) {
  console.debug('LetterViewModal open:', open, 'letterId:', letterId);
  const { data: letter } = useLetter(letterId || undefined);
  console.debug('LetterViewModal fetched letter:', letter);
  const titleText = letter ? `Письмо №${letter.number}` : 'Письмо';

  if (!letterId) return null;

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
        <LetterFormAntdEdit letterId={String(letterId)} onCancel={onClose} onSaved={onClose} embedded />
      ) : null}
    </Modal>
  );
}
