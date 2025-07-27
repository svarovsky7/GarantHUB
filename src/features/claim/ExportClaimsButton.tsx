import React from 'react';
import { Button, Tooltip, message } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import dayjs from 'dayjs';
import type { ClaimWithNames } from '@/shared/types/claimWithNames';
import { useClaimsAllLegacy } from '@/entities/claim';
import { useUsers } from '@/entities/user';
import { useUnitsByIds } from '@/entities/unit';
import { useVisibleProjects } from '@/entities/project';
import { useClaimStatuses } from '@/entities/claimStatus';
import formatUnitShortName from '@/shared/utils/formatUnitShortName';
import { naturalCompare } from '@/shared/utils/naturalSort';

export interface ExportClaimsButtonProps {
  claims: ClaimWithNames[];
  useAllData?: boolean;
}

export default function ExportClaimsButton({ claims, useAllData = false }: ExportClaimsButtonProps) {
  const [loading, setLoading] = React.useState(false);
  
  // Хуки для получения всех данных, если необходимо
  const allClaimsQuery = useClaimsAllLegacy();
  const { data: users = [] } = useUsers();
  const { data: projects = [] } = useVisibleProjects();
  const { data: statuses = [] } = useClaimStatuses();
  
  // Получить unit IDs из всех претензий
  const allUnitIds = React.useMemo(() => {
    if (!useAllData || !allClaimsQuery.data) return [];
    return Array.from(new Set(allClaimsQuery.data.flatMap((c) => c.unit_ids)));
  }, [useAllData, allClaimsQuery.data]);
  
  const { data: allUnits = [] } = useUnitsByIds(allUnitIds);

  // Мемоизированные карты для маппинга данных
  const userMap = React.useMemo(() => {
    const map = {} as Record<string, string>;
    users.forEach((u) => (map[u.id] = u.name));
    return map;
  }, [users]);

  const projectMap = React.useMemo(() => {
    const map = {} as Record<number, string>;
    projects.forEach((p) => (map[p.id] = p.name));
    return map;
  }, [projects]);

  const unitMap = React.useMemo(() => {
    const map = {} as Record<number, string>;
    allUnits.forEach((u) => (map[u.id] = u.name));
    return map;
  }, [allUnits]);

  const unitNumberMap = React.useMemo(() => {
    const map = {} as Record<number, string>;
    allUnits.forEach((u) => (map[u.id] = formatUnitShortName({ name: u.name, floor: u.floor })));
    return map;
  }, [allUnits]);

  const buildingMap = React.useMemo(() => {
    const map = {} as Record<number, string>;
    allUnits.forEach((u) => {
      if (u.building) map[u.id] = u.building;
    });
    return map;
  }, [allUnits]);

  const statusMap = React.useMemo(() => {
    const map = {} as Record<number, { name: string; color: string }>;
    statuses.forEach((s) => (map[s.id] = { name: s.name, color: s.color }));
    return map;
  }, [statuses]);

  const handleClick = React.useCallback(async () => {
    setLoading(true);
    try {
      let dataToExport = claims;
      
      // Если нужно экспортировать все данные
      if (useAllData && allClaimsQuery.data) {
        // Преобразуем все данные в формат ClaimWithNames
        dataToExport = allClaimsQuery.data.map((c) => {
          const buildings = Array.from(
            new Set(c.unit_ids.map((id) => buildingMap[id]).filter(Boolean)),
          );

          return {
            ...c,
            key: String(c.id),
            projectName: projectMap[c.project_id] || "—",
            buildings: buildings.join(", ") || "—",
            unitNames: c.unit_ids
              .map((id) => unitNumberMap[id])
              .filter(Boolean)
              .sort(naturalCompare)
              .join(", "),
            responsibleEngineerName: userMap[c.engineer_id || ""] || "—",
            createdByName: userMap[c.created_by || ""] || "—",
            statusName: statusMap[c.claim_status_id || 0]?.name || "—",
            statusColor: statusMap[c.claim_status_id || 0]?.color || "#ccc",
            claimedOn: c.claimed_on ? dayjs(c.claimed_on) : null,
            acceptedOn: c.accepted_on ? dayjs(c.accepted_on) : null,
            registeredOn: c.registered_on ? dayjs(c.registered_on) : null,
            resolvedOn: c.resolved_on ? dayjs(c.resolved_on) : null,
            createdAt: c.created_at ? dayjs(c.created_at) : null,
          } as ClaimWithNames;
        });
      }
      
      const filteredData = dataToExport;
      const rows = filteredData.map((c) => ({
        ID: c.id,
        Проект: c.projectName,
        Корпус: c.buildings ?? '',
        Объекты: c.unitNames,
        Статус: c.statusName,
        '№ претензии': c.claim_no,
        'Дата претензии': c.claimedOn ? c.claimedOn.format('DD.MM.YYYY') : '',
        'Дата получения Застройщиком': c.acceptedOn
          ? c.acceptedOn.format('DD.MM.YYYY')
          : '',
        'Дата регистрации претензии': c.registeredOn
          ? c.registeredOn.format('DD.MM.YYYY')
          : '',
        'Дата устранения': c.resolvedOn ? c.resolvedOn.format('DD.MM.YYYY') : '',
        'Закрепленный инженер': c.responsibleEngineerName ?? '',
        Добавлено: c.createdAt ? c.createdAt.format('DD.MM.YYYY HH:mm') : '',
        Автор: c.createdByName ?? '',
      }));
      
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet('Claims');
      if (rows.length) {
        ws.columns = Object.keys(rows[0]).map((k) => ({ header: k, key: k }));
        rows.forEach((r) => ws.addRow(r));
      }
      const buffer = await wb.xlsx.writeBuffer();
      saveAs(new Blob([buffer], { type: 'application/octet-stream' }), 'claims.xlsx');
      
      message.success(`Экспортировано ${rows.length} претензий`);
    } catch (error) {
      message.error('Ошибка при экспорте данных');
      console.error('Export error:', error);
    } finally {
      setLoading(false);
    }
  }, [claims, useAllData, allClaimsQuery.data, userMap, projectMap, unitNumberMap, buildingMap, statusMap]);

  return (
    <Tooltip title="Выгрузить в Excel">
      <Button 
        icon={<DownloadOutlined />} 
        onClick={handleClick} 
        loading={loading || (useAllData && allClaimsQuery.isLoading)}
      />
    </Tooltip>
  );
}
