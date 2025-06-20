import React from 'react';
import {
  Table,
  Form,
  Select,
  InputNumber,
  Button,
  Tooltip,
  Skeleton,
  Typography,
} from 'antd';
import { formatRub, parseRub } from '@/shared/utils/formatCurrency';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useLawsuitClaimTypes } from '@/entities/lawsuitClaimType';

/**
 * Editable table of lawsuit claims used inside court case form.
 */
interface Props {
  fields: any[];
  add: (defaultValue?: any) => void;
  remove: (index: number) => void;
}

export default function CourtCaseClaimsTable({ fields, add, remove }: Props) {
  const { data: claimTypes = [], isPending: loading } = useLawsuitClaimTypes();
  const form = Form.useFormInstance();

  const claims: any[] = Form.useWatch('claims', form) || [];
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

  const columns: ColumnsType<any> = [
    {
      title: 'Требование',
      dataIndex: 'type',
      width: 280,
      render: (_: unknown, field: any) => (
        <Form.Item name={[field.name, 'claim_type_id']} rules={[{ required: true, message: 'Выберите вид' }]} noStyle>
          <Select options={claimTypes.map((t) => ({ value: t.id, label: t.name }))} />
        </Form.Item>
      ),
    },
    {
      title: 'Заявлено',
      dataIndex: 'claimed',
      width: 150,
      render: (_: unknown, field: any) => (
        <Form.Item name={[field.name, 'claimed_amount']} noStyle>
          <InputNumber
            min={0}
            style={{ width: '100%' }}
            formatter={(v) => formatRub(Number(v))}
            parser={parseRub}
          />
        </Form.Item>
      ),
    },
    {
      title: 'Подтверждено',
      dataIndex: 'confirmed',
      width: 150,
      render: (_: unknown, field: any) => (
        <Form.Item name={[field.name, 'confirmed_amount']} noStyle>
          <InputNumber
            min={0}
            style={{ width: '100%' }}
            formatter={(v) => formatRub(Number(v))}
            parser={parseRub}
          />
        </Form.Item>
      ),
    },
    {
      title: 'Оплачено',
      dataIndex: 'paid',
      width: 150,
      render: (_: unknown, field: any) => (
        <Form.Item name={[field.name, 'paid_amount']} noStyle>
          <InputNumber
            min={0}
            style={{ width: '100%' }}
            formatter={(v) => formatRub(Number(v))}
            parser={parseRub}
          />
        </Form.Item>
      ),
    },
    {
      title: 'Согласовано',
      dataIndex: 'agreed',
      width: 150,
      render: (_: unknown, field: any) => (
        <Form.Item name={[field.name, 'agreed_amount']} noStyle>
          <InputNumber
            min={0}
            style={{ width: '100%' }}
            formatter={(v) => formatRub(Number(v))}
            parser={parseRub}
          />
        </Form.Item>
      ),
    },
    {
      title: '',
      dataIndex: 'actions',
      width: 60,
      render: (_: unknown, field: any) => (
        <Tooltip title="Удалить">
          <Button size="small" type="text" danger icon={<DeleteOutlined />} onClick={() => remove(field.name)} />
        </Tooltip>
      ),
    },
  ];

  if (loading) {
    return <Skeleton active paragraph={{ rows: 3 }} />;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontWeight: 500 }}>Исковые требования</span>
        <Button type="dashed" icon={<PlusOutlined />} onClick={() => add({})}>
          Добавить требование
        </Button>
      </div>
      <Table
        size="small"
        pagination={false}
        rowKey="key"
        columns={columns}
        dataSource={fields}
        summary={() => (
          <Table.Summary.Row>
            <Table.Summary.Cell index={0}>
              <Typography.Text strong>Итого</Typography.Text>
            </Table.Summary.Cell>
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
