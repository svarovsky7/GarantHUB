import React from 'react';
import {
  Table,
  Select,
  Button,
  Tooltip,
  Popconfirm,
  Skeleton,
} from 'antd';
import MoneyInput from '@/shared/ui/MoneyInput';
import { formatRub } from '@/shared/utils/formatCurrency';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useLawsuitClaimTypes } from '@/entities/lawsuitClaimType';
import { useCaseClaims, useAddCaseClaims, useUpdateCaseClaim, useDeleteCaseClaim } from '@/entities/courtCaseClaim';
import type { CourtCaseClaim } from '@/shared/types/courtCaseClaim';

interface Props {
  caseId: number;
}

/**
 * Editable table of lawsuit claims for court case editing form.
 */
export default function CaseClaimsEditorTable({ caseId }: Props) {
  const { data: claimTypes = [], isPending: typesLoading } = useLawsuitClaimTypes();
  const { data: claims = [], isPending: claimsLoading } = useCaseClaims(caseId);
  const addClaim = useAddCaseClaims();
  const updateClaim = useUpdateCaseClaim();
  const deleteClaim = useDeleteCaseClaim();

  const totals = React.useMemo(() => {
    return claims.reduce(
      (acc, c) => {
        acc.claimed += Number(c.claimed_amount) || 0;
        acc.confirmed += Number(c.confirmed_amount) || 0;
        acc.paid += Number(c.paid_amount) || 0;
        acc.agreed += Number(c.agreed_amount) || 0;
        return acc;
      },
      { claimed: 0, confirmed: 0, paid: 0, agreed: 0 },
    );
  }, [claims]);

  const handleAdd = async () => {
    if (!claimTypes.length) return;
    await addClaim.mutateAsync([
      {
        case_id: caseId,
        claim_type_id: claimTypes[0].id,
        claimed_amount: null,
        confirmed_amount: null,
        paid_amount: null,
        agreed_amount: null,
      },
    ]);
  };

  const columns: ColumnsType<CourtCaseClaim> = [
    {
      title: 'Требование',
      dataIndex: 'claim_type_id',
      width: 280,
      render: (v: number, row) => (
        <Select
          size="small"
          style={{ width: '100%' }}
          loading={typesLoading}
          value={v}
          options={claimTypes.map((t) => ({ value: t.id, label: t.name }))}
          onChange={(val) => updateClaim.mutate({ id: row.id, updates: { claim_type_id: val } })}
        />
      ),
    },
    {
      title: 'Заявлено',
      dataIndex: 'claimed_amount',
      width: 150,
      render: (v: number | null, row) => (
        <MoneyInput
          min={0}
          style={{ width: '100%' }}
          value={v ?? undefined}
          onChange={(val) =>
            updateClaim.mutate({ id: row.id, updates: { claimed_amount: val ?? null } })
          }
        />
      ),
    },
    {
      title: 'Подтверждено',
      dataIndex: 'confirmed_amount',
      width: 150,
      render: (v: number | null, row) => (
        <MoneyInput
          min={0}
          style={{ width: '100%' }}
          value={v ?? undefined}
          onChange={(val) =>
            updateClaim.mutate({ id: row.id, updates: { confirmed_amount: val ?? null } })
          }
        />
      ),
    },
    {
      title: 'Оплачено',
      dataIndex: 'paid_amount',
      width: 150,
      render: (v: number | null, row) => (
        <MoneyInput
          min={0}
          style={{ width: '100%' }}
          value={v ?? undefined}
          onChange={(val) => updateClaim.mutate({ id: row.id, updates: { paid_amount: val ?? null } })}
        />
      ),
    },
    {
      title: 'Согласовано',
      dataIndex: 'agreed_amount',
      width: 150,
      render: (v: number | null, row) => (
        <MoneyInput
          min={0}
          style={{ width: '100%' }}
          value={v ?? undefined}
          onChange={(val) =>
            updateClaim.mutate({ id: row.id, updates: { agreed_amount: val ?? null } })
          }
        />
      ),
    },
    {
      title: '',
      dataIndex: 'actions',
      width: 60,
      render: (_: unknown, row) => (
        <Popconfirm
          title="Удалить требование?"
          okText="Да"
          cancelText="Нет"
          onConfirm={() => deleteClaim.mutate(row.id)}
        >
          <Tooltip title="Удалить">
            <Button size="small" type="text" danger icon={<DeleteOutlined />} />
          </Tooltip>
        </Popconfirm>
      ),
    },
  ];

  if (claimsLoading) {
    return <Skeleton active paragraph={{ rows: 3 }} />;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontWeight: 500 }}>Исковые требования</span>
        <Button type="dashed" icon={<PlusOutlined />} onClick={handleAdd}>
          Добавить требование
        </Button>
      </div>
      <Table
        size="small"
        pagination={false}
        rowKey="id"
        columns={columns}
        dataSource={claims}
        summary={() => (
          <Table.Summary.Row>
            <Table.Summary.Cell index={0}>Итого</Table.Summary.Cell>
            <Table.Summary.Cell index={1}>{formatRub(totals.claimed)}</Table.Summary.Cell>
            <Table.Summary.Cell index={2}>{formatRub(totals.confirmed)}</Table.Summary.Cell>
            <Table.Summary.Cell index={3}>{formatRub(totals.paid)}</Table.Summary.Cell>
            <Table.Summary.Cell index={4}>{formatRub(totals.agreed)}</Table.Summary.Cell>
            <Table.Summary.Cell index={5} />
          </Table.Summary.Row>
        )}
      />
    </div>
  );
}
