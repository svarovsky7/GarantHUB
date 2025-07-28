import React from "react";
import { Modal, Spin, Alert, Typography, Button } from "antd";
import { FullscreenOutlined, FullscreenExitOutlined } from "@ant-design/icons";
import { usePreviewDocument } from "@/entities/document";
import type { DocumentWithAuthor } from "@/shared/types/document";

const { Text } = Typography;

interface Props {
  open: boolean;
  document: DocumentWithAuthor | null;
  onClose: () => void;
}

export default function DocumentPreviewModal({ open, document, onClose }: Props) {
  const previewDocument = usePreviewDocument();
  const [previewUrl, setPreviewUrl] = React.useState<string>("");
  const [error, setError] = React.useState<string>("");
  const [isFullscreen, setIsFullscreen] = React.useState(false);

  React.useEffect(() => {
    if (open && document) {
      loadPreview();
    } else {
      setPreviewUrl("");
      setError("");
      setIsFullscreen(false);
    }
  }, [open, document]);

  const loadPreview = async () => {
    if (!document) return;
    
    try {
      setError("");
      const url = await previewDocument.mutateAsync(document.storage_path);
      setPreviewUrl(url);
    } catch (err) {
      setError("Ошибка при загрузке файла для просмотра");
      console.error(err);
    }
  };

  const getFileType = (mimeType: string | null | undefined) => {
    if (!mimeType) return "unknown";
    if (mimeType.includes("pdf")) return "pdf";
    if (mimeType.includes("image")) return "image";
    if (mimeType.includes("text")) return "text";
    if (mimeType.includes("word") || mimeType.includes("document")) return "word";
    if (mimeType.includes("sheet") || mimeType.includes("excel")) return "excel";
    return "unknown";
  };

  const renderPreview = () => {
    if (previewDocument.isPending) {
      return (
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>
            <Text type="secondary">Загрузка файла...</Text>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <Alert
          type="error"
          message="Ошибка загрузки"
          description={error}
          showIcon
          style={{ margin: "20px 0" }}
        />
      );
    }

    if (!previewUrl || !document) {
      return null;
    }

    const fileType = getFileType(document.mime_type || document.file_type);
    const contentHeight = isFullscreen ? "calc(100vh - 140px)" : "calc(85vh - 140px)";
    const imageMaxHeight = isFullscreen ? "calc(100vh - 140px)" : "calc(85vh - 140px)";

    switch (fileType) {
      case "pdf":
        return (
          <iframe
            src={previewUrl}
            width="100%"
            height={contentHeight}
            style={{ 
              border: "none",
              minHeight: isFullscreen ? "calc(100vh - 140px)" : "600px"
            }}
            title={`Просмотр ${document.title}`}
          />
        );

      case "image":
        return (
          <div style={{ 
            textAlign: "center",
            maxHeight: imageMaxHeight,
            overflow: "auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: contentHeight,
          }}>
            <img
              src={previewUrl}
              alt={document.title}
              style={{
                maxWidth: "100%",
                maxHeight: "100%",
                height: "auto",
                objectFit: "contain",
              }}
            />
          </div>
        );

      case "text":
        return (
          <iframe
            src={previewUrl}
            width="100%"
            height={contentHeight}
            style={{ 
              border: "1px solid #d9d9d9", 
              borderRadius: "6px",
              minHeight: isFullscreen ? "calc(100vh - 140px)" : "500px"
            }}
            title={`Просмотр ${document.title}`}
          />
        );

      case "word":
        return (
          <iframe
            src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(previewUrl)}`}
            width="100%"
            height={contentHeight}
            style={{ 
              border: "none",
              minHeight: isFullscreen ? "calc(100vh - 140px)" : "600px"
            }}
            title={`Просмотр ${document.title}`}
          />
        );

      case "excel":
        return (
          <iframe
            src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(previewUrl)}`}
            width="100%"
            height={contentHeight}
            style={{ 
              border: "none",
              minHeight: isFullscreen ? "calc(100vh - 140px)" : "600px"
            }}
            title={`Просмотр ${document.title}`}
          />
        );

      default:
        return (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <Alert
              type="info"
              message="Предварительный просмотр недоступен"
              description={
                <div>
                  <p>Данный тип файла не поддерживает встроенный просмотр.</p>
                  <p>
                    <a
                      href={previewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Открыть в новой вкладке
                    </a>
                  </p>
                </div>
              }
              showIcon
            />
          </div>
        );
    }
  };

  const modalWidth = isFullscreen ? "100vw" : "95vw";
  const modalHeight = isFullscreen ? "100vh" : "85vh";

  return (
    <Modal
      title={
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <Text strong>{document?.title || "Просмотр документа"}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {document?.original_name}
            </Text>
          </div>
          <Button
            type="text"
            icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? "Выйти из полноэкранного режима" : "Полноэкранный режим"}
          />
        </div>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width={modalWidth}
      style={{ 
        maxWidth: "none",
        top: isFullscreen ? 0 : 20,
        paddingBottom: 0,
      }}
      styles={{
        body: {
          maxHeight: modalHeight,
          overflow: "hidden",
          padding: isFullscreen ? "8px" : "16px 24px",
        },
        content: {
          height: isFullscreen ? "100vh" : "auto",
        }
      }}
      destroyOnClose
      centered={false}
      maskClosable={false}
    >
      {renderPreview()}
    </Modal>
  );
}