// src/widgets/TicketsTable.js

import React, { useMemo } from "react";
import dayjs from "dayjs";
import {
  Table,
  Tooltip,
  Space,
  Button,
  Popconfirm,
  Tag,
  Skeleton,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  EyeOutlined,
  DeleteOutlined,
  CheckCircleTwoTone,
  CloseCircleTwoTone,
} from "@ant-design/icons";

import { useDeleteTicket } from "@/entities/ticket";
import TicketStatusSelect from "@/features/ticket/TicketStatusSelect";
import TicketClosedSelect from "@/features/ticket/TicketClosedSelect";

/** Форматирование даты */
const fmt = (d, withTime = false) =>
  d && dayjs.isDayjs(d) && d.isValid()
    ? d.format(withTime ? "DD.MM.YYYY HH:mm" : "DD.MM.YYYY")
    : "—";

const daysPassed = (receivedAt) =>
  receivedAt && dayjs.isDayjs(receivedAt) && receivedAt.isValid()
    ? dayjs().diff(receivedAt, "day") + 1 // +1, т.к. «включительно»
    : null;

/** Фильтрация по фильтрам */
const applyFilters = (rows, f) =>
  rows.filter((r) => {
    if (f.hideClosed && r.isClosed) return false;
    const days = daysPassed(r.receivedAt);
    if (f.period && f.period.length === 2) {
      const [from, to] = f.period;
      if (!r.receivedAt) return false;
      if (r.receivedAt.isBefore(from, "day") || r.receivedAt.isAfter(to, "day"))
        return false;
    }
    if (f.requestPeriod && f.requestPeriod.length === 2) {
      const [from, to] = f.requestPeriod;
      if (!r.customerRequestDate) return false;
      if (
        r.customerRequestDate.isBefore(from, "day") ||
        r.customerRequestDate.isAfter(to, "day")
      )
        return false;
    }
    if (f.requestNo && r.customerRequestNo !== f.requestNo) return false;
    if (f.project && r.projectName !== f.project) return false;
    if (Array.isArray(f.units) && f.units.length > 0) {
      const rowUnits = r.unitNames.split(',').map((u) => u.trim());
      const hasMatch = f.units.some((u) => rowUnits.includes(u));
      if (!hasMatch) return false;
    }
    if (f.warranty) {
      const want = f.warranty === "yes";
      if (r.isWarranty !== want) return false;
    }
    if (f.status && r.statusName !== f.status) return false;
    if (f.type && r.typeName !== f.type) return false;
    if (f.responsible && r.responsibleEngineerName !== f.responsible)
      return false;
    return true;
  });

/**
 * Таблица замечаний
 * @param {Array} tickets - массив замечаний
 * @param {Object} filters - активные фильтры
 * @param {boolean} loading - индикатор загрузки
 */
export default function TicketsTable({ tickets, filters, loading, onView }) {
  const { mutateAsync: remove, isPending } = useDeleteTicket();

  const columns: ColumnsType<any> = useMemo(
    () => [
      {
        title: "Проект",
        dataIndex: "projectName",
        width: 180,
        sorter: (a, b) => a.projectName.localeCompare(b.projectName),
      },
      {
        title: "Объекты",
        dataIndex: "unitNames",
        width: 160,
        sorter: (a, b) => a.unitNames.localeCompare(b.unitNames),
      },
      {
        title: "Гарантия",
        dataIndex: "isWarranty",
        width: 110,
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
        title: "Статус",
        dataIndex: "statusId",
        width: 160,
        sorter: (a, b) => a.statusName.localeCompare(b.statusName),
        render: (_, row) => (
          <TicketStatusSelect
            ticketId={row.id}
            statusId={row.statusId}
            statusColor={row.statusColor}
            statusName={row.statusName}
          />
        ),
      },
      {
        title: "Замечание закрыто",
        dataIndex: "isClosed",
        width: 160,
        sorter: (a, b) => Number(a.isClosed) - Number(b.isClosed),
        render: (_, row) => (
          <TicketClosedSelect ticketId={row.id} isClosed={row.isClosed} />
        ),
      },
      {
        title: "Тип замечания",
        dataIndex: "typeName",
        width: 160,
        sorter: (a, b) => a.typeName.localeCompare(b.typeName),
      },
      {
        title: "Прошло дней с Даты получения",
        dataIndex: "days",
        width: 120,
        sorter: (a, b) => (a.days ?? -1) - (b.days ?? -1),
      },
      {
        title: "Дата получения",
        dataIndex: "receivedAt",
        width: 140,
        defaultSortOrder: "descend" as const,
        sorter: (a, b) =>
          (a.receivedAt ? a.receivedAt.valueOf() : 0) -
          (b.receivedAt ? b.receivedAt.valueOf() : 0),
        render: (v) => fmt(v),
      },
      {
        title: "Дата устранения",
        dataIndex: "fixedAt",
        width: 140,
        sorter: (a, b) =>
          (a.fixedAt ? a.fixedAt.valueOf() : 0) -
          (b.fixedAt ? b.fixedAt.valueOf() : 0),
        render: (v) => fmt(v),
      },
      {
        title: "№ заявки от Заказчика",
        dataIndex: "customerRequestNo",
        width: 160,
        sorter: (a, b) =>
          (a.customerRequestNo || "").localeCompare(b.customerRequestNo || ""),
      },
      {
        title: "Дата заявки Заказчика",
        dataIndex: "customerRequestDate",
        width: 160,
        sorter: (a, b) =>
          (a.customerRequestDate ? a.customerRequestDate.valueOf() : 0) -
          (b.customerRequestDate ? b.customerRequestDate.valueOf() : 0),
        render: (v) => fmt(v),
      },
      {
        title: "Ответственный инженер",
        dataIndex: "responsibleEngineerName",
        width: 180,
        sorter: (a, b) =>
          (a.responsibleEngineerName || "").localeCompare(b.responsibleEngineerName || ""),
      },
      {
        title: "Действия",
        key: "actions",
        width: 100,
        render: (_, record) => (
          <Space size="middle">
            <Tooltip title="Просмотр">
              <Button
                size="small"
                type="text"
                icon={<EyeOutlined />}
                onClick={() => onView && onView(record.id)}
              />
            </Tooltip>
            <Popconfirm
              title="Удалить замечание?"
              okText="Да"
              cancelText="Нет"
              onConfirm={async () => {
                await remove(record.id);
                message.success("Удалено");
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

  const dataSource = useMemo(
    () =>
      applyFilters(tickets, filters).map((t) => ({
        ...t,
        receivedAt: t.receivedAt,
        fixedAt: t.fixedAt,
        customerRequestDate: t.customerRequestDate,
        customerRequestNo: t.customerRequestNo,
        createdByName: t.createdByName,
        responsibleEngineerName: t.responsibleEngineerName,
        days: daysPassed(t.receivedAt),
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
