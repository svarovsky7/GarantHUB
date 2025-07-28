import React, { useState } from "react";
import {
  Card,
  Space,
  Typography,
  Button,
  Alert,
} from "antd";
import {
  FileOutlined,
  PlusOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import { useAuthStore } from "@/shared/store/authStore";
import { useRolePermission } from "@/entities/rolePermission";
import type { RoleName } from "@/shared/types/rolePermission";
import DocumentUploadForm from "@/features/document/DocumentUploadForm";
import DocumentFolderManager from "@/features/documentFolder/DocumentFolderManager";
import FoldersWithDocuments from "@/features/documentFolder/FoldersWithDocuments";
import { useProjectId } from "@/shared/hooks/useProjectId";

const { Title, Text } = Typography;

export default function DocumentsPage() {
  const role = useAuthStore((s) => s.profile?.role as RoleName | undefined);
  const { data: perm } = useRolePermission(role);
  const currentProjectId = useProjectId();
  const [showUploadForm, setShowUploadForm] = useState(false);

  const isAdmin = role === "ADMIN";
  const canManageDocuments = isAdmin;
  const canUploadDocuments = perm?.can_upload_documents || isAdmin;

  const handleUploadSuccess = () => {
    setShowUploadForm(false);
  };


  return (
    <div style={{ padding: "24px" }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={2}>
          <FileOutlined style={{ marginRight: 8 }} />
          Важные документы
        </Title>
        <Text type="secondary">
          Документы, доступные для скачивания всем пользователям системы
        </Text>
      </div>

      {/* Информация о проекте */}
      {currentProjectId && (
        <Alert
          type="info"
          message={`Документы для выбранного проекта`}
          description="Показаны папки, относящиеся к текущему проекту и общие папки"
          showIcon
          style={{ marginBottom: 24 }}
        />
      )}

      {/* Кнопки управления */}
      {canUploadDocuments && (
        <div style={{ marginBottom: 24 }}>
          <Space>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setShowUploadForm(!showUploadForm)}
            >
              {showUploadForm ? "Скрыть форму" : "Загрузить документ"}
            </Button>
            {showUploadForm && (
              <Button
                icon={showUploadForm ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                onClick={() => setShowUploadForm(!showUploadForm)}
              >
                {showUploadForm ? "Скрыть" : "Показать"} форму
              </Button>
            )}
          </Space>
        </div>
      )}

      {/* Форма загрузки */}
      {canUploadDocuments && showUploadForm && (
        <div style={{ marginBottom: 24 }}>
          <DocumentUploadForm onSuccess={handleUploadSuccess} />
        </div>
      )}

      {/* Информация для пользователей без прав загрузки */}
      {!canUploadDocuments && (
        <Alert
          type="info"
          message="Информация"
          description="Вы можете просматривать и скачивать документы. Загружать новые документы могут только пользователи с соответствующими правами."
          showIcon
          style={{ marginBottom: 24 }}
        />
      )}

      {/* Управление папками */}
      <div style={{ marginBottom: 24 }}>
        <DocumentFolderManager canManage={canManageDocuments} />
      </div>

      {/* Папки с документами */}
      <div style={{ marginBottom: 24 }}>
        <FoldersWithDocuments 
          canDelete={canManageDocuments} 
          projectId={currentProjectId}
        />
      </div>
    </div>
  );
}