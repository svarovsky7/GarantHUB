import React, { useMemo } from 'react';
import dayjs from 'dayjs';
import { Table, Tooltip, Space, Button, Popconfirm, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  EyeOutlined,
  DeleteOutlined,
  PlusOutlined,
  BranchesOutlined,
  FileTextOutlined,
  LinkOutlined,
} from '@ant-design/icons';
import { useDeleteClaim } from '@/entities/claim';
import type { ClaimFilters } from '@/shared/types/claimFilters';
import type { ClaimWithNames } from '@/shared/types/claimWithNames';
import ClaimStatusSelect from '@/features/claim/ClaimStatusSelect';
import { useResizableColumns } from '@/shared/hooks/useResizableColumns';

const fmt = (d: any) =>
  d && dayjs.isDayjs(d) && d.isValid() ? d.format('DD.MM.YYYY') : '—';
const fmtDateTime = (d: any) =>
  d && dayjs.isDayjs(d) && d.isValid() ? d.format('DD.MM.YYYY HH:mm') : '—';


interface Props {
  claims: ClaimWithNames[];
  filters: ClaimFilters;
  loading?: boolean;
  columns?: ColumnsType<any>;
  onView?: (id: number) => void;
  onAddChild?: (parent: ClaimWithNames) => void;
  onUnlink?: (id: number) => void;
}

export default function ClaimsTable({
  claims,
  filters,
  loading,
  columns: columnsProp,
  onView,
  onAddChild,
  onUnlink,
}: Props) {
  const { mutateAsync: remove, isPending } = useDeleteClaim();
  const defaultColumns: ColumnsType<any> = useMemo(
    () => [
      {
        title: '',
        dataIndex: 'treeIcon',
        width: 40,
        render: (_: any, record: any) => {
          if (!record.parent_id) {
            return (
              <Tooltip title="Основная претензия">
                <FileTextOutlined style={{ color: '#1890ff', fontSize: 17 }} />
              </Tooltip>
            );
          }
          return (
            <Tooltip title="Связанная претензия">
              <BranchesOutlined style={{ color: '#52c41a', fontSize: 16 }} />
            </Tooltip>
          );
        },
      },
      { title: 'ID', dataIndex: 'id', width: 80, sorter: (a, b) => a.id - b.id },
      { title: 'Проект', dataIndex: 'projectName', width: 180, sorter: (a, b) => a.projectName.localeCompare(b.projectName) },
      { title: 'Корпус', dataIndex: 'buildings', width: 120, sorter: (a, b) => (a.buildings || '').localeCompare(b.buildings || '') },
      { title: 'Объекты', dataIndex: 'unitNames', width: 160, sorter: (a, b) => a.unitNames.localeCompare(b.unitNames) },
      { title: 'Статус', dataIndex: 'claim_status_id', width: 160, sorter: (a, b) => a.statusName.localeCompare(b.statusName), render: (_: any, row: any) => <ClaimStatusSelect claimId={row.id} statusId={row.claim_status_id} statusColor={row.statusColor} statusName={row.statusName} /> },
      { title: '№ претензии', dataIndex: 'claim_no', width: 160, sorter: (a, b) => a.claim_no.localeCompare(b.claim_no) },
      { title: 'Дата претензии', dataIndex: 'claimedOn', width: 120, sorter: (a, b) => (a.claimedOn ? a.claimedOn.valueOf() : 0) - (b.claimedOn ? b.claimedOn.valueOf() : 0), render: (v) => fmt(v) },
      { title: 'Дата получения Застройщиком', dataIndex: 'acceptedOn', width: 120, sorter: (a, b) => (a.acceptedOn ? a.acceptedOn.valueOf() : 0) - (b.acceptedOn ? b.acceptedOn.valueOf() : 0), render: (v) => fmt(v) },
      { title: 'Дата регистрации претензии', dataIndex: 'registeredOn', width: 120, sorter: (a, b) => (a.registeredOn ? a.registeredOn.valueOf() : 0) - (b.registeredOn ? b.registeredOn.valueOf() : 0), render: (v) => fmt(v) },
      { title: 'Дата устранения', dataIndex: 'resolvedOn', width: 120, sorter: (a, b) => (a.resolvedOn ? a.resolvedOn.valueOf() : 0) - (b.resolvedOn ? b.resolvedOn.valueOf() : 0), render: (v) => fmt(v) },
      { title: 'Закрепленный инженер', dataIndex: 'responsibleEngineerName', width: 180, sorter: (a, b) => (a.responsibleEngineerName || '').localeCompare(b.responsibleEngineerName || '') },
      {
        title: 'Добавлено',
        dataIndex: 'createdAt',
        width: 160,
        sorter: (a, b) =>
          (a.createdAt ? a.createdAt.valueOf() : 0) -
          (b.createdAt ? b.createdAt.valueOf() : 0),
        render: (v) => fmtDateTime(v),
      },
      { title: 'Автор', dataIndex: 'createdByName', width: 160, sorter: (a, b) => (a.createdByName || '').localeCompare(b.createdByName || '') },
      {
        title: 'Действия',
        key: 'actions',
        width: 140,
        render: (_: any, record) => (
          <Space size="middle">
            <Tooltip title="Просмотр">
              <Button size="small" type="text" icon={<EyeOutlined />} onClick={() => onView && onView(record.id)} />
            </Tooltip>
            <Button size="small" type="text" icon={<PlusOutlined />} onClick={() => onAddChild && onAddChild(record)} />
            {record.parent_id && (
              <Tooltip title="Исключить из связи">
                <Button
                  size="small"
                  type="text"
                  icon={<LinkOutlined style={{ color: '#c41d7f', textDecoration: 'line-through', fontWeight: 700 }} />}
                  onClick={() => onUnlink && onUnlink(record.id)}
                />
              </Tooltip>
            )}
            <Popconfirm
              title="Удалить претензию?"
              okText="Да"
              cancelText="Нет"
              onConfirm={async () => {
                await remove({ id: record.id });
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

  const { columns: columnsWithResize, components } =
    useResizableColumns(columnsProp ?? defaultColumns);

  const filtered = useMemo(() => {
    return claims.filter((c) => {
      const matchesProject = !filters.project || c.projectName === filters.project;
      const matchesUnits = !filters.units || (() => {
        const units = c.unitNumbers ? c.unitNumbers.split(',').map((n) => n.trim()) : [];
        return filters.units.every((u) => units.includes(u));
      })();
      const matchesBuilding = !filters.building || (() => {
        const blds = c.buildings ? c.buildings.split(',').map((n) => n.trim()) : [];
        return blds.includes(filters.building!);
      })();
      const matchesStatus = !filters.status || c.statusName === filters.status;
      const matchesResponsible = !filters.responsible || c.responsibleEngineerName === filters.responsible;
      const matchesNumber = !filters.claim_no || c.claim_no.includes(filters.claim_no);
      const matchesIds = !filters.id || filters.id.includes(c.id);
      const matchesDescription = !filters.description || (c.description ?? '').includes(filters.description);
      const matchesHideClosed = !(filters.hideClosed && /закры/i.test(c.statusName));
      const matchesPeriod = !filters.period || (c.registeredOn && c.registeredOn.isSameOrAfter(filters.period[0], 'day') && c.registeredOn.isSameOrBefore(filters.period[1], 'day'));
      return matchesProject && matchesUnits && matchesBuilding && matchesStatus && matchesResponsible && matchesNumber && matchesIds && matchesDescription && matchesHideClosed && matchesPeriod;
    });
  }, [claims, filters]);

  const treeData = useMemo(() => {
    const map = new Map<number, any>();
    const roots: any[] = [];
    filtered.forEach((c) => {
      const row = { ...c, key: c.id, children: [] as any[] };
      map.set(c.id, row);
    });
    filtered.forEach((c) => {
      const row = map.get(c.id);
      if (c.parent_id && map.has(c.parent_id)) {
        map.get(c.parent_id).children.push(row);
      } else {
        roots.push(row);
      }
    });
    map.forEach((row) => {
      if (!row.children.length) row.children = undefined;
    });
    return roots;
  }, [filtered]);

  const [expandedRowKeys, setExpandedRowKeys] = React.useState<React.Key[]>([]);
  /** Количество строк на странице по умолчанию */
  const [pageSize, setPageSize] = React.useState(100);

  React.useEffect(() => {
    // По умолчанию все строки свернуты
    setExpandedRowKeys([]);
  }, [filtered]);

  const rowClassName = (row: ClaimWithNames) => {
    const checking = row.statusName?.toLowerCase().includes('провер');
    const closed = row.statusName?.toLowerCase().includes('закры');
    const preTrial = row.pre_trial_claim ||
      row.statusName?.toLowerCase().includes('досудеб');
    if (checking || row.hasCheckingDefect) return 'claim-checking-row';
    if (preTrial) return 'claim-pretrial-row';
    if (closed) return 'claim-closed-row';
    return '';
  };

  return (
    <Table
      rowKey="id"
      columns={columnsWithResize}
      components={components}
      sticky={{ offsetHeader: 64 }}
      dataSource={treeData}
      loading={loading}
      pagination={{
        pageSize,
        showSizeChanger: true,
        onChange: (_p, size) => size && setPageSize(size),
      }}
      size="middle"
      expandable={{
        expandRowByClick: true,
        indentSize: 24,
        expandedRowKeys,
        onExpand: (expanded, record) => {
          setExpandedRowKeys((prev) => {
            const set = new Set(prev);
            if (expanded) {
              set.add(record.id);
            } else {
              set.delete(record.id);
            }
            return Array.from(set);
          });
        },
      }}
      rowClassName={(row: any) => {
        const base = rowClassName(row);
        return row.parent_id ? `child-claim-row ${base}` : `main-claim-row ${base}`;
      }}
      style={{ background: '#fff' }}
    />
  );
}
