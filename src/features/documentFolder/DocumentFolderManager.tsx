import React, { useState } from "react";
import {
  Card,
  Button,
  Table,
  Space,
  Typography,
  Popconfirm,
  message,
  Modal,
  Form,
  Input,
  Tooltip,
  Select,
  Tag,
} from "antd";
import {
  FolderOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  GlobalOutlined,
} from "@ant-design/icons";
import {
  useDocumentFolders,
  useCreateDocumentFolder,
  useUpdateDocumentFolder,
  useDeleteDocumentFolder,
} from "@/entities/documentFolder";
import { useProjects } from "@/entities/project";
import type { DocumentFolderWithAuthor, DocumentFolderFormData } from "@/shared/types/documentFolder";
import dayjs from "dayjs";

const { Text } = Typography;
const { TextArea } = Input;

interface Props {
  canManage?: boolean;
}

export default function DocumentFolderManager({ canManage = false }: Props) {
  const { data: folders = [], isLoading } = useDocumentFolders();
  const { data: projects = [], isLoading: projectsLoading } = useProjects();
  const createFolder = useCreateDocumentFolder();
  const updateFolder = useUpdateDocumentFolder();
  const deleteFolder = useDeleteDocumentFolder();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingFolder, setEditingFolder] = useState<DocumentFolderWithAuthor | null>(null);
  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();

  const handleCreate = async (values: DocumentFolderFormData) => {
    try {
      await createFolder.mutateAsync(values);
      message.success("Папка создана");
      setShowCreateModal(false);
      createForm.resetFields();
    } catch (error) {
      message.error("Ошибка при создании папки");
      console.error(error);
    }
  };

  const handleEdit = async (values: DocumentFolderFormData) => {
    if (!editingFolder) return;

    try {
      await updateFolder.mutateAsync({ id: editingFolder.id, ...values });
      message.success("Папка обновлена");
      setEditingFolder(null);
      editForm.resetFields();
    } catch (error) {
      message.error("Ошибка при обновлении папки");
      console.error(error);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteFolder.mutateAsync(id);
      message.success("Папка удалена");
    } catch (error: any) {
      message.error(error.message || "Ошибка при удалении папки");
      console.error(error);
    }
  };

  const startEdit = (folder: DocumentFolderWithAuthor) => {
    setEditingFolder(folder);
    editForm.setFieldsValue({
      name: folder.name,
      description: folder.description,
      project_id: folder.project_id,
    });
  };

  const columns = [
    {
      title: "Название",
      dataIndex: "name",
      key: "name",
      render: (name: string) => (
        <Space>
          <FolderOutlined style={{ color: "#1890ff" }} />
          <Text strong>{name}</Text>
        </Space>
      ),
    },
    {
      title: "Описание",
      dataIndex: "description",
      key: "description",
      render: (description?: string) => (
        <Text type="secondary">{description || "—"}</Text>
      ),
    },
    {
      title: "Проект",
      dataIndex: "project_id",
      key: "project_id",
      width: 150,
      render: (projectId?: number) => {
        if (!projectId) {
          return (
            <Tag icon={<GlobalOutlined />} color="default">
              Общая
            </Tag>
          );
        }
        const project = projects.find(p => p.id === projectId);
        return (
          <Tag color="blue">
            {project?.name || "—"}
          </Tag>
        );
      },
    },
    {
      title: "Автор",
      dataIndex: "authorName",
      key: "authorName",
      width: 150,
      render: (authorName?: string) => (
        <Text type="secondary">{authorName || "—"}</Text>
      ),
    },
    {
      title: "Дата создания",
      dataIndex: "created_at",
      key: "created_at",
      width: 120,
      render: (createdAt: string) => (
        <Text type="secondary">
          {dayjs(createdAt).format("DD.MM.YYYY")}
        </Text>
      ),
    },
    ...(canManage
      ? [
          {
            title: "Действия",
            key: "actions",
            width: 120,
            render: (_: unknown, record: DocumentFolderWithAuthor) => (
              <Space size="small">
                <Tooltip title="Редактировать">
                  <Button
                    size="small"
                    type="text"
                    icon={<EditOutlined />}
                    onClick={() => startEdit(record)}
                  />
                </Tooltip>
                
                <Popconfirm
                  title="Удалить папку?"
                  description="Убедитесь, что в папке нет документов"
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
                      loading={deleteFolder.isPending}
                    />
                  </Tooltip>
                </Popconfirm>
              </Space>
            ),
          },
        ]
      : []),
  ];

  return (
    <>
      <Card
        title="Папки документов"
        size="small"
        extra={
          canManage && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setShowCreateModal(true)}
            >
              Создать папку
            </Button>
          )
        }
      >
        <Table
          columns={columns}
          dataSource={folders}
          rowKey="id"
          loading={isLoading}
          size="small"
          pagination={{
            pageSize: 10,
            showSizeChanger: false,
            showQuickJumper: false,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} из ${total} папок`,
          }}
          locale={{
            emptyText: "Нет папок",
          }}
        />
      </Card>

      {/* Модальное окно создания папки */}
      <Modal
        title="Создать папку"
        open={showCreateModal}
        onCancel={() => {
          setShowCreateModal(false);
          createForm.resetFields();
        }}
        footer={null}
        destroyOnClose
      >
        <Form
          form={createForm}
          layout="vertical"
          onFinish={handleCreate}
        >
          <Form.Item
            name="name"
            label="Название папки"
            rules={[
              { required: true, message: "Введите название папки" },
              { min: 2, message: "Минимум 2 символа" },
              { max: 50, message: "Максимум 50 символов" },
            ]}
          >
            <Input placeholder="Введите название папки" />
          </Form.Item>

          <Form.Item
            name="project_id"
            label="Проект"
          >
            <Select
              placeholder="Выберите проект или оставьте пустым для общей папки"
              allowClear
              loading={projectsLoading}
              showSearch
              optionFilterProp="children"
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={[
                { value: null, label: 'Общая папка' },
                ...projects.map(project => ({
                  value: project.id,
                  label: project.name,
                }))
              ]}
            />
          </Form.Item>

          <Form.Item
            name="description"
            label="Описание (необязательно)"
          >
            <TextArea
              rows={3}
              placeholder="Введите описание папки"
              maxLength={200}
              showCount
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: "right" }}>
            <Space>
              <Button onClick={() => setShowCreateModal(false)}>
                Отмена
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={createFolder.isPending}
              >
                Создать
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Модальное окно редактирования папки */}
      <Modal
        title="Редактировать папку"
        open={!!editingFolder}
        onCancel={() => {
          setEditingFolder(null);
          editForm.resetFields();
        }}
        footer={null}
        destroyOnClose
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={handleEdit}
        >
          <Form.Item
            name="name"
            label="Название папки"
            rules={[
              { required: true, message: "Введите название папки" },
              { min: 2, message: "Минимум 2 символа" },
              { max: 50, message: "Максимум 50 символов" },
            ]}
          >
            <Input placeholder="Введите название папки" />
          </Form.Item>

          <Form.Item
            name="project_id"
            label="Проект"
          >
            <Select
              placeholder="Выберите проект или оставьте пустым для общей папки"
              allowClear
              loading={projectsLoading}
              showSearch
              optionFilterProp="children"
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={[
                { value: null, label: 'Общая папка' },
                ...projects.map(project => ({
                  value: project.id,
                  label: project.name,
                }))
              ]}
            />
          </Form.Item>

          <Form.Item
            name="description"
            label="Описание (необязательно)"
          >
            <TextArea
              rows={3}
              placeholder="Введите описание папки"
              maxLength={200}
              showCount
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: "right" }}>
            <Space>
              <Button onClick={() => setEditingFolder(null)}>
                Отмена
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={updateFolder.isPending}
              >
                Сохранить
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}