import React from "react";
import { Skeleton } from "@mui/material";
import { useProjects } from "@/entities/project";
import { useAllUnits } from "@/entities/unit";
import { useTicketsStats } from "@/entities/ticket";
import { useTicketTypes } from "@/entities/ticketType";
import { useAllCourtCases } from "@/entities/courtCase";
import { useLitigationStages } from "@/entities/litigationStage";
import { useContractors } from "@/entities/contractor";
import AdminDataGrid from "@/shared/ui/AdminDataGrid";

/**
 * Статистика по проектам, замечаниям и судебным делам.
 */
export default function StatsPage() {
  const { data: projects = [], isPending: loadingProjects } = useProjects();
  const { data: units = [], isPending: loadingUnits } = useAllUnits();
  const { data: tickets = [], isPending: loadingTickets } = useTicketsStats();
  const { data: ticketTypes = [] } = useTicketTypes();
  const { data: cases = [], isPending: loadingCases } = useAllCourtCases();
  const { data: stages = [] } = useLitigationStages();
  const { data: contractors = [] } = useContractors();

  const loading =
    loadingProjects || loadingUnits || loadingTickets || loadingCases;

  const projectMap = React.useMemo(() => {
    const map: Record<number, string> = {};
    projects.forEach((p) => {
      map[p.id] = p.name;
    });
    return map;
  }, [projects]);

  // ──────────── Dashboard 1: объекты по корпусам ────────────
  const unitsRows = React.useMemo(() => {
    const map: Record<string, { id: string; project: string; building: string; count: number }> = {};
    units.forEach((u) => {
      const project = projectMap[u.project_id] || "—";
      const building = u.building || "—";
      const key = `${project}-${building}`;
      if (!map[key]) {
        map[key] = { id: key, project, building, count: 0 };
      }
      map[key].count += 1;
    });
    return Object.values(map);
  }, [units, projectMap]);

  // ──────────── Dashboard 2: замечания по типам ────────────
  const typeMap = React.useMemo(() => {
    const m: Record<number, string> = {};
    ticketTypes.forEach((t) => {
      m[t.id] = t.name;
    });
    return m;
  }, [ticketTypes]);

  const ticketsRows = React.useMemo(() => {
    const map: Record<string, { id: string; project: string; type: string; total: number; warranty: number; fixed: number }> = {};
    tickets.forEach((t) => {
      const project = projectMap[t.project_id] || "—";
      const type = typeMap[t.type_id] || "—";
      const key = `${project}-${type}`;
      if (!map[key]) {
        map[key] = { id: key, project, type, total: 0, warranty: 0, fixed: 0 };
      }
      map[key].total += 1;
      if (t.is_warranty) map[key].warranty += 1;
      if (t.fixed_at) map[key].fixed += 1;
    });
    return Object.values(map);
  }, [tickets, projectMap, typeMap]);

  // ──────────── Dashboard 3: судебные дела ────────────
  const stageMap = React.useMemo(() => {
    const m: Record<number, string> = {};
    stages.forEach((s) => {
      m[s.id] = s.name;
    });
    return m;
  }, [stages]);

  const contractorMap = React.useMemo(() => {
    const m: Record<number, string> = {};
    contractors.forEach((c) => {
      m[c.id] = c.name;
    });
    return m;
  }, [contractors]);

  const casesRows = React.useMemo(() => {
    const map: Record<string, { id: string; project: string; status: string; contractor: string; total: number }> = {};
    cases.forEach((c) => {
      const project = projectMap[c.project_id] || "—";
      const status = stageMap[c.status] || "—";
      const contractor = contractorMap[c.defendant_id] || "—";
      const key = `${project}-${status}-${contractor}`;
      if (!map[key]) {
        map[key] = { id: key, project, status, contractor, total: 0 };
      }
      map[key].total += 1;
    });
    return Object.values(map);
  }, [cases, projectMap, stageMap, contractorMap]);

  if (loading) return <Skeleton variant="rectangular" height={160} />;

  return (
    <div>
      <AdminDataGrid
        title="Объекты по проектам"
        rows={unitsRows}
        columns={[
          { field: "project", headerName: "Проект", flex: 1 },
          { field: "building", headerName: "Корпус", flex: 1 },
          { field: "count", headerName: "Кол-во объектов", width: 150 },
        ]}
      />
      <AdminDataGrid
        title="Замечания по типам"
        rows={ticketsRows}
        columns={[
          { field: "project", headerName: "Проект", flex: 1 },
          { field: "type", headerName: "Тип", flex: 1 },
          { field: "total", headerName: "Всего", width: 100 },
          { field: "warranty", headerName: "Гарантийных", width: 120 },
          { field: "fixed", headerName: "Устранено", width: 110 },
        ]}
      />
      <AdminDataGrid
        title="Судебные дела"
        rows={casesRows}
        columns={[
          { field: "project", headerName: "Проект", flex: 1 },
          { field: "status", headerName: "Статус", flex: 1 },
          { field: "contractor", headerName: "Заказчик", flex: 1 },
          { field: "total", headerName: "Количество", width: 130 },
        ]}
      />
    </div>
  );
}
