// -----------------------------------------------------------------------------
// Страница «/tickets» – фильтры + таблица
// -----------------------------------------------------------------------------
import React, { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { ConfigProvider, Typography, Alert, Card, Button } from "antd";
import ruRU from "antd/locale/ru_RU";
import { useSnackbar } from "notistack";
import { useQueryClient } from "@tanstack/react-query";

import { useTickets, useLinkTickets, useUnlinkTicket } from "@/entities/ticket";
import { useUsers } from "@/entities/user";
import { useUnitsByIds } from "@/entities/unit";
import TicketsTable from "@/widgets/TicketsTable";
import TicketsFilters from "@/widgets/TicketsFilters";
import TicketFormAntd from "@/features/ticket/TicketFormAntd";
import TicketViewModal from "@/features/ticket/TicketViewModal";
import LinkTicketsDialog from "@/features/ticket/LinkTicketsDialog";
import ExportTicketsButton from "@/features/ticket/ExportTicketsButton";
import type { TicketWithNames } from "@/shared/types/ticketWithNames";
import { useNotify } from "@/shared/hooks/useNotify";
import { filterTickets } from "@/shared/utils/ticketFilter";

export default function TicketsPage() {
  const { enqueueSnackbar } = useSnackbar();
  const { data: tickets = [], isLoading, error } = useTickets();
  const linkTickets = useLinkTickets();
  const unlinkTicket = useUnlinkTicket();
  const notify = useNotify();
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
  const [linkFor, setLinkFor] = useState<any | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const hideOnScroll = React.useRef(false);

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
      const valid = arr.filter((tid) => tickets.some((t) => t.id === tid));
      setInitialFilters({ id: valid });
      setFilters((f) => ({ ...f, id: valid }));
    }
  }, [searchParams, tickets]);
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

  const ticketsWithNames: TicketWithNames[] = useMemo(
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

  const handleUnlink = (id: number) => {
    unlinkTicket.mutate(String(id), {
      onSuccess: () => notify.success('Замечание исключено из связи'),
    });
  };

  const handleLink = (ids: string[]) => {
    if (!linkFor) return;
    linkTickets.mutate(
      { parentId: String(linkFor.id), childIds: ids },
      {
        onSuccess: () => {
          notify.success('Замечания связаны');
          setLinkFor(null);
        },
      },
    );
  };

  const total = tickets.length;
  const closedCount = useMemo(() => tickets.filter((t) => t.isClosed).length, [tickets]);
  const openCount = total - closedCount;
  const readyToExport = useMemo(
    () => filterTickets(ticketsWithNames, filters).length,
    [ticketsWithNames, filters],
  );

  return (
    <ConfigProvider locale={ruRU}>
      <>
        <Button
          type="primary"
          onClick={() => setShowAddForm((p) => !p)}
          style={{ marginBottom: 16 }}
        >
          {showAddForm ? 'Скрыть форму' : 'Добавить замечание'}
        </Button>
        {showAddForm && (
          <Card style={{ marginBottom: 24 }}>
            <TicketFormAntd
              onCreated={() => {
                qc.invalidateQueries({ queryKey: ['tickets'] });
                hideOnScroll.current = true;
              }}
              initialValues={initialValues}
            />
          </Card>
        )}

        <LinkTicketsDialog
          open={!!linkFor}
          parent={linkFor}
          tickets={ticketsWithNames}
          onClose={() => setLinkFor(null)}
          onSubmit={handleLink}
        />
        <div
          onWheel={() => {
            if (hideOnScroll.current) {
              setShowAddForm(false);
              hideOnScroll.current = false;
            }
          }}
        >
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
                onAddChild={setLinkFor}
                onUnlink={handleUnlink}
              />
            )}
          </Card>
          <Typography.Text style={{ display: 'block', marginTop: 8 }}>
            Всего замечаний: {total}, из них закрытых: {closedCount} и не закрытых: {openCount}
          </Typography.Text>
          <Typography.Text style={{ display: 'block', marginTop: 4 }}>
            Готовых замечаний к выгрузке: {readyToExport}
          </Typography.Text>
          <div style={{ marginTop: 8 }}>
            <ExportTicketsButton tickets={ticketsWithNames} filters={filters} />
          </div>
        </div>
        <TicketViewModal
          open={viewId !== null}
          ticketId={viewId}
          onClose={() => setViewId(null)}
        />
      </>
    </ConfigProvider>
  );
}
