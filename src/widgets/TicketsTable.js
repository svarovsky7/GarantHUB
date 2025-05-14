// -----------------------------------------------------------------------------
// Ant Design Table – добавлена колонка «Прошло дней»
// -----------------------------------------------------------------------------
import React, { useMemo } from 'react';
import dayjs from 'dayjs';
import {
    Table, Tooltip, Space, Button, Popconfirm, Tag, Skeleton,
} from 'antd';
import {
    EditOutlined,
    DeleteOutlined,
    CheckCircleTwoTone,
    CloseCircleTwoTone,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { message } from 'antd';

import { useDeleteTicket } from '@/entities/ticket';

/* ---------- helpers ---------- */
const fmt = (d, withTime = false) =>
    d && dayjs.isDayjs(d) && d.isValid()
        ? d.format(withTime ? 'DD.MM.YYYY HH:mm' : 'DD.MM.YYYY')
        : '—';

const daysPassed = (receivedAt) =>
    receivedAt && dayjs.isDayjs(receivedAt) && receivedAt.isValid()
        ? dayjs().diff(receivedAt, 'day') + 1 // +1, т.к. «включительно»
        : null;

/* ---------- фильтрация ---------- */
const applyFilters = (rows, f) =>
    rows.filter((r) => {
        if (f.ticketId && String(r.id) !== String(f.ticketId)) return false;

        if (f.period && f.period.length === 2) {
            const [from, to] = f.period;
            if (!r.receivedAt) return false;
            if (r.receivedAt.isBefore(from, 'day') || r.receivedAt.isAfter(to, 'day'))
                return false;
        }
        if (f.project && r.projectName !== f.project) return false;
        if (f.unit && r.unitName !== f.unit) return false;
        if (f.warranty) {
            const want = f.warranty === 'yes';
            if (r.isWarranty !== want) return false;
        }
        if (f.status && r.statusName !== f.status) return false;
        if (f.type && r.typeName !== f.type) return false;
        if (f.author && r.createdByName !== f.author) return false;
        return true;
    });

export default function TicketsTable({ tickets, filters, loading }) {
    const navigate                           = useNavigate();
    const { mutateAsync: remove, isPending } = useDeleteTicket();

    /* ---------- колонки ---------- */
    const columns = useMemo(() => [
        {
            title : 'Номер замечания',
            dataIndex: 'id',
            width : 100,
            sorter: (a, b) => a.id - b.id,
        },
        {
            title : 'Дата получения',
            dataIndex: 'receivedAt',
            width : 140,
            defaultSortOrder: 'descend',
            sorter: (a, b) =>
                (a.receivedAt ? a.receivedAt.valueOf() : 0) -
                (b.receivedAt ? b.receivedAt.valueOf() : 0),
            render: (v) => fmt(v),
        },
        {
            title : 'Прошло дней',
            dataIndex: 'days',
            width : 120,
            sorter: (a, b) => (a.days ?? -1) - (b.days ?? -1),
        },
        {
            title : 'Дата устранения',
            dataIndex: 'fixedAt',
            width : 140,
            sorter: (a, b) =>
                (a.fixedAt ? a.fixedAt.valueOf() : 0) -
                (b.fixedAt ? b.fixedAt.valueOf() : 0),
            render: (v) => fmt(v),
        },
        {
            title : 'Проект',
            dataIndex: 'projectName',
            width : 180,
            sorter: (a, b) => a.projectName.localeCompare(b.projectName),
        },
        {
            title : 'Объект',
            dataIndex: 'unitName',
            width : 160,
            sorter: (a, b) => a.unitName.localeCompare(b.unitName),
        },
        {
            title : 'Статус',
            dataIndex: 'statusName',
            width : 140,
            sorter: (a, b) => a.statusName.localeCompare(b.statusName),
        },
        {
            title : 'Гарантия',
            dataIndex: 'isWarranty',
            width : 110,
            sorter: (a, b) => Number(a.isWarranty) - Number(b.isWarranty),
            render: (v) =>
                v ? (
                    <Tag icon={<CheckCircleTwoTone twoToneColor="#52c41a" />} color="success">
                        Да
                    </Tag>
                ) : (
                    <Tag icon={<CloseCircleTwoTone twoToneColor="#eb2f96" />} color="default">
                        Нет
                    </Tag>
                ),
        },
        {
            title : 'Тип замечания',
            dataIndex: 'typeName',
            width : 160,
            sorter: (a, b) => a.typeName.localeCompare(b.typeName),
        },
        {
            title : 'Действия',
            key   : 'actions',
            width : 100,
            render: (_, record) => (
                <Space size="middle">
                    <Tooltip title="Редактировать">
                        <Button
                            size="small"
                            type="text"
                            icon={<EditOutlined />}
                            onClick={() => navigate(`/tickets/${record.id}/edit`)}
                        />
                    </Tooltip>

                    <Popconfirm
                        title="Удалить замечание?"
                        okText="Да"
                        cancelText="Нет"
                        onConfirm={async () => {
                            await remove(record.id);
                            message.success('Удалено');
                        }}
                        disabled={isPending}
                    >
                        <Button
                            size="small"
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                            loading={isPending}
                        />
                    </Popconfirm>
                </Space>
            ),
        },
    ], [navigate, remove, isPending]);

    /* ---------- datasource с фильтрами и расчётом days ---------- */
    const dataSource = useMemo(
        () =>
            applyFilters(tickets, filters).map((t) => ({
                ...t,
                receivedAt: t.receivedAt,
                fixedAt   : t.fixedAt,
                days      : daysPassed(t.receivedAt),
            })),
        [tickets, filters],
    );

    if (loading) return <Skeleton active paragraph={{ rows: 6 }} />;

    return (
        <Table
            rowKey="id"
            columns={columns}
            dataSource={dataSource}
            loading={isPending}
            pagination={{ pageSize: 25, showSizeChanger: true }}
            size="middle"
        />
    );
}
