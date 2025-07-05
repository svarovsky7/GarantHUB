import React from 'react';
import {
  Table,
  Form,
  Select,
  Button,
  Tooltip,
  Skeleton,
  Typography,
} from 'antd';
import { formatRub } from '@/shared/utils/formatCurrency';
import RubInput from '@/shared/ui/RubInput';
import { PlusOutlined, DeleteOutlined, UpOutlined, DownOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useLawsuitClaimTypes } from '@/entities/lawsuitClaimType';

/**
 * Editable table of lawsuit claims used inside court case form.
 */
interface Props {
  fields: any[];
  add: (defaultValue?: any) => void;
  remove: (index: number) => void;
  move: (from: number, to: number) => void;
}

export default function CourtCaseClaimsTable({
  fields,
  add,
  remove,
  move,
}: Props) {
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
      title: '№',
      dataIndex: 'index',
      width: 60,
      align: 'center' as const,
      render: (_: unknown, __: any, idx: number) => idx + 1,
    },
    {
      title: 'Требование',
      dataIndex: 'type',
      width: 280,
      render: (_: unknown, field: any) => (
        <Form.Item name={[field.name, 'claim_type_id']} rules={[{ required: true, message: 'Выберите вид' }]} noStyle>
          <Select
            style={{ width: '100%' }}
            options={claimTypes.map((t) => ({ value: t.id, label: t.name }))}
          />
        </Form.Item>
      ),
    },
    {
      title: 'Заявлено',
      dataIndex: 'claimed',
      width: 150,
      render: (_: unknown, field: any) => (
        <Form.Item name={[field.name, 'claimed_amount']} noStyle>
          <RubInput />
        </Form.Item>
      ),
    },
    {
      title: 'Подтверждено',
      dataIndex: 'confirmed',
      width: 150,
      render: (_: unknown, field: any) => (
        <Form.Item name={[field.name, 'confirmed_amount']} noStyle>
          <RubInput />
        </Form.Item>
      ),
    },
    {
      title: 'Оплачено',
      dataIndex: 'paid',
      width: 150,
      render: (_: unknown, field: any) => (
        <Form.Item name={[field.name, 'paid_amount']} noStyle>
          <RubInput />
        </Form.Item>
      ),
    },
    {
      title: 'Согласовано',
      dataIndex: 'agreed',
      width: 150,
      render: (_: unknown, field: any) => (
        <Form.Item name={[field.name, 'agreed_amount']} noStyle>
          <RubInput />
        </Form.Item>
      ),
    },
    {
      title: '',
      dataIndex: 'actions',
      width: 90,
      render: (_: unknown, field: any) => (
        <>
          <Button
            size="small"
            type="text"
            icon={<UpOutlined />}
            disabled={field.name === 0}
            onClick={() => move(field.name, field.name - 1)}
          />
          <Button
            size="small"
            type="text"
            icon={<DownOutlined />}
            disabled={field.name === fields.length - 1}
            onClick={() => move(field.name, field.name + 1)}
          />
          <Tooltip title="Удалить">
            <Button
              size="small"
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={() => remove(field.name)}
            />
          </Tooltip>
        </>
      ),
    },
  ];

  if (loading) {
    return <Skeleton active paragraph={{ rows: 3 }} />;
  }

  return (
    <div style={{ maxWidth: 1040 }}>
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
            <Table.Summary.Cell index={0} />
            <Table.Summary.Cell index={1}>
              <Typography.Text strong>Итого</Typography.Text>
            </Table.Summary.Cell>
            <Table.Summary.Cell index={2}>{formatRub(totals.claimed)}</Table.Summary.Cell>
            <Table.Summary.Cell index={3}>{formatRub(totals.confirmed)}</Table.Summary.Cell>
            <Table.Summary.Cell index={4}>{formatRub(totals.paid)}</Table.Summary.Cell>
            <Table.Summary.Cell index={5}>{formatRub(totals.agreed)}</Table.Summary.Cell>
            <Table.Summary.Cell index={6} />
          </Table.Summary.Row>
        )}
      />
    </div>
  );
}
