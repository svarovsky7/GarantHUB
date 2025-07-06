import React from 'react';
import dayjs from 'dayjs';
import { Table, Switch, Space, Typography, Button } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { DownOutlined, EyeOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabaseClient';
import { useDefectsWithNames } from '@/entities/defect';
import ClaimViewModal from '@/features/claim/ClaimViewModal';
import DefectsCompactTable from '@/widgets/DefectsCompactTable';

interface ClaimRow {
  id: number;
  claim_no: string;
  claimed_on: string | null;
  statusName: string | null;
  unit_ids: number[];
  defect_ids: number[];
}

interface Props {
  projectId: number | null;
  unitIds: number[];
  value: number[];
  onChange: (ids: number[]) => void;
}

function ClaimDefects({ ids }: { ids: number[] }) {
  const { data = [], isPending } = useDefectsWithNames(ids);
  if (!ids.length) {
    return <Typography.Text type="secondary">Нет дефектов</Typography.Text>;
  }
  if (isPending) {
    return <Typography.Text>Загрузка...</Typography.Text>;
  }
  return <DefectsCompactTable defects={data} />;
}

export default function RelatedClaimsList({
  projectId,
  unitIds,
  value,
  onChange,
}: Props) {
  const { data: claims = [], isPending } = useQuery<ClaimRow[]>({
    queryKey: ['claims-for-case-list', projectId],
    enabled: !!projectId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('claims')
        .select(
          `id, claim_no, claimed_on, claim_status_id, statuses(name), claim_units(unit_id), claim_defects(defect_id)`
        )
        .eq('project_id', projectId as number);
      if (error) throw error;
      return (data ?? []).map((r: any) => ({
        id: r.id,
        claim_no: r.claim_no,
        claimed_on: r.claimed_on,
        statusName: r.statuses?.name ?? null,
        unit_ids: (r.claim_units ?? []).map((u: any) => u.unit_id),
        defect_ids: (r.claim_defects ?? []).map((d: any) => d.defect_id),
      }));
    },
  });

  const [onlyObject, setOnlyObject] = React.useState(false);
  const [viewId, setViewId] = React.useState<number | null>(null);

  const filtered = React.useMemo(() => {
    if (!onlyObject) return claims;
    return claims.filter((c) =>
      c.unit_ids.some((u) => unitIds.includes(u))
    );
  }, [claims, onlyObject, unitIds]);

  const columns: ColumnsType<ClaimRow> = [
    { title: '№ претензии', dataIndex: 'claim_no', width: 120 },
    {
      title: 'Дата претензии',
      dataIndex: 'claimed_on',
      width: 120,
      render: (v: string | null) => (v ? dayjs(v).format('DD.MM.YYYY') : '—'),
    },
    {
      title: 'Статус',
      dataIndex: 'statusName',
      width: 160,
      render: (v: string | null) => v || '—',
    },
    {
      title: '',
      dataIndex: 'actions',
      width: 60,
      render: (_: any, row) => (
        <Button
          size="small"
          type="text"
          icon={<EyeOutlined />}
          onClick={() => setViewId(row.id)}
        />
      ),
    },
  ];

  return (
    <>
      <Space style={{ marginBottom: 8 }} align="center">
        <Typography.Text>Только выбранный объект</Typography.Text>
        <Switch checked={onlyObject} onChange={setOnlyObject} />
      </Space>
      <Table<ClaimRow>
        rowKey="id"
        columns={columns}
        dataSource={filtered}
        loading={isPending}
        pagination={false}
        size="small"
        rowSelection={{
          selectedRowKeys: value,
          onChange: (keys) => onChange(keys as number[]),
        }}
        expandable={{
          columnWidth: 40,
          expandIcon: ({ expanded, onExpand, record }) => (
            <DownOutlined
              rotate={expanded ? 180 : 0}
              onClick={(e) => onExpand(record, e)}
              style={{ cursor: 'pointer' }}
            />
          ),
          expandedRowRender: (row) => (
            <ClaimDefects ids={row.defect_ids} />
          ),
          rowExpandable: (row) => row.defect_ids.length > 0,
        }}
      />
      <ClaimViewModal
        open={viewId !== null}
        claimId={viewId}
        onClose={() => setViewId(null)}
      />
    </>
  );
}
