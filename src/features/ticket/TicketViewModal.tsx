import React from 'react';
import {
  Modal,
  Skeleton,
  Typography,
  Descriptions,
  List,
  Tag,
  Button,
} from 'antd';
import { useTicket, signedUrl } from '@/entities/ticket';
import { useUnitsByIds } from '@/entities/unit';

interface Props {
  open: boolean;
  ticketId: string | number | null;
  onClose: () => void;
}

/** Модальное окно просмотра замечания (Ant Design) */
export default function TicketViewModal({ open, ticketId, onClose }: Props) {
  if (!ticketId) return null;
  const { data: ticket } = useTicket(ticketId);
  const { data: units = [] } = useUnitsByIds(ticket?.unitIds ?? []);
  const titleText = ticket
    ? `Замечание №${ticket.id}. Создано ${
        ticket.createdAt ? ticket.createdAt.format('DD.MM.YYYY [в] HH:mm') : ''
      }`
    : 'Замечание';

  const unitNames = units.map((u) => u.name).join(', ');

  const handleDownload = async (a: any) => {
    const filename = a.name;
    const url = await signedUrl(a.path, filename);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width="80%"
      title={<Typography.Title level={4} style={{ margin: 0 }}>{titleText}</Typography.Title>}
    >
      {ticket ? (
        <>
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="Проект">{ticket.projectName}</Descriptions.Item>
            <Descriptions.Item label="Объекты">{unitNames}</Descriptions.Item>
            <Descriptions.Item label="Тип">{ticket.typeName}</Descriptions.Item>
            <Descriptions.Item label="Статус">
              {ticket.statusColor ? (
                <Tag color={ticket.statusColor}>{ticket.statusName}</Tag>
              ) : (
                ticket.statusName
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Получено">
              {ticket.receivedAt ? ticket.receivedAt.format('DD.MM.YYYY') : '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Устранено">
              {ticket.fixedAt ? ticket.fixedAt.format('DD.MM.YYYY') : '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Краткое описание">{ticket.title}</Descriptions.Item>
            <Descriptions.Item label="Подробное описание">
              {ticket.description || '—'}
            </Descriptions.Item>
          </Descriptions>
          {ticket.attachments.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <Typography.Title level={5}>Файлы</Typography.Title>
              <List
                dataSource={ticket.attachments}
                renderItem={(f) => (
                  <List.Item
                    actions={[
                      <Button key="dl" type="link" onClick={() => handleDownload(f)}>
                        Скачать
                      </Button>,
                    ]}
                  >
                    {f.name}
                  </List.Item>
                )}
                size="small"
              />
            </div>
          )}
        </>
      ) : (
        <Skeleton active />
      )}
    </Modal>
  );
}

