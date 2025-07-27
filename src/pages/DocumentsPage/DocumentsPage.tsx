import React, { useState } from "react";
import {
  Card,
  Space,
  Typography,
  Button,
  Alert,
  Row,
  Col,
  Statistic,
} from "antd";
import {
  FileOutlined,
  PlusOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import { useDocuments } from "@/entities/document";
import { useAuthStore } from "@/shared/store/authStore";
import { useRolePermission } from "@/entities/rolePermission";
import type { RoleName } from "@/shared/types/rolePermission";
import DocumentUploadForm from "@/features/document/DocumentUploadForm";
import DocumentsTable from "@/widgets/DocumentsTable";
import { formatFileSize } from "@/shared/utils/formatFileSize";

const { Title, Text } = Typography;

export default function DocumentsPage() {
  const role = useAuthStore((s) => s.profile?.role as RoleName | undefined);
  const { data: perm } = useRolePermission(role);
  const { data: documents = [], isLoading, error } = useDocuments();
  const [showUploadForm, setShowUploadForm] = useState(false);

  const isAdmin = role === "ADMIN";
  const canManageDocuments = isAdmin;

  // Статистика
  const totalDocuments = documents.length;
  const totalSize = documents.reduce((sum, doc) => sum + (doc.file_size || 0), 0);

  const handleUploadSuccess = () => {
    setShowUploadForm(false);
  };

  if (error) {
    return (
      <Alert
        type="error"
        message="Ошибка загрузки"
        description={error.message}
        showIcon
      />
    );
  }

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

      {/* Статистика */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card size="small">
            <Statistic
              title="Всего документов"
              value={totalDocuments}
              prefix={<FileOutlined />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card size="small">
            <Statistic
              title="Общий размер"
              value={formatFileSize(totalSize)}
              suffix=""
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card size="small">
            <Statistic
              title="Права доступа"
              value={canManageDocuments ? "Администратор" : "Пользователь"}
              valueStyle={{ 
                color: canManageDocuments ? "#52c41a" : "#1890ff",
                fontSize: 16 
              }}
            />
          </Card>
        </Col>
      </Row>

      {/* Кнопки управления */}
      {canManageDocuments && (
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

      {/* Форма загрузки для администраторов */}
      {canManageDocuments && showUploadForm && (
        <div style={{ marginBottom: 24 }}>
          <DocumentUploadForm onSuccess={handleUploadSuccess} />
        </div>
      )}

      {/* Информация для обычных пользователей */}
      {!canManageDocuments && (
        <Alert
          type="info"
          message="Информация"
          description="Вы можете просматривать и скачивать документы. Загружать новые документы могут только администраторы."
          showIcon
          style={{ marginBottom: 24 }}
        />
      )}

      {/* Таблица документов */}
      <Card
        title={`Список документов (${totalDocuments})`}
        size="small"
      >
        <DocumentsTable
          documents={documents}
          loading={isLoading}
          canDelete={canManageDocuments}
        />
      </Card>
    </div>
  );
}