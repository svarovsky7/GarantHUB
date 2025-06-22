import React, { useMemo } from 'react';
import dayjs from 'dayjs';
import { Table, Tooltip, Space, Button, Popconfirm, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  EyeOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { useDeleteClaim } from '@/entities/claim';
import type { ClaimFilters } from '@/shared/types/claimFilters';
import type { ClaimWithNames } from '@/shared/types/claimWithNames';
import ClaimStatusSelect from '@/features/claim/ClaimStatusSelect';

const fmt = (d: any) => (d && dayjs.isDayjs(d) && d.isValid() ? d.format('DD.MM.YYYY') : '—');


interface Props {
  claims: ClaimWithNames[];
  filters: ClaimFilters;
  loading?: boolean;
  columns?: ColumnsType<any>;
  onView?: (id: number) => void;
}

export default function ClaimsTable({ claims, filters, loading, columns: columnsProp, onView }: Props) {
  const { mutateAsync: remove, isPending } = useDeleteClaim();
  const defaultColumns: ColumnsType<any> = useMemo(
    () => [
      { title: 'ID', dataIndex: 'id', width: 80, sorter: (a, b) => a.id - b.id },
      { title: 'Проект', dataIndex: 'projectName', width: 180, sorter: (a, b) => a.projectName.localeCompare(b.projectName) },
      { title: 'Объекты', dataIndex: 'unitNames', width: 160, sorter: (a, b) => a.unitNames.localeCompare(b.unitNames) },
      { title: 'Статус', dataIndex: 'claim_status_id', width: 160, sorter: (a, b) => a.statusName.localeCompare(b.statusName), render: (_: any, row: any) => <ClaimStatusSelect claimId={row.id} statusId={row.claim_status_id} statusColor={row.statusColor} statusName={row.statusName} /> },
      { title: '№ претензии', dataIndex: 'claim_no', width: 160, sorter: (a, b) => a.claim_no.localeCompare(b.claim_no) },
      { title: 'Дата претензии', dataIndex: 'claimedOn', width: 120, sorter: (a, b) => (a.claimedOn ? a.claimedOn.valueOf() : 0) - (b.claimedOn ? b.claimedOn.valueOf() : 0), render: (v) => fmt(v) },
      { title: 'Дата получения Застройщиком', dataIndex: 'acceptedOn', width: 120, sorter: (a, b) => (a.acceptedOn ? a.acceptedOn.valueOf() : 0) - (b.acceptedOn ? b.acceptedOn.valueOf() : 0), render: (v) => fmt(v) },
      { title: 'Дата регистрации претензии', dataIndex: 'registeredOn', width: 120, sorter: (a, b) => (a.registeredOn ? a.registeredOn.valueOf() : 0) - (b.registeredOn ? b.registeredOn.valueOf() : 0), render: (v) => fmt(v) },
      { title: 'Дата устранения', dataIndex: 'resolvedOn', width: 120, sorter: (a, b) => (a.resolvedOn ? a.resolvedOn.valueOf() : 0) - (b.resolvedOn ? b.resolvedOn.valueOf() : 0), render: (v) => fmt(v) },
      { title: 'Закрепленный инженер', dataIndex: 'responsibleEngineerName', width: 180, sorter: (a, b) => (a.responsibleEngineerName || '').localeCompare(b.responsibleEngineerName || '') },
      {
        title: 'Действия',
        key: 'actions',
        width: 120,
        render: (_: any, record) => (
          <Space size="middle">
            <Tooltip title="Просмотр">
              <Button size="small" type="text" icon={<EyeOutlined />} onClick={() => onView && onView(record.id)} />
            </Tooltip>
            <Popconfirm
              title="Удалить претензию?"
              okText="Да"
              cancelText="Нет"
              onConfirm={async () => {
                await remove({ id: record.id, ticketIds: record.ticket_ids });
                message.success('Удалено');
              }}
              disabled={isPending}
            >
              <Button size="small" type="text" danger icon={<DeleteOutlined />} loading={isPending} />
            </Popconfirm>
          </Space>
        ),
      },
    ],
    [onView, remove, isPending],
  );

  const columns = columnsProp ?? defaultColumns;

  const filtered = useMemo(() => {
    return claims.filter((c) => {
      const matchesProject = !filters.project || c.projectName === filters.project;
      const matchesUnits = !filters.units || (() => {
        const units = c.unitNumbers ? c.unitNumbers.split(',').map((n) => n.trim()) : [];
        return filters.units.every((u) => units.includes(u));
      })();
      const matchesStatus = !filters.status || c.statusName === filters.status;
      const matchesResponsible = !filters.responsible || c.responsibleEngineerName === filters.responsible;
      const matchesNumber = !filters.claim_no || c.claim_no.includes(filters.claim_no);
      const matchesIds = !filters.id || filters.id.includes(c.id);
      const matchesDescription = !filters.description || (c.description ?? '').includes(filters.description);
      const matchesHideClosed = !(filters.hideClosed && /закры/i.test(c.statusName));
      const matchesPeriod = !filters.period || (c.registeredOn && c.registeredOn.isSameOrAfter(filters.period[0], 'day') && c.registeredOn.isSameOrBefore(filters.period[1], 'day'));
      return matchesProject && matchesUnits && matchesStatus && matchesResponsible && matchesNumber && matchesIds && matchesDescription && matchesHideClosed && matchesPeriod;
    });
  }, [claims, filters]);

  const rowClassName = (row: ClaimWithNames) => {
    return row.hasCheckingDefect ? 'claim-checking-row' : '';
  };

  return (
    <Table
      rowKey="id"
      columns={columns}
      dataSource={filtered}
      loading={loading}
      pagination={{ pageSize: 25, showSizeChanger: true }}
      size="middle"
      rowClassName={rowClassName}
    />
  );
}
