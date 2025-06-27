import React from 'react';
import { Modal } from 'antd';
import type { PreviewFile } from '@/shared/types/previewFile';

/**
 * Модальное окно предварительного просмотра файла.
 */
export default function FilePreviewModal({
  open,
  file,
  onClose,
}: {
  /** Открыто ли модальное окно */
  open: boolean;
  /** Просматриваемый файл */
  file: PreviewFile | null;
  /** Закрытие окна */
  onClose: () => void;
}) {
  const content = React.useMemo(() => {
    if (!file) return null;
    if (file.mime?.startsWith('image/')) {
      return <img src={file.url} alt={file.name} style={{ maxWidth: '100%' }} />;
    }
    return (
      <iframe
        src={file.url}
        title={file.name}
        style={{ width: '100%', height: '80vh', border: 'none' }}
      />
    );
  }, [file]);

  return (
    <Modal open={open} onCancel={onClose} footer={null} width="80%" title={file?.name} destroyOnClose>
      {content}
    </Modal>
  );
}

