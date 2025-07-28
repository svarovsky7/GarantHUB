import React, { useState } from "react";
import {
  Form,
  Input,
  Button,
  Upload,
  Card,
  message,
  Space,
  Select,
} from "antd";
import { UploadOutlined, FolderOutlined } from "@ant-design/icons";
import type { UploadFile } from "antd";
import { useCreateDocument } from "@/entities/document";
import { useDocumentFolders } from "@/entities/documentFolder";
import type { DocumentFormData } from "@/shared/types/document";

const { TextArea } = Input;

interface Props {
  onSuccess?: () => void;
}

export default function DocumentUploadForm({ onSuccess }: Props) {
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const createDocument = useCreateDocument();
  const { data: folders = [], isLoading: foldersLoading } = useDocumentFolders();

  const handleSubmit = async (values: { title: string; description?: string; folder_ids?: number[] }) => {
    if (fileList.length === 0) {
      message.error("Пожалуйста, выберите файл");
      return;
    }

    const file = fileList[0].originFileObj;
    if (!file) {
      message.error("Ошибка при выборе файла");
      return;
    }

    const formData: DocumentFormData = {
      title: values.title,
      description: values.description,
      file,
      folder_ids: values.folder_ids,
    };

    try {
      await createDocument.mutateAsync(formData);
      message.success("Документ успешно загружен");
      form.resetFields();
      setFileList([]);
      onSuccess?.();
    } catch (error) {
      message.error("Ошибка при загрузке документа");
      console.error(error);
    }
  };

  const handleFileChange = ({ fileList }: { fileList: UploadFile[] }) => {
    setFileList(fileList.slice(-1)); // Оставляем только последний файл
  };

  const beforeUpload = (file: File) => {
    const isLt50M = file.size / 1024 / 1024 < 50;
    if (!isLt50M) {
      message.error("Размер файла не должен превышать 50MB");
    }
    return false; // Предотвращаем автоматическую загрузку
  };

  return (
    <Card title="Загрузить документ" size="small">
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        disabled={createDocument.isPending}
      >
        <Form.Item
          name="title"
          label="Название документа"
          rules={[
            { required: true, message: "Пожалуйста, введите название документа" },
            { min: 3, message: "Название должно содержать минимум 3 символа" },
          ]}
        >
          <Input placeholder="Введите название документа" />
        </Form.Item>

        <Form.Item
          name="folder_ids"
          label="Папки"
        >
          <Select
            mode="multiple"
            placeholder="Выберите папки (необязательно)"
            allowClear
            loading={foldersLoading}
            optionFilterProp="label"
            showSearch
          >
            {folders.map((folder) => (
              <Select.Option key={folder.id} value={folder.id} label={folder.name}>
                <Space>
                  <FolderOutlined />
                  {folder.name}
                </Space>
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="description"
          label="Описание (необязательно)"
        >
          <TextArea
            rows={3}
            placeholder="Введите описание документа"
            maxLength={500}
            showCount
          />
        </Form.Item>

        <Form.Item
          label="Файл"
          required
        >
          <Upload
            fileList={fileList}
            onChange={handleFileChange}
            beforeUpload={beforeUpload}
            maxCount={1}
            accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.png,.jpg,.jpeg"
          >
            <Button icon={<UploadOutlined />}>
              Выберите файл
            </Button>
          </Upload>
          <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
            Поддерживаемые форматы: PDF, DOC, DOCX, XLS, XLSX, TXT, PNG, JPG, JPEG
            <br />
            Максимальный размер: 50MB
          </div>
        </Form.Item>

        <Form.Item>
          <Space>
            <Button
              type="primary"
              htmlType="submit"
              loading={createDocument.isPending}
            >
              Загрузить
            </Button>
            <Button onClick={() => form.resetFields()}>
              Очистить
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
}