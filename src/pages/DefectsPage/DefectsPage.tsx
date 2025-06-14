import React, { useMemo, useState } from 'react';
import { ConfigProvider, Card } from 'antd';
import ruRU from 'antd/locale/ru_RU';
import { useDefects } from '@/entities/defect';
import { useTicketsSimple } from '@/entities/ticket';
import { useProjects } from '@/entities/project';
import { useUnitsByIds } from '@/entities/unit';
import DefectsTable from '@/widgets/DefectsTable';
import DefectsFilters from '@/widgets/DefectsFilters';
import DefectViewModal from '@/features/defect/DefectViewModal';
import type { DefectWithInfo } from '@/shared/types/defect';
import type { DefectFilters } from '@/shared/types/defectFilters';

export default function DefectsPage() {
  const { data: defects = [], isPending } = useDefects();
  const { data: tickets = [] } = useTicketsSimple();
  const { data: projects = [] } = useProjects();
  const unitIds = useMemo(
    () => Array.from(new Set(tickets.flatMap((t) => t.unit_ids || []))),
    [tickets],
  );
  const { data: units = [] } = useUnitsByIds(unitIds);

  const data: DefectWithInfo[] = useMemo(() => {
    const projectMap = new Map(projects.map((p) => [p.id, p.name]));
    const unitMap = new Map(units.map((u) => [u.id, u.name]));
    const ticketsMap = new Map<number, { id: number; unit_ids: number[]; project_id: number }[]>();
    tickets.forEach((t: any) => {
      (t.defect_ids || []).forEach((id: number) => {
        const arr = ticketsMap.get(id) || [];
        arr.push({ id: t.id, unit_ids: t.unit_ids || [], project_id: t.project_id });
        ticketsMap.set(id, arr);
      });
    });
    return defects.map((d) => {
      const linked = ticketsMap.get(d.id) || [];
      const unitIds = Array.from(new Set(linked.flatMap((l) => l.unit_ids)));
      const projectIds = Array.from(new Set(linked.map((l) => l.project_id)));
      const unitNames = unitIds
        .map((id) => unitMap.get(id))
        .filter(Boolean)
        .join(', ');
      const projectName = projectIds
        .map((id) => projectMap.get(id))
        .filter(Boolean)
        .join(', ');
      return {
        ...d,
        ticketIds: linked.map((l) => l.id),
        unitIds,
        projectIds,
        projectName,
        unitNames,
      } as DefectWithInfo;
    });
  }, [defects, tickets, projects, units]);

  const options = useMemo(() => {
    const uniq = (arr: any[], key: string) =>
      Array.from(new Set(arr.map((i) => i[key]).filter(Boolean))).map((v) => ({
        label: String(v),
        value: v,
      }));
    return {
      ids: uniq(data, 'id'),
      tickets: uniq(data.flatMap((d) => d.ticketIds.map((t) => ({ ticket: t }))), 'ticket').map((o) => ({ label: o.label, value: Number(o.label) })),
      projects: projects.map((p) => ({ label: p.name, value: p.id })),
      units: units.map((u) => ({ label: u.name, value: u.id })),
    };
  }, [data, projects, units]);

  const [filters, setFilters] = useState<DefectFilters>({});
  const [viewId, setViewId] = useState<number | null>(null);

  return (
    <ConfigProvider locale={ruRU}>
      <Card style={{ marginBottom: 24 }}>
        <DefectsFilters options={options} onChange={setFilters} />
      </Card>
      <DefectsTable defects={data} filters={filters} loading={isPending} onView={setViewId} />
      <DefectViewModal open={viewId !== null} defectId={viewId} onClose={() => setViewId(null)} />
    </ConfigProvider>
  );
}
