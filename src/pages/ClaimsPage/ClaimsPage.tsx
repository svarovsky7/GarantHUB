import React, { useState, useMemo } from 'react';
import { ConfigProvider, Alert, Card, Button, Tooltip, Popconfirm, message, Space } from 'antd';
import ruRU from 'antd/locale/ru_RU';
import {
  SettingOutlined,
  EyeOutlined,
  DeleteOutlined,
  PlusOutlined,
  LinkOutlined,
} from '@ant-design/icons';
import ExportClaimsButton from '@/features/claim/ExportClaimsButton';
import { useSnackbar } from 'notistack';
import { useClaims, useDeleteClaim, useLinkClaims, useUnlinkClaim } from '@/entities/claim';
import LinkClaimsDialog from '@/features/claim/LinkClaimsDialog';
import { useUsers } from '@/entities/user';
import { useUnitsByIds } from '@/entities/unit';
import formatUnitName from '@/shared/utils/formatUnitName';
import ClaimsTable from '@/widgets/ClaimsTable';
import ClaimsFilters from '@/widgets/ClaimsFilters';
import ClaimFormAntd from '@/features/claim/ClaimFormAntd';
import ClaimViewModal from '@/features/claim/ClaimViewModal';
import ClaimStatusSelect from "@/features/claim/ClaimStatusSelect";
import dayjs from "dayjs";
import TableColumnsDrawer from '@/widgets/TableColumnsDrawer';
import type { TableColumnSetting } from '@/shared/types/tableColumnSetting';
import type { ColumnsType } from 'antd/es/table';
import type { ClaimWithNames } from '@/shared/types/claimWithNames';

export default function ClaimsPage() {
  const { enqueueSnackbar } = useSnackbar();
  const { data: claims = [], isLoading, error } = useClaims();
  const deleteClaimMutation = useDeleteClaim();
  const { data: users = [] } = useUsers();
  const unitIds = useMemo(
    () => Array.from(new Set(claims.flatMap((t) => t.unit_ids))),
    [claims],
  );
  const { data: units = [] } = useUnitsByIds(unitIds);
  const checkingDefectMap = useMemo(() => new Map<number, boolean>(), []);
  const [filters, setFilters] = useState({});
  const [showAddForm, setShowAddForm] = useState(false);
  const linkClaims = useLinkClaims();
  const unlinkClaim = useUnlinkClaim();
  const [linkFor, setLinkFor] = useState<ClaimWithNames | null>(null);
  const LS_SHOW_FILTERS = 'claims:showFilters';
  const [showFilters, setShowFilters] = useState<boolean>(() => {
    try {
      return JSON.parse(localStorage.getItem(LS_SHOW_FILTERS) || 'true');
    } catch {
      return true;
    }
  });
  React.useEffect(() => {
    try {
      localStorage.setItem(LS_SHOW_FILTERS, JSON.stringify(showFilters));
    } catch {}
  }, [showFilters]);
  const [viewId, setViewId] = useState<number | null>(null);
  const [showColumnsDrawer, setShowColumnsDrawer] = useState(false);
  const [columnsState, setColumnsState] = useState<TableColumnSetting[]>(() => {
    const base = getBaseColumns();
    const defaults = Object.keys(base).map((key) => ({ key, title: base[key].title as string, visible: true }));
    return defaults;
  });

  /**
   * Сброс колонок к начальному состоянию
   */
  const handleResetColumns = () => {
    const base = getBaseColumns();
    const defaults = Object.keys(base).map((key) => ({
      key,
      title: base[key].title as string,
      visible: true,
    }));
    setColumnsState(defaults);
  };

  const userMap = useMemo(() => {
    const map = {} as Record<string, string>;
    (users ?? []).forEach((u) => {
      map[u.id] = u.name;
    });
    return map;
  }, [users]);

  const unitMap = useMemo(() => {
    const map = {} as Record<number, string>;
    (units ?? []).forEach((u) => {
      map[u.id] = formatUnitName(u);
    });
    return map;
  }, [units]);

  const unitNumberMap = useMemo(() => {
    const map = {} as Record<number, string>;
    (units ?? []).forEach((u) => {
      map[u.id] = u.name;
    });
    return map;
  }, [units]);

  const claimsWithNames: ClaimWithNames[] = useMemo(
    () =>
      claims.map((c) => ({
        ...c,
        unitNames: c.unit_ids.map((id) => unitMap[id]).filter(Boolean).join(', '),
        unitNumbers: c.unit_ids.map((id) => unitNumberMap[id]).filter(Boolean).join(', '),
        responsibleEngineerName: userMap[c.engineer_id] ?? null,
        hasCheckingDefect: false,
      })),
    [claims, unitMap, unitNumberMap, userMap, checkingDefectMap],
  );

  const options = useMemo(() => {
    const uniq = (arr: any[], key: string) => Array.from(new Set(arr.map((i) => i[key]).filter(Boolean))).map((v) => ({ label: v, value: v }));
    return {
      projects: uniq(claimsWithNames, 'projectName'),
      units: Array.from(new Set((units ?? []).map((u) => u.name))).map((v) => ({ label: v, value: v })),
      statuses: uniq(claimsWithNames, 'statusName'),
      responsibleEngineers: uniq(claimsWithNames, 'responsibleEngineerName'),
      ids: uniq(claimsWithNames, 'id'),
    };
  }, [claimsWithNames, units]);

  function getBaseColumns() {
    return {
      id: { title: 'ID', dataIndex: 'id', width: 80, sorter: (a: any, b: any) => a.id - b.id },
      projectName: { title: 'Проект', dataIndex: 'projectName', width: 180, sorter: (a: any, b: any) => a.projectName.localeCompare(b.projectName) },
      unitNames: { title: 'Объекты', dataIndex: 'unitNames', width: 160, sorter: (a: any, b: any) => a.unitNames.localeCompare(b.unitNames) },
      statusId: { title: 'Статус', dataIndex: 'claim_status_id', width: 160, sorter: (a: any, b: any) => a.statusName.localeCompare(b.statusName), render: (_: any, row: any) => <ClaimStatusSelect claimId={row.id} statusId={row.claim_status_id} statusColor={row.statusColor} statusName={row.statusName} /> },
      claim_no: { title: '№ претензии', dataIndex: 'claim_no', width: 160, sorter: (a: any, b: any) => a.claim_no.localeCompare(b.claim_no) },
      claimedOn: { title: 'Дата претензии', dataIndex: 'claimedOn', width: 120, sorter: (a: any, b: any) => (a.claimedOn ? a.claimedOn.valueOf() : 0) - (b.claimedOn ? b.claimedOn.valueOf() : 0), render: (v: any) => fmt(v) },
      acceptedOn: { title: 'Дата получения Застройщиком', dataIndex: 'acceptedOn', width: 120, sorter: (a: any, b: any) => (a.acceptedOn ? a.acceptedOn.valueOf() : 0) - (b.acceptedOn ? b.acceptedOn.valueOf() : 0), render: (v: any) => fmt(v) },
      registeredOn: { title: 'Дата регистрации претензии', dataIndex: 'registeredOn', width: 120, sorter: (a: any, b: any) => (a.registeredOn ? a.registeredOn.valueOf() : 0) - (b.registeredOn ? b.registeredOn.valueOf() : 0), render: (v: any) => fmt(v) },
      resolvedOn: { title: 'Дата устранения', dataIndex: 'resolvedOn', width: 120, sorter: (a: any, b: any) => (a.resolvedOn ? a.resolvedOn.valueOf() : 0) - (b.resolvedOn ? b.resolvedOn.valueOf() : 0), render: (v: any) => fmt(v) },
      responsibleEngineerName: { title: 'Закрепленный инженер', dataIndex: 'responsibleEngineerName', width: 180, sorter: (a: any, b: any) => (a.responsibleEngineerName || '').localeCompare(b.responsibleEngineerName || '') },
      actions: {
        title: 'Действия',
        key: 'actions',
        width: 120,
        render: (_: any, record: ClaimWithNames) => (
          <Space size="middle">
            <Tooltip title="Просмотр">
              <Button size="small" type="text" icon={<EyeOutlined />} onClick={() => setViewId(record.id)} />
            </Tooltip>
            <Button size="small" type="text" icon={<PlusOutlined />} onClick={() => setLinkFor(record)} />
            {record.parent_id && (
              <Tooltip title="Исключить из связи">
                <Button
                  size="small"
                  type="text"
                  icon={<LinkOutlined style={{ color: '#c41d7f', textDecoration: 'line-through', fontWeight: 700 }} />}
                  onClick={() => unlinkClaim.mutate(record.id)}
                />
              </Tooltip>
            )}
            <Popconfirm
              title="Удалить претензию?"
              okText="Да"
              cancelText="Нет"
              onConfirm={async () => {
                await deleteClaimMutation.mutateAsync({ id: record.id, ticketIds: record.ticket_ids });
                message.success('Удалено');
              }}
              disabled={deleteClaimMutation.isPending}
            >
              <Button size="small" type="text" danger icon={<DeleteOutlined />} loading={deleteClaimMutation.isPending} />
            </Popconfirm>
          </Space>
        ),
      },
    } as Record<string, ColumnsType<any>[number]>;
  }

  const baseColumns = useMemo(getBaseColumns, [deleteClaimMutation.isPending]);
  const columns: ColumnsType<any> = useMemo(() => columnsState.filter((c) => c.visible).map((c) => baseColumns[c.key]), [columnsState, baseColumns]);

  return (
    <ConfigProvider locale={ruRU}>
      <>
        <Button type="primary" onClick={() => setShowAddForm((p) => !p)} style={{ marginTop: 16, marginRight: 8 }}>
          {showAddForm ? 'Скрыть форму' : 'Добавить претензию'}
        </Button>
        <Button onClick={() => setShowFilters((p) => !p)} style={{ marginTop: 16 }}>
          {showFilters ? 'Скрыть фильтры' : 'Показать фильтры'}
        </Button>
        <Button icon={<SettingOutlined />} style={{ marginTop: 16, marginLeft: 8 }} onClick={() => setShowColumnsDrawer(true)} />
        <span style={{ marginTop: 16, marginLeft: 8, display: 'inline-block' }}>
          <ExportClaimsButton claims={claimsWithNames} filters={filters} />
        </span>
        {showAddForm && (
          <div style={{ marginTop: 16 }}>
            <ClaimFormAntd onCreated={() => setShowAddForm(false)} />
          </div>
        )}
        <TableColumnsDrawer
          open={showColumnsDrawer}
          columns={columnsState}
          onChange={setColumnsState}
          onClose={() => setShowColumnsDrawer(false)}
          onReset={handleResetColumns}
        />
        <div style={{ marginTop: 24 }}>
          {showFilters && (
            <Card style={{ marginBottom: 24 }}>
              <ClaimsFilters options={options} onChange={setFilters} />
            </Card>
          )}
          {error ? (
            <Alert type="error" message={error.message} />
          ) : (
            <ClaimsTable
              claims={claimsWithNames}
              filters={filters}
              loading={isLoading}
              columns={columns}
              onView={(id) => setViewId(id)}
              onAddChild={setLinkFor}
              onUnlink={(id) => unlinkClaim.mutate(id)}
            />
          )}
        </div>
        <LinkClaimsDialog
          open={!!linkFor}
          parent={linkFor}
          claims={claimsWithNames}
          onClose={() => setLinkFor(null)}
          onSubmit={(ids) => {
            if (!linkFor) return;
            linkClaims.mutate({ parentId: String(linkFor.id), childIds: ids });
            setLinkFor(null);
          }}
        />
        <ClaimViewModal open={viewId !== null} claimId={viewId} onClose={() => setViewId(null)} />
      </>
    </ConfigProvider>
  );
}

function fmt(d: any) {
  return d && dayjs.isDayjs(d) && d.isValid() ? d.format('DD.MM.YYYY') : '—';
}
