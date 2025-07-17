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
  const [viewerError, setViewerError] = React.useState(false);
  
  // Сброс ошибки при смене файла
  React.useEffect(() => {
    setViewerError(false);
  }, [file]);
  
  const content = React.useMemo(() => {
    if (!file || !file.url) return <div>Файл не найден или недоступен</div>;
    
    const mimeType = file.mime || '';
    const isImage = mimeType.startsWith('image/');
    const isPdf = mimeType === 'application/pdf';
    const isText = mimeType.startsWith('text/') || mimeType === 'application/json';
    const isDocx = mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    const isDoc = mimeType === 'application/msword';
    const isXlsx = mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    const isXls = mimeType === 'application/vnd.ms-excel';
    const isPptx = mimeType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
    const isPpt = mimeType === 'application/vnd.ms-powerpoint';
    
    // Если MIME-тип неизвестен, попробуем определить по расширению файла
    const fileName = file.name.toLowerCase();
    const isImageByExt = !mimeType && /\.(jpg|jpeg|png|gif|bmp|svg|webp)$/i.test(fileName);
    const isPdfByExt = !mimeType && fileName.endsWith('.pdf');
    const isTextByExt = !mimeType && /\.(txt|json|csv|xml|html|htm|css|js|ts|md)$/i.test(fileName);
    const isDocxByExt = !mimeType && /\.(docx|doc)$/i.test(fileName);
    const isXlsxByExt = !mimeType && /\.(xlsx|xls)$/i.test(fileName);
    const isPptxByExt = !mimeType && /\.(pptx|ppt)$/i.test(fileName);
    const isRtfByExt = !mimeType && /\.(rtf)$/i.test(fileName);
    
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
    
    // Для Office документов и RTF используем Google Docs Viewer
    if (isDocx || isDoc || isXlsx || isXls || isPptx || isPpt || isDocxByExt || isXlsxByExt || isPptxByExt || isRtfByExt) {
      if (viewerError) {
        return (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <p>Не удалось загрузить документ в просмотрщике</p>
            <p>Тип файла: {mimeType || 'определяется по расширению'}</p>
            <div style={{ marginTop: '20px' }}>
              <a 
                href={file.url} 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ color: '#1890ff', marginRight: '16px' }}
              >
                Открыть в новой вкладке
              </a>
              <a 
                href={file.url} 
                download={file.name}
                style={{ color: '#1890ff' }}
              >
                Скачать файл
              </a>
            </div>
          </div>
        );
      }
      
      const viewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(file.url)}&embedded=true`;
      return (
        <div style={{ width: '100%', height: '80vh', position: 'relative' }}>
          <iframe
            src={viewerUrl}
            title={file.name}
            style={{ width: '100%', height: '100%', border: 'none' }}
            onError={() => {
              console.error('Failed to load Office document in Google Docs Viewer:', file.url);
              setViewerError(true);
            }}
          />
          <div style={{ 
            position: 'absolute', 
            top: '10px', 
            right: '10px', 
            background: 'rgba(0,0,0,0.7)', 
            color: 'white', 
            padding: '8px 12px', 
            borderRadius: '4px',
            fontSize: '12px'
          }}>
            Если документ не отображается, <a 
              href={file.url} 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ color: '#1890ff' }}
            >
              откройте в новой вкладке
            </a>
          </div>
        </div>
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
  }, [file, viewerError]);

  return (
    <Modal open={open} onCancel={onClose} footer={null} width="80%" title={file?.name} destroyOnHidden>
      {content}
    </Modal>
  );
}

