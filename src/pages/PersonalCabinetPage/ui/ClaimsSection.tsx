import React from 'react';
import { Card, Table, Tag, Select, Badge, Button, Space, Tooltip, Empty, Typography } from 'antd';
import { ToolOutlined, EyeOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import DefectsTable from './DefectsTable';

const { Text } = Typography;

interface ClaimsSectionProps {
  claimsWithDefects: any[];
  claimStatuses: any[];
  defectStatuses: any[];
  editingClaimStatus: number | null;
  editingDefectStatus: number | null;
  onEditClaimStatus: (id: number) => void;
  onUpdateClaimStatus: (claimId: number, statusId: number) => void;
  onCancelClaimEdit: () => void;
  onEditDefectStatus: (id: number) => void;
  onUpdateDefectStatus: (defectId: number, statusId: number) => void;
  onCancelDefectEdit: () => void;
  onViewClaim: (id: number) => void;
  onViewDefect: (id: number) => void;
}

export default function ClaimsSection({
  claimsWithDefects,
  claimStatuses,
  defectStatuses,
  editingClaimStatus,
  editingDefectStatus,
  onEditClaimStatus,
  onUpdateClaimStatus,
  onCancelClaimEdit,
  onEditDefectStatus,
  onUpdateDefectStatus,
  onCancelDefectEdit,
  onViewClaim,
  onViewDefect
}: ClaimsSectionProps) {
  return (
    <Card title="Мои претензии и дефекты">
      {claimsWithDefects.length > 0 ? (
        <Table
          dataSource={claimsWithDefects}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          expandable={{
            expandedRowRender: (claim) => claim.defects && claim.defects.length > 0 ? (
              <div>
                <Typography.Text strong style={{ marginBottom: 8, display: 'block' }}>
                  Дефекты претензии №{claim.claim_no}:
                </Typography.Text>
                <DefectsTable
                  defects={claim.defects}
                  defectStatuses={defectStatuses}
                  editingDefectStatus={editingDefectStatus}
                  onEditStatus={onEditDefectStatus}
                  onUpdateStatus={onUpdateDefectStatus}
                  onCancelEdit={onCancelDefectEdit}
                  onViewDefect={onViewDefect}
                />
              </div>
            ) : (
              <Typography.Text type="secondary">Нет дефектов</Typography.Text>
            ),
            rowExpandable: (record) => record.defects && record.defects.length > 0,
          }}
          columns={[
            {
              title: '№ претензии',
              dataIndex: 'claim_no',
              key: 'claim_no',
              sorter: (a, b) => a.claim_no.localeCompare(b.claim_no),
              render: (text) => <Text strong>{text}</Text>,
            },
            {
              title: 'Проект',
              dataIndex: ['project', 'name'],
              key: 'project',
              ellipsis: true,
              sorter: (a, b) => (a.project?.name || '').localeCompare(b.project?.name || ''),
            },
            {
              title: 'Объекты',
              key: 'units',
              ellipsis: true,
              sorter: (a, b) => {
                const aUnits = a.units?.map((u: any) => u.unit?.name || '').join('') || '';
                const bUnits = b.units?.map((u: any) => u.unit?.name || '').join('') || '';
                return aUnits.localeCompare(bUnits);
              },
              render: (_, record) => {
                const units = record.units?.map((u: any) => {
                  const floor = u.unit?.floor ? `Этаж ${u.unit.floor}` : '';
                  const name = u.unit?.name ? `Объект ${u.unit.name}` : '';
                  return [floor, name].filter(Boolean).join(', ');
                }).filter(Boolean).join('; ');
                return (
                  <Tooltip title={units}>
                    <Text>{units || '-'}</Text>
                  </Tooltip>
                );
              },
            },
            {
              title: 'Статус',
              dataIndex: ['claim_status', 'name'],
              key: 'status',
              sorter: (a, b) => (a.claim_status?.name || '').localeCompare(b.claim_status?.name || ''),
              render: (text, record) => {
                if (editingClaimStatus === record.id) {
                  return (
                    <Select
                      size="small"
                      style={{ width: '100%' }}
                      value={record.claim_status_id}
                      onChange={(value) => onUpdateClaimStatus(record.id, value)}
                      onBlur={onCancelClaimEdit}
                      autoFocus
                    >
                      {claimStatuses.map(status => (
                        <Select.Option key={status.id} value={status.id}>
                          <Tag color={status.color}>{status.name}</Tag>
                        </Select.Option>
                      ))}
                    </Select>
                  );
                }
                return (
                  <Tag
                    color={record.claim_status?.color}
                    style={{ cursor: 'pointer' }}
                    onClick={() => onEditClaimStatus(record.id)}
                  >
                    {text}
                  </Tag>
                );
              },
            },
            {
              title: 'Дефектов',
              key: 'defects_count',
              align: 'center' as const,
              sorter: (a, b) => (a.defects?.length || 0) - (b.defects?.length || 0),
              render: (_, record) => (
                <Badge count={record.defects?.length || 0} showZero>
                  <ToolOutlined style={{ fontSize: 16 }} />
                </Badge>
              ),
            },
            {
              title: 'Дата создания',
              dataIndex: 'created_at',
              key: 'created_at',
              sorter: (a, b) => dayjs(a.created_at).unix() - dayjs(b.created_at).unix(),
              render: (date) => dayjs(date).format('DD.MM.YYYY'),
            },
            {
              title: 'Принята',
              dataIndex: 'accepted_on',
              key: 'accepted_on',
              sorter: (a, b) => {
                if (!a.accepted_on) return 1;
                if (!b.accepted_on) return -1;
                return dayjs(a.accepted_on).unix() - dayjs(b.accepted_on).unix();
              },
              render: (date) => date ? dayjs(date).format('DD.MM.YYYY') : '-',
            },
            {
              title: 'Прошло дней',
              key: 'days_since_accepted',
              align: 'center' as const,
              sorter: (a, b) => {
                const aDays = a.accepted_on ? dayjs().diff(dayjs(a.accepted_on), 'day') : 0;
                const bDays = b.accepted_on ? dayjs().diff(dayjs(b.accepted_on), 'day') : 0;
                return aDays - bDays;
              },
              render: (_, record) => {
                if (!record.accepted_on) return '-';
                const days = dayjs().diff(dayjs(record.accepted_on), 'day');
                let color = '#52c41a';
                if (days > 60) color = '#f5222d';
                else if (days > 30) color = '#fa8c16';
                return (
                  <Badge
                    count={days}
                    style={{ backgroundColor: color }}
                    overflowCount={999}
                  />
                );
              },
            },
            {
              title: 'Действия',
              key: 'actions',
              align: 'center' as const,
              render: (_, record) => (
                <Space>
                  <Tooltip title="Просмотр и редактирование">
                    <Button
                      type="link"
                      icon={<EyeOutlined />}
                      onClick={() => onViewClaim(record.id)}
                    />
                  </Tooltip>
                </Space>
              ),
            },
          ]}
        />
      ) : (
        <Empty description="Нет претензий" />
      )}
    </Card>
  );
}
