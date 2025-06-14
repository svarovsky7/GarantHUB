import React from 'react';
import { Modal, Skeleton, Typography } from 'antd';
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
  const titleText = letter ? `Письмо №${letter.number}` : 'Письмо';

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width="80%"
      title={
        <Typography.Title level={4} style={{ margin: 0 }}>
          {titleText}
        </Typography.Title>
      }
    >
      {letter ? (
        <LetterFormAntdEdit
          embedded
          letterId={String(letterId)}
          onCancel={onClose}
          onSaved={onClose}
        />
      ) : (
        <Skeleton active />
      )}
    </Modal>
  );
}
