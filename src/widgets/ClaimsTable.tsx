import React, { useMemo } from 'react';
import dayjs from 'dayjs';
import { Table, Tooltip, Space, Button, Tag, Popconfirm, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { EyeOutlined, DeleteOutlined } from '@ant-design/icons';
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
      { title: 'Статус', dataIndex: 'status_id', width: 160, sorter: (a, b) => a.statusName.localeCompare(b.statusName), render: (_: any, row: any) => <ClaimStatusSelect claimId={row.id} statusId={row.status_id} statusColor={row.statusColor} statusName={row.statusName} /> },
      { title: '№ претензии', dataIndex: 'number', width: 160, sorter: (a, b) => a.number.localeCompare(b.number) },
      { title: 'Дата претензии', dataIndex: 'claimDate', width: 120, sorter: (a, b) => (a.claimDate ? a.claimDate.valueOf() : 0) - (b.claimDate ? b.claimDate.valueOf() : 0), render: (v) => fmt(v) },
      { title: 'Дата получения Застройщиком', dataIndex: 'receivedByDeveloperAt', width: 120, sorter: (a, b) => (a.receivedByDeveloperAt ? a.receivedByDeveloperAt.valueOf() : 0) - (b.receivedByDeveloperAt ? b.receivedByDeveloperAt.valueOf() : 0), render: (v) => fmt(v) },
      { title: 'Дата регистрации претензии', dataIndex: 'registeredAt', width: 120, sorter: (a, b) => (a.registeredAt ? a.registeredAt.valueOf() : 0) - (b.registeredAt ? b.registeredAt.valueOf() : 0), render: (v) => fmt(v) },
      { title: 'Дата устранения', dataIndex: 'fixedAt', width: 120, sorter: (a, b) => (a.fixedAt ? a.fixedAt.valueOf() : 0) - (b.fixedAt ? b.fixedAt.valueOf() : 0), render: (v) => fmt(v) },
      { title: 'Ответственный инженер', dataIndex: 'responsibleEngineerName', width: 180, sorter: (a, b) => (a.responsibleEngineerName || '').localeCompare(b.responsibleEngineerName || '') },
      { title: 'Действия', key: 'actions', width: 100, render: (_: any, record) => (
        <Space size="middle">
          <Tooltip title="Просмотр">
            <Button size="small" type="text" icon={<EyeOutlined />} onClick={() => onView && onView(record.id)} />
          </Tooltip>
          <Popconfirm
            title="Удалить претензию?"
            okText="Да"
            cancelText="Нет"
            onConfirm={async () => {
              await remove({ id: record.id, defectIds: record.defect_ids });
              message.success('Удалено');
            }}
            disabled={isPending}
          >
            <Button size="small" type="text" danger icon={<DeleteOutlined />} loading={isPending} />
          </Popconfirm>
        </Space>
      ) },
    ],
    [onView, remove, isPending],
  );

  const columns = columnsProp ?? defaultColumns;

  const filtered = useMemo(() => {
    return claims.filter((c) => {
      const matchesProject = !filters.project || c.projectName === filters.project;
      const matchesUnits = !filters.units || filters.units.every((u) => c.unitNames.includes(u));
      const matchesStatus = !filters.status || c.statusName === filters.status;
      const matchesResponsible = !filters.responsible || c.responsibleEngineerName === filters.responsible;
      const matchesNumber = !filters.number || c.number.includes(filters.number);
      const matchesIds = !filters.id || filters.id.includes(c.id);
      const matchesPeriod = !filters.period || (c.registeredAt && c.registeredAt.isSameOrAfter(filters.period[0], 'day') && c.registeredAt.isSameOrBefore(filters.period[1], 'day'));
      return matchesProject && matchesUnits && matchesStatus && matchesResponsible && matchesNumber && matchesIds && matchesPeriod;
    });
  }, [claims, filters]);

  return <Table rowKey="id" columns={columns} dataSource={filtered} loading={loading} pagination={{ pageSize: 25, showSizeChanger: true }} size="middle" />;
}
