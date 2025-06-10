// -----------------------------------------------------------------------------
// Страница «/tickets» – фильтры + таблица
// -----------------------------------------------------------------------------
import React, { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { ConfigProvider, Typography, Alert, Card } from "antd";
import ruRU from "antd/locale/ru_RU";
import { useSnackbar } from "notistack";
import { useQueryClient } from "@tanstack/react-query";

import { useTickets } from "@/entities/ticket";
import { useUsers } from "@/entities/user";
import { useUnitsByIds } from "@/entities/unit";
import TicketsTable from "@/widgets/TicketsTable";
import TicketsFilters from "@/widgets/TicketsFilters";
import TicketFormAntd from "@/features/ticket/TicketFormAntd";
import TicketViewModal from "@/features/ticket/TicketViewModal";

export default function TicketsPage() {
  const { enqueueSnackbar } = useSnackbar();
  const { data: tickets = [], isLoading, error } = useTickets();
  const { data: users = [] } = useUsers();
  const unitIds = useMemo(
    () => Array.from(new Set(tickets.flatMap((t) => t.unitIds))),
    [tickets],
  );
  const { data: units = [] } = useUnitsByIds(unitIds);
  const qc = useQueryClient();
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState({});
  const [initialFilters, setInitialFilters] = useState({});
  const [viewId, setViewId] = useState<number | null>(null);

  React.useEffect(() => {
    const id = searchParams.get('ticket_id');
    if (id) {
      setViewId(Number(id));
    }
    const ids = searchParams.get('ids');
    if (ids) {
      const arr = ids
        .split(',')
        .map((v) => Number(v))
        .filter(Boolean);
      setInitialFilters({ id: arr });
      setFilters((f) => ({ ...f, id: arr }));
    }
  }, [searchParams]);
  const initialValues = {
    project_id: searchParams.get('project_id')
      ? Number(searchParams.get('project_id')!)
      : undefined,
    unit_ids: searchParams.get('unit_id')
      ? [Number(searchParams.get('unit_id')!)]
      : undefined,
    responsible_engineer_id:
      searchParams.get('responsible_engineer_id') || undefined,
  };

  /* toast api-ошибки */
  React.useEffect(() => {
    if (error) enqueueSnackbar(error.message, { variant: "error" });
  }, [error, enqueueSnackbar]);

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
      map[u.id] = u.name;
    });
    return map;
  }, [units]);

  const ticketsWithNames = useMemo(
    () =>
      tickets.map((t) => ({
        ...t,
        unitNames: t.unitIds
          .map((id) => unitMap[id])
          .filter(Boolean)
          .join(', '),
        responsibleEngineerName: userMap[t.responsibleEngineerId] ?? null,
        createdByName: userMap[t.createdBy] ?? null,
      })),
    [tickets, userMap, unitMap],
  );

  /* списки для <Select> (уникальные значения) */
  const options = useMemo(() => {
    const uniq = (arr, key) =>
      Array.from(new Set(arr.map((i) => i[key]).filter(Boolean))).map((v) => ({
        label: v,
        value: v,
      }));
    return {
      projects: uniq(ticketsWithNames, "projectName"),
      units: uniq(ticketsWithNames, "unitNames"),
      statuses: uniq(ticketsWithNames, "statusName"),
      types: uniq(ticketsWithNames, "typeName"),
      responsibleEngineers: uniq(ticketsWithNames, "responsibleEngineerName"),
      ids: uniq(ticketsWithNames, "id"),
    };
  }, [ticketsWithNames]);

  return (
    <ConfigProvider locale={ruRU}>
      <>
        <Typography.Title level={4} style={{ marginBottom: 16 }}>Замечания</Typography.Title>

        <Card style={{ marginBottom: 24 }}>
          <TicketFormAntd
            onCreated={() => qc.invalidateQueries({ queryKey: ['tickets'] })}
            initialValues={initialValues}
          />
        </Card>

        <Card style={{ marginBottom: 24 }}>
          <TicketsFilters
            options={options}
            onChange={setFilters}
            initialValues={initialFilters}
          />
        </Card>

        <Card>
          {error ? (
            <Alert type="error" message={error.message} />
          ) : (
            <TicketsTable
              tickets={ticketsWithNames}
              filters={filters}
              loading={isLoading}
              onView={(id) => setViewId(id)}
            />
          )}
        </Card>
        <TicketViewModal
          open={viewId !== null}
          ticketId={viewId}
          onClose={() => setViewId(null)}
        />
      </>
    </ConfigProvider>
  );
}
