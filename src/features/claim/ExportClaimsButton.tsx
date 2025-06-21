import React from 'react';
import { Button, Tooltip } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import dayjs from 'dayjs';
import type { ClaimWithNames } from '@/shared/types/claimWithNames';
import type { ClaimFilters } from '@/shared/types/claimFilters';
import { filterClaims } from '@/shared/utils/claimFilter';

export interface ExportClaimsButtonProps {
  claims: ClaimWithNames[];
  filters: ClaimFilters;
}

export default function ExportClaimsButton({ claims, filters }: ExportClaimsButtonProps) {
  const handleClick = React.useCallback(async () => {
    const rows = filterClaims(claims, filters).map((c) => ({
      ID: c.id,
      Проект: c.projectName,
      Объекты: c.unitNames,
      '№ претензии': c.number,
      'Дата претензии': c.claimDate ? c.claimDate.format('DD.MM.YYYY') : '',
      'Дата получения Застройщиком': c.receivedByDeveloperAt
        ? c.receivedByDeveloperAt.format('DD.MM.YYYY')
        : '',
      'Дата регистрации претензии': c.registeredAt ? c.registeredAt.format('DD.MM.YYYY') : '',
      'Дата устранения претензии': c.fixedAt ? c.fixedAt.format('DD.MM.YYYY') : '',
      Статус: c.statusName,
      'Ответственный инженер': c.responsibleEngineerName ?? '',
    }));
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
