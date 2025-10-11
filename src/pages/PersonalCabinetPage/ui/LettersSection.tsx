import React from 'react';
import { Card, Table, Tag, Badge, Button, Tooltip, Empty, Typography } from 'antd';
import { UserOutlined, TeamOutlined, EyeOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { Text } = Typography;

interface LettersSectionProps {
  letters: any[];
  onViewLetter: (id: number) => void;
}

export default function LettersSection({ letters, onViewLetter }: LettersSectionProps) {
  return (
    <Card title="Мои письма">
      {letters.length > 0 ? (
        <Table
          dataSource={letters}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          columns={[
            {
              title: 'Дата',
              dataIndex: 'created_at',
              key: 'created_at',
              render: (date) => dayjs(date).format('DD.MM.YYYY'),
              sorter: (a, b) => dayjs(a.created_at).unix() - dayjs(b.created_at).unix(),
              defaultSortOrder: 'descend' as const,
            },
            {
              title: 'Номер',
              dataIndex: 'number',
              key: 'number',
              sorter: (a, b) => (a.number || 0) - (b.number || 0),
              render: (number) => (
                <Text strong>№{number}</Text>
              ),
            },
            {
              title: 'Тема',
              dataIndex: 'theme',
              key: 'theme',
              ellipsis: true,
              sorter: (a, b) => (a.theme || '').localeCompare(b.theme || ''),
              render: (theme) => theme || <Text type="secondary">Без темы</Text>,
            },
            {
              title: 'Отправитель',
              key: 'sender',
              render: (_, record) => {
                if (record.sender_person) {
                  return <Tag icon={<UserOutlined />}>{record.sender_person.full_name}</Tag>;
                }
                if (record.sender_contractor) {
                  return <Tag icon={<TeamOutlined />} color="blue">{record.sender_contractor.name}</Tag>;
                }
                return <Text type="secondary">—</Text>;
              },
            },
            {
              title: 'Получатель',
              key: 'receiver',
              render: (_, record) => {
                if (record.receiver_person) {
                  return <Tag icon={<UserOutlined />}>{record.receiver_person.full_name}</Tag>;
                }
                if (record.receiver_contractor) {
                  return <Tag icon={<TeamOutlined />} color="green">{record.receiver_contractor.name}</Tag>;
                }
                return <Text type="secondary">—</Text>;
              },
            },
            {
              title: 'Статус',
              dataIndex: 'status',
              key: 'status',
              sorter: (a, b) => (a.status?.name || '').localeCompare(b.status?.name || ''),
              render: (status) => status ? (
                <Badge
                  color={status.color || '#d9d9d9'}
                  text={status.name}
                />
              ) : (
                <Text type="secondary">—</Text>
              ),
            },
            {
              title: 'Действия',
              key: 'actions',
              align: 'center' as const,
              render: (_, record) => (
                <Tooltip title="Просмотр письма">
                  <Button
                    type="link"
                    icon={<EyeOutlined />}
                    onClick={() => onViewLetter(record.id)}
                  />
                </Tooltip>
              ),
            },
          ]}
        />
      ) : (
        <Empty description="Нет писем" />
      )}
    </Card>
  );
}
