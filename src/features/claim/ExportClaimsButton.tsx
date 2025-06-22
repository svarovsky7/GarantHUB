import React from 'react';
import { Button, Tooltip } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import dayjs from 'dayjs';
import type { ClaimWithNames } from '@/shared/types/claimWithNames';
import type { ClaimFilters } from '@/shared/types/claimFilters';
import { filterClaims } from '@/shared/utils/claimFilter';
import { getDefectsInfo } from '@/entities/defect';

export interface ExportClaimsButtonProps {
  claims: ClaimWithNames[];
  filters: ClaimFilters;
}

export default function ExportClaimsButton({ claims, filters }: ExportClaimsButtonProps) {
  const handleClick = React.useCallback(async () => {
    const filtered = filterClaims(claims, filters);
    const allDefectIds = Array.from(
      new Set(filtered.flatMap((c) => c.defect_ids || [])),
    );
    let defectMap: Record<number, { description: string; statusName: string | null }> = {};
    if (allDefectIds.length) {
      const defs = await getDefectsInfo(allDefectIds);
      defectMap = defs.reduce<Record<number, { description: string; statusName: string | null }>>(
        (acc, d) => {
          acc[d.id] = { description: d.description, statusName: d.statusName };
          return acc;
        },
        {},
      );
    }

    const rows: Record<string, any>[] = [];
    filtered.forEach((c) => {
      rows.push({
        'Тип записи': 'Претензия',
        ID: c.id,
        Проект: c.projectName,
        Объекты: c.unitNames,
        '№ претензии': c.claim_no,
        'Дата претензии': c.claimedOn ? c.claimedOn.format('DD.MM.YYYY') : '',
        'Дата получения Застройщиком': c.acceptedOn ? c.acceptedOn.format('DD.MM.YYYY') : '',
        'Дата регистрации претензии': c.registeredOn ? c.registeredOn.format('DD.MM.YYYY') : '',
        'Дата устранения претензии': c.resolvedOn ? c.resolvedOn.format('DD.MM.YYYY') : '',
        Статус: c.statusName,
        'Ответственный инженер': c.responsibleEngineerName ?? '',
        Описание: '',
        'Статус дефекта': '',
        'Ссылки на файлы': (c.attachments ?? []).map((a) => a.url).join('\n'),
      });

      (c.defect_ids || []).forEach((id) => {
        const def = defectMap[id];
        if (!def) return;
        rows.push({
          'Тип записи': 'Дефект',
          ID: id,
          Проект: '',
          Объекты: '',
          '№ претензии': '',
          'Дата претензии': '',
          'Дата получения Застройщиком': '',
          'Дата регистрации претензии': '',
          'Дата устранения претензии': '',
          Статус: '',
          'Ответственный инженер': '',
          Описание: def.description,
          'Статус дефекта': def.statusName ?? '',
          'Ссылки на файлы': '',
        });
      });
    });

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Claims');
    if (rows.length) {
      ws.columns = Object.keys(rows[0]).map((k) => ({ header: k, key: k }));
      rows.forEach((r) => ws.addRow(r));
    }
    const buffer = await wb.xlsx.writeBuffer();
    saveAs(new Blob([buffer], { type: 'application/octet-stream' }), 'claims.xlsx');
  }, [claims, filters]);

  return (
    <Tooltip title="Выгрузить в Excel">
      <Button icon={<DownloadOutlined />} onClick={handleClick} />
    </Tooltip>
  );
}
