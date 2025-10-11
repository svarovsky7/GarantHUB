import React from 'react';
import { Card, List, Space, Tag, Badge, Button, Select, Tooltip, Empty, Typography } from 'antd';
import {
  CalendarOutlined,
  FileTextOutlined,
  ExclamationCircleOutlined,
  EyeOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Text } = Typography;

interface EngineerCallsSectionProps {
  engineerCalls: any[];
  engineerCallStatuses: any[];
  editingCallStatus: number | null;
  onEditCallStatus: (id: number) => void;
  onUpdateCallStatus: (callId: number, status: string) => void;
  onCancelCallEdit: () => void;
  onViewCall: (id: number) => void;
}

export default function EngineerCallsSection({
  engineerCalls,
  engineerCallStatuses,
  editingCallStatus,
  onEditCallStatus,
  onUpdateCallStatus,
  onCancelCallEdit,
  onViewCall
}: EngineerCallsSectionProps) {
  const upcomingCalls = engineerCalls.filter(c => dayjs(c.start_datetime).isAfter(dayjs()));

  return (
    <Card title="Предстоящие вызовы инженера">
      {upcomingCalls.length > 0 ? (
        <List
          dataSource={upcomingCalls.slice(0, 5)}
          renderItem={(call) => (
            <List.Item>
              <List.Item.Meta
                title={
                  <Space>
                    <CalendarOutlined />
                    <Text strong>
                      {dayjs(call.start_datetime).format('DD.MM.YYYY HH:mm')}
                    </Text>
                    {call.status && (
                      editingCallStatus === call.id ? (
                        <Select
                          size="small"
                          value={call.status}
                          onChange={(value) => onUpdateCallStatus(call.id, value)}
                          onBlur={onCancelCallEdit}
                          style={{ width: 150 }}
                          autoFocus
                        >
                          {engineerCallStatuses.length > 0 ? (
                            engineerCallStatuses.map(status => (
                              <Select.Option key={status.id} value={status.name}>
                                <Badge color={status.color || '#d9d9d9'} text={status.name} />
                              </Select.Option>
                            ))
                          ) : (
                            <>
                              <Select.Option value="scheduled">Запланирован</Select.Option>
                              <Select.Option value="in_progress">В процессе</Select.Option>
                              <Select.Option value="completed">Завершен</Select.Option>
                              <Select.Option value="cancelled">Отменен</Select.Option>
                            </>
                          )}
                        </Select>
                      ) : (
                        <Tag
                          style={{ cursor: 'pointer' }}
                          onClick={() => onEditCallStatus(call.id)}
                          color={
                            engineerCallStatuses.find(s => s.name === call.status)?.color ||
                            (call.status === 'completed' ? 'green' :
                             call.status === 'cancelled' ? 'red' :
                             call.status === 'in_progress' ? 'orange' : 'blue')
                          }
                        >
                          {call.status}
                        </Tag>
                      )
                    )}
                    <Tooltip title="Просмотр вызова">
                      <Button
                        type="text"
                        size="small"
                        icon={<EyeOutlined />}
                        onClick={() => onViewCall(call.id)}
                      />
                    </Tooltip>
                  </Space>
                }
                description={
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <Text>{call.title || call.description}</Text>

                    <Space wrap size="small">
                      {call.project && (
                        <Tag icon={<FileTextOutlined />} color="blue">
                          Проект: {call.project.name}
                        </Tag>
                      )}

                      {call.unit && (
                        <>
                          {call.unit.building && (
                            <Tag color="cyan">
                              Корпус: {call.unit.building}
                            </Tag>
                          )}
                          {call.unit.floor && (
                            <Tag color="purple">
                              Этаж: {call.unit.floor}
                            </Tag>
                          )}
                          <Tag color="green">
                            Квартира: {call.unit.name}
                          </Tag>
                        </>
                      )}

                      {call.claim && (
                        <Tag icon={<ExclamationCircleOutlined />} color="orange">
                          Претензия №{call.claim.claim_no}
                        </Tag>
                      )}
                    </Space>

                    {call.notes && <Text type="secondary">Заметки: {call.notes}</Text>}
                  </Space>
                }
              />
            </List.Item>
          )}
        />
      ) : (
        <Empty description="Нет предстоящих вызовов" />
      )}
    </Card>
  );
}
