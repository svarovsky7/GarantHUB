import React, { useState } from "react";
import {
  Card,
  Collapse,
  Table,
  Space,
  Typography,
  Tag,
  Button,
  Tooltip,
  Popconfirm,
  message,
  Empty,
  Input,
} from "antd";
import {
  FolderOutlined,
  GlobalOutlined,
  FileOutlined,
  DownloadOutlined,
  DeleteOutlined,
  EyeOutlined,
  EditOutlined,
} from "@ant-design/icons";
import { useDocumentFolders } from "@/entities/documentFolder";
import { useDocumentsByFolder, useDeleteDocument, useDownloadDocument, useUpdateDocument } from "@/entities/document";
import { useProjects } from "@/entities/project";
import type { DocumentWithAuthor } from "@/shared/types/document";
import type { DocumentFolderWithAuthor } from "@/shared/types/documentFolder";
import { formatFileSize } from "@/shared/utils/formatFileSize";
import DocumentPreviewModal from "@/widgets/DocumentPreviewModal";
import dayjs from "dayjs";

const { Text } = Typography;
const { Panel } = Collapse;

interface Props {
  canDelete?: boolean;
  projectId?: number | null;
}

export default function FoldersWithDocuments({ canDelete = false, projectId }: Props) {
  const { data: folders = [], isLoading: foldersLoading } = useDocumentFolders();
  const { data: projects = [] } = useProjects();
  const deleteDocument = useDeleteDocument();
  const downloadDocument = useDownloadDocument();
  const updateDocument = useUpdateDocument();
  
  const [activeKeys, setActiveKeys] = useState<string[]>([]);
  const [previewDocument, setPreviewDocument] = useState<DocumentWithAuthor | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingDescription, setEditingDescription] = useState<string>("");

  // Фильтруем папки по проекту если нужно
  const filteredFolders = projectId 
    ? folders.filter(folder => folder.project_id === projectId || folder.project_id === null)
    : folders;

  const handleDownload = async (storagePath: string, fileName: string) => {
    try {
      const url = await downloadDocument.mutateAsync(storagePath);
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = fileName || "document";
      link.style.display = "none";
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(objectUrl);
      
    } catch (error) {
      message.error("Ошибка при скачивании файла");
      console.error(error);
    }
  };

  const handlePreview = (document: DocumentWithAuthor) => {
    setPreviewDocument(document);
    setShowPreview(true);
  };

  const handleClosePreview = () => {
    setShowPreview(false);
    setPreviewDocument(null);
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteDocument.mutateAsync(id);
      message.success("Документ удален");
    } catch (error) {
      message.error("Ошибка при удалении документа");
      console.error(error);
    }
  };

  const handleEditDescription = (document: DocumentWithAuthor) => {
    setEditingId(document.id);
    setEditingDescription(document.description || "");
  };

  const handleSaveDescription = async (id: number) => {
    try {
      await updateDocument.mutateAsync({ id, description: editingDescription });
      message.success("Описание обновлено");
      setEditingId(null);
      setEditingDescription("");
    } catch (error) {
      message.error("Ошибка при обновлении описания");
      console.error(error);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingDescription("");
  };

  const getFileIcon = (mimeType: string | null | undefined) => {
    if (!mimeType) return "📎";
    if (mimeType.includes("pdf")) return "📄";
    if (mimeType.includes("word") || mimeType.includes("document")) return "📝";
    if (mimeType.includes("sheet") || mimeType.includes("excel")) return "📊";
    if (mimeType.includes("image")) return "🖼️";
    return "📎";
  };

  const getDocumentColumns = () => [
    {
      title: "Файл",
      dataIndex: "file_name",
      key: "file_name",
      width: 300,
      render: (fileName: string, record: DocumentWithAuthor) => (
        <Space>
          <span style={{ fontSize: 16 }}>
            {getFileIcon(record.mime_type || record.file_type)}
          </span>
          <div>
            <Text strong>{record.title}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {fileName || record.original_name || "Без имени"}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: "Описание",
      dataIndex: "description",
      key: "description",
      render: (description: string, record: DocumentWithAuthor) => {
        if (editingId === record.id) {
          return (
            <div style={{ width: "100%" }}>
              <Input.TextArea
                value={editingDescription}
                onChange={(e) => setEditingDescription(e.target.value)}
                placeholder="Введите описание..."
                autoSize={{ minRows: 1, maxRows: 3 }}
                style={{ width: "100%", marginBottom: 8 }}
              />
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                <Button
                  size="small"
                  type="primary"
                  onClick={() => handleSaveDescription(record.id)}
                  loading={updateDocument.isPending}
                >
                  ✓
                </Button>
                <Button
                  size="small"
                  onClick={handleCancelEdit}
                >
                  ✕
                </Button>
              </div>
            </div>
          );
        }

        return (
          <div style={{ width: "100%", position: "relative" }}>
            {description ? (
              <Text style={{ width: "100%", display: "block", paddingRight: canDelete ? "32px" : "0" }}>
                {description}
              </Text>
            ) : (
              <Text type="secondary" style={{ paddingRight: canDelete ? "32px" : "0" }}>—</Text>
            )}
            {canDelete && (
              <Tooltip title="Редактировать описание">
                <Button
                  size="small"
                  type="text"
                  icon={<EditOutlined />}
                  onClick={() => handleEditDescription(record)}
                  style={{ 
                    position: "absolute", 
                    top: "0", 
                    right: "0", 
                    minWidth: "auto", 
                    padding: "4px" 
                  }}
                />
              </Tooltip>
            )}
          </div>
        );
      },
    },
    {
      title: "Размер",
      dataIndex: "file_size",
      key: "file_size",
      width: 100,
      render: (size: number | null, record: DocumentWithAuthor) => {
        if (record.file_size) {
          return (
            <Text type="secondary">
              {formatFileSize(record.file_size)}
            </Text>
          );
        }
        return (
          <Text type="secondary">
            —
          </Text>
        );
      },
    },
    {
      title: "Автор",
      dataIndex: "authorName",
      key: "authorName",
      width: 150,
      render: (authorName: string) => (
        <Text>{authorName || "—"}</Text>
      ),
    },
    {
      title: "Дата загрузки",
      dataIndex: "created_at",
      key: "created_at",
      width: 120,
      render: (createdAt: string) => (
        <Text type="secondary">
          {dayjs(createdAt).format("DD.MM.YYYY HH:mm")}
        </Text>
      ),
    },
    {
      title: "Действия",
      key: "actions",
      width: 160,
      render: (_: unknown, record: DocumentWithAuthor) => (
        <Space size="small">
          <Tooltip title="Просмотр">
            <Button
              size="small"
              type="text"
              icon={<EyeOutlined />}
              onClick={() => handlePreview(record)}
            />
          </Tooltip>
          
          <Tooltip title="Скачать">
            <Button
              size="small"
              type="text"
              icon={<DownloadOutlined />}
              onClick={() => handleDownload(record.storage_path, record.original_name || record.title)}
              loading={downloadDocument.isPending}
            />
          </Tooltip>
          
          {canDelete && (
            <Popconfirm
              title="Удалить документ?"
              description="Это действие нельзя отменить"
              okText="Да"
              cancelText="Нет"
              onConfirm={() => handleDelete(record.id)}
            >
              <Tooltip title="Удалить">
                <Button
                  size="small"
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  loading={deleteDocument.isPending}
                />
              </Tooltip>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  const renderFolderHeader = (folder: DocumentFolderWithAuthor) => {
    const project = projects.find(p => p.id === folder.project_id);
    
    return (
      <Space>
        <FolderOutlined style={{ color: "#1890ff" }} />
        <Text strong>{folder.name}</Text>
        {folder.project_id ? (
          <Tag color="blue" size="small">
            {project?.name || "—"}
          </Tag>
        ) : (
          <Tag icon={<GlobalOutlined />} color="default" size="small">
            Общая
          </Tag>
        )}
        {folder.description && (
          <Text type="secondary" style={{ fontSize: 12 }}>
            — {folder.description}
          </Text>
        )}
      </Space>
    );
  };

  const FolderContent = ({ folder }: { folder: DocumentFolderWithAuthor }) => {
    const { data: documents = [], isLoading: documentsLoading } = useDocumentsByFolder(folder.id);

    if (documentsLoading) {
      return <div style={{ padding: 16, textAlign: "center" }}>Загрузка документов...</div>;
    }

    if (documents.length === 0) {
      return (
        <div style={{ padding: 16 }}>
          <Empty 
            image={<FileOutlined style={{ fontSize: 48, color: "#d9d9d9" }} />}
            description="В папке нет документов"
            style={{ margin: 0 }}
          />
        </div>
      );
    }

    return (
      <Table
        columns={getDocumentColumns()}
        dataSource={documents}
        rowKey="id"
        pagination={false}
        size="small"
      />
    );
  };

  if (filteredFolders.length === 0) {
    return (
      <Card size="small">
        <Empty 
          image={<FolderOutlined style={{ fontSize: 48, color: "#d9d9d9" }} />}
          description="Нет папок с документами"
        />
      </Card>
    );
  }

  return (
    <>
      <Card
        title="Папки с документами"
        size="small"
        loading={foldersLoading}
      >
        <Collapse
          activeKey={activeKeys}
          onChange={(keys) => setActiveKeys(Array.isArray(keys) ? keys : [keys])}
          size="small"
        >
          {filteredFolders.map((folder) => (
            <Panel
              key={folder.id.toString()}
              header={renderFolderHeader(folder)}
            >
              <FolderContent folder={folder} />
            </Panel>
          ))}
        </Collapse>
      </Card>

      <DocumentPreviewModal
        open={showPreview}
        document={previewDocument}
        onClose={handleClosePreview}
      />
    </>
  );
}