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
    if (!file || !file.url) return <div>Файл не найден или недоступен</div>;
    
    const mimeType = file.mime || '';
    const isImage = mimeType.startsWith('image/');
    const isPdf = mimeType === 'application/pdf';
    const isText = mimeType.startsWith('text/') || mimeType === 'application/json';
    
    // Если MIME-тип неизвестен, попробуем определить по расширению файла
    const fileName = file.name.toLowerCase();
    const isImageByExt = !mimeType && /\.(jpg|jpeg|png|gif|bmp|svg|webp)$/i.test(fileName);
    const isPdfByExt = !mimeType && fileName.endsWith('.pdf');
    const isTextByExt = !mimeType && /\.(txt|json|csv|xml|html|htm|css|js|ts|md)$/i.test(fileName);
    
    if (isImage || isImageByExt) {
      return (
        <img 
          src={file.url} 
          alt={file.name} 
          style={{ maxWidth: '100%', height: 'auto' }} 
          onError={(e) => {
            console.error('Failed to load image:', file.url);
            e.currentTarget.style.display = 'none';
          }}
        />
      );
    }
    
    if (isPdf || isText || isPdfByExt || isTextByExt) {
      return (
        <iframe
          src={file.url}
          title={file.name}
          style={{ width: '100%', height: '80vh', border: 'none' }}
          onError={() => {
            console.error('Failed to load file in iframe:', file.url);
          }}
        />
      );
    }
    
    // Для других типов файлов показываем ссылку для скачивания
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <p>Предварительный просмотр для этого типа файла недоступен</p>
        <p>Тип файла: {mimeType || 'неизвестен'}</p>
        <a href={file.url} download={file.name} target="_blank" rel="noopener noreferrer">
          Скачать файл
        </a>
      </div>
    );
  }, [file]);

  return (
    <Modal open={open} onCancel={onClose} footer={null} width="80%" title={file?.name} destroyOnHidden>
      {content}
    </Modal>
  );
}

