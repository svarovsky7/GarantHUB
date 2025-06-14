import React, { useMemo, useState } from 'react';
import { ConfigProvider, Card } from 'antd';
import ruRU from 'antd/locale/ru_RU';
import { useDefects } from '@/entities/defect';
import { useTicketsSimple } from '@/entities/ticket';
import { useUnitsByIds } from '@/entities/unit';
import DefectsTable from '@/widgets/DefectsTable';
import DefectsFilters from '@/widgets/DefectsFilters';
import DefectViewModal from '@/features/defect/DefectViewModal';
import type { DefectWithInfo } from '@/shared/types/defect';
import type { DefectFilters } from '@/shared/types/defectFilters';

export default function DefectsPage() {
  const { data: defects = [], isPending } = useDefects();
  const { data: tickets = [] } = useTicketsSimple();
  const unitIds = useMemo(
    () => Array.from(new Set(tickets.flatMap((t) => t.unit_ids || []))),
    [tickets],
  );
  const { data: units = [] } = useUnitsByIds(unitIds);

  const data: DefectWithInfo[] = useMemo(() => {
    const unitMap = new Map(units.map((u) => [u.id, u.name]));
    const ticketsMap = new Map<number, { id: number; unit_ids: number[] }[]>();
    tickets.forEach((t: any) => {
      (t.defect_ids || []).forEach((id: number) => {
        const arr = ticketsMap.get(id) || [];
        arr.push({ id: t.id, unit_ids: t.unit_ids || [] });
        ticketsMap.set(id, arr);
      });
    });
    return defects.map((d) => {
      const linked = ticketsMap.get(d.id) || [];
      const unitIds = Array.from(new Set(linked.flatMap((l) => l.unit_ids)));
      const unitNames = unitIds
        .map((id) => unitMap.get(id))
        .filter(Boolean)
        .join(', ');
      return {
        ...d,
        ticketIds: linked.map((l) => l.id),
        unitIds,
        unitNames,
      } as DefectWithInfo;
    });
  }, [defects, tickets, units]);

  const options = useMemo(() => {
    const uniq = (arr: any[], key: string) =>
      Array.from(new Set(arr.map((i) => i[key]).filter(Boolean))).map((v) => ({
        label: String(v),
        value: v,
      }));
    return {
      ids: uniq(data, 'id'),
      tickets: uniq(data.flatMap((d) => d.ticketIds.map((t) => ({ ticket: t }))), 'ticket').map((o) => ({ label: o.label, value: Number(o.label) })),
      units: units.map((u) => ({ label: u.name, value: u.id })),
    };
  }, [data, units]);

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
