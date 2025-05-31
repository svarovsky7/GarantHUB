import React from 'react';
import {
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  Button,
  Skeleton,
} from '@mui/material';
import dayjs from 'dayjs';
import type { CourtCase } from '@/shared/types/courtCase';

const statusText: Record<string, string> = {
  active: 'В процессе',
  won: 'Выиграно',
  lost: 'Проиграно',
  settled: 'Урегулировано',
};

const statusColor: Record<string, 'warning' | 'success' | 'error' | 'info'> = {
  active: 'warning',
  won: 'success',
  lost: 'error',
  settled: 'info',
};

interface CourtCaseRow extends CourtCase {
  project_object?: string;
  plaintiff?: string;
  defendant?: string;
  responsible_lawyer?: string | null;
  claim_amount?: number | null;
}

interface Props {
  cases: CourtCaseRow[];
  loading: boolean;
  onView: (c: CourtCase) => void;
  onDelete: (c: CourtCase) => void;
}

export default function CourtCasesTable({ cases, loading, onView, onDelete }: Props) {
  if (loading) {
    return <Skeleton variant="rectangular" height={160} />;
  }

  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>№ дела</TableCell>
          <TableCell>Дата</TableCell>
          <TableCell>Объект</TableCell>
          <TableCell>Истец</TableCell>
          <TableCell>Ответчик</TableCell>
          <TableCell>Юрист</TableCell>
          <TableCell>Статус</TableCell>
          <TableCell>Сумма иска</TableCell>
          <TableCell>Действия</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {cases.map((c) => (
          <TableRow key={c.id} hover>
            <TableCell>{c.number}</TableCell>
            <TableCell>{dayjs(c.date).format('DD.MM.YYYY')}</TableCell>
            <TableCell>{c.project_object ?? '-'}</TableCell>
            <TableCell>{c.plaintiff ?? c.plaintiff_id}</TableCell>
            <TableCell>{c.defendant ?? c.defendant_id}</TableCell>
            <TableCell>{c.responsible_lawyer ?? c.responsible_lawyer_id ?? ''}</TableCell>
            <TableCell>
              <Chip size="small" label={statusText[c.status]} color={statusColor[c.status]} />
            </TableCell>
            <TableCell>
              {new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(
                c.claim_amount || 0,
              )}
            </TableCell>
            <TableCell>
              <Button size="small" onClick={() => onView(c)}>
                Просмотр
              </Button>
              <Button size="small" color="error" onClick={() => onDelete(c)}>
                Удалить
              </Button>
            </TableCell>
          </TableRow>
        ))}
        {cases.length === 0 && (
          <TableRow>
            <TableCell colSpan={9} align="center">
              Нет судебных дел для отображения
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
