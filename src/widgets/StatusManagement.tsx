import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  ColorPicker,
  Checkbox,
  Card,
  Typography,
  Popconfirm,
  Badge,
  Tooltip,
} from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  CheckCircleOutlined,
  StarOutlined,
  StarFilled,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

import {
  useStatuses,
  useCreateStatus,
  useUpdateStatus,
  useDeleteStatus,
  useSetDefaultStatus,
  type Status,
  type StatusFormData,
} from '@/entities/status';

import { useNotify } from '@/shared/hooks/useNotify';

const { Title } = Typography;
const { Option } = Select;

interface StatusManagementProps {
  pageSize?: number;
  rowsPerPageOptions?: number[];
}

export default function StatusManagement({
  pageSize = 5,
  rowsPerPageOptions = [5, 10, 25, 50, 100],
}: StatusManagementProps) {
  const notify = useNotify();
  const [form] = Form.useForm();

  const { data: statuses = [], isPending, error } = useStatuses();
  const createMutation = useCreateStatus();
  const updateMutation = useUpdateStatus();
  const deleteMutation = useDeleteStatus();
  const setDefaultMutation = useSetDefaultStatus();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingStatus, setEditingStatus] = useState<Status | null>(null);

  useEffect(() => {
    if (error) {
      console.error('[StatusManagement] load error:', error);
      notify.error('Ошибка загрузки статусов: ' + error.message);
    }
  }, [error, notify]);

  const entityLabels: Record<string, string> = {
    'engineer_call': 'Вызов инженера',
    'claim': 'Претензия',
    'defect': 'Дефект',
    'court_case': 'Судебное дело',
    'letter': 'Письмо',
  };

  const entityColors: Record<string, string> = {
    'engineer_call': 'blue',
    'claim': 'orange',
    'defect': 'red',
    'court_case': 'purple',
    'letter': 'green',
  };

  const columns: ColumnsType<Status> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
      align: 'center',
      sorter: (a, b) => a.id - b.id,
      render: (id) => (
        <span style={{ color: '#8c8c8c', fontSize: '12px' }}>{id}</span>
      ),
    },
    {
      title: 'Сущность',
      dataIndex: 'entity',
      key: 'entity',
      width: 160,
      sorter: (a, b) => (entityLabels[a.entity] || a.entity).localeCompare(entityLabels[b.entity] || b.entity),
      render: (entity) => (
        <Tag 
          color={entityColors[entity] || 'default'}
          style={{ 
            borderRadius: '12px',
            padding: '2px 12px',
            fontSize: '12px',
          }}
        >
          {entityLabels[entity] || entity}
        </Tag>
      ),
      filters: Object.entries(entityLabels).map(([value, label]) => ({
        text: label,
        value,
      })),
      onFilter: (value, record) => record.entity === value,
    },
    {
      title: 'Название статуса',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (name, record) => (
        <Badge 
          color={record.color || '#d9d9d9'} 
          text={
            <span style={{ 
              fontWeight: 500,
              fontSize: '14px',
            }}>
              {name}
            </span>
          }
        />
      ),
    },
    {
      title: 'Цвет',
      dataIndex: 'color',
      key: 'color',
      width: 80,
      align: 'center',
      sorter: (a, b) => (a.color || '').localeCompare(b.color || ''),
      render: (color) =>
        color ? (
          <div
            style={{
              width: 36,
              height: 24,
              backgroundColor: color,
              border: '1px solid #d9d9d9',
              borderRadius: '4px',
              margin: '0 auto',
              boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
            }}
          />
        ) : (
          <span style={{ color: '#bfbfbf' }}>—</span>
        ),
    },
    {
      title: 'По умолчанию',
      dataIndex: 'is_default',
      key: 'is_default',
      width: 140,
      align: 'center',
      sorter: (a, b) => (a.is_default ? 1 : 0) - (b.is_default ? 1 : 0),
      render: (is_default, record) => (
        <Tooltip title={is_default ? 'Снять статус по умолчанию' : 'Установить как статус по умолчанию'}>
          <Button
            size="small"
            type={is_default ? 'primary' : 'default'}
            icon={is_default ? <StarFilled /> : <StarOutlined />}
            onClick={() => {
              setDefaultMutation.mutate(
                { entity: record.entity, statusId: is_default ? null : record.id },
                {
                  onSuccess: () => notify.success(
                    is_default ? 'Статус по умолчанию снят' : 'Статус установлен по умолчанию'
                  ),
                  onError: (e: any) => notify.error(e.message),
                }
              );
            }}
            style={{
              borderRadius: '12px',
              fontSize: '12px',
            }}
          >
            {is_default ? 'По умолчанию' : 'Установить'}
          </Button>
        </Tooltip>
      ),
    },
    {
      title: 'Действия',
      key: 'actions',
      width: 120,
      align: 'center',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Редактировать">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => {
                setEditingStatus(record);
                form.setFieldsValue({
                  entity: record.entity,
                  name: record.name,
                  color: record.color || '#1890ff',
                  is_default: record.is_default || false,
                });
                setModalVisible(true);
              }}
            />
          </Tooltip>
          <Popconfirm
            title="Удалить статус?"
            description="Это действие нельзя отменить"
            onConfirm={() => {
              deleteMutation.mutate(record.id, {
                onSuccess: () => notify.success('Статус удалён'),
                onError: (e: any) => notify.error(e.message),
              });
            }}
            okText="Удалить"
            cancelText="Отмена"
            okButtonProps={{ danger: true }}
          >
            <Tooltip title="Удалить">
              <Button
                type="text"
                size="small"
                danger
                icon={<DeleteOutlined />}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const handleModalClose = () => {
    setModalVisible(false);
    setEditingStatus(null);
    form.resetFields();
  };

  const handleSubmit = async (values: StatusFormData) => {
    try {
      if (editingStatus) {
        await updateMutation.mutateAsync({ id: editingStatus.id, formData: values });
        notify.success('Статус обновлён');
      } else {
        await createMutation.mutateAsync(values);
        notify.success('Статус создан');
      }
      handleModalClose();
    } catch (error: any) {
      notify.error('Ошибка: ' + error.message);
    }
  };

  return (
    <>
      <Card 
        title={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Title level={4} style={{ margin: 0 }}>
              Управление статусами
            </Title>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditingStatus(null);
                form.resetFields();
                form.setFieldsValue({
                  entity: 'engineer_call',
                  color: '#1890ff',
                  is_default: false,
                });
                setModalVisible(true);
              }}
              style={{ borderRadius: '8px' }}
            >
              Добавить статус
            </Button>
          </div>
        }
        style={{ 
          borderRadius: '12px',
          boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02)',
        }}
      >
        <Table
          columns={columns}
          dataSource={statuses}
          loading={isPending}
          rowKey="id"
          pagination={{
            defaultPageSize: pageSize,
            pageSizeOptions: rowsPerPageOptions,
            showSizeChanger: true,
            showTotal: (total) => `Всего: ${total}`,
            style: { marginTop: '16px' },
          }}
          style={{
            backgroundColor: '#fff',
          }}
          rowClassName={(_, index) => 
            index % 2 === 0 ? '' : 'ant-table-row-light'
          }
        />
      </Card>

      <Modal
        title={editingStatus ? 'Редактировать статус' : 'Новый статус'}
        open={modalVisible}
        onCancel={handleModalClose}
        footer={null}
        width={480}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          style={{ marginTop: '16px' }}
        >
          <Form.Item
            name="entity"
            label="Сущность"
            rules={[{ required: true, message: 'Выберите сущность' }]}
          >
            <Select
              placeholder="Выберите сущность"
              style={{ width: '100%' }}
            >
              <Option value="engineer_call">Вызов инженера</Option>
              <Option value="claim">Претензия</Option>
              <Option value="defect">Дефект</Option>
              <Option value="court_case">Судебное дело</Option>
              <Option value="letter">Письмо</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="name"
            label="Название статуса"
            rules={[
              { required: true, message: 'Введите название статуса' },
              { max: 50, message: 'Максимум 50 символов' },
            ]}
          >
            <Input placeholder="Например: В работе" />
          </Form.Item>

          <Form.Item
            name="color"
            label="Цвет"
            rules={[{ required: true, message: 'Выберите цвет' }]}
          >
            <ColorPicker
              showText
              format="hex"
              defaultValue="#1890ff"
              presets={[
                {
                  label: 'Рекомендуемые',
                  colors: [
                    '#1890ff', // blue
                    '#52c41a', // green
                    '#faad14', // orange
                    '#f5222d', // red
                    '#722ed1', // purple
                    '#13c2c2', // cyan
                    '#eb2f96', // magenta
                    '#fa8c16', // volcano
                    '#a0d911', // lime
                    '#fadb14', // gold
                  ],
                },
              ]}
            />
          </Form.Item>

          <Form.Item
            name="is_default"
            valuePropName="checked"
          >
            <Checkbox>
              Установить как статус по умолчанию для новых записей
            </Checkbox>
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, marginTop: '24px' }}>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={handleModalClose}>
                Отмена
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={createMutation.isPending || updateMutation.isPending}
              >
                {editingStatus ? 'Сохранить' : 'Создать'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <style>{`
        .ant-table-row-light {
          background-color: #fafafa;
        }
        .ant-table-tbody > tr:hover > td {
          background-color: #f5f5f5 !important;
        }
        .ant-table-thead > tr > th {
          background-color: #fafafa !important;
          font-weight: 600;
          color: #262626;
        }
        .ant-badge-status-text {
          margin-left: 8px;
        }
      `}</style>
    </>
  );
}