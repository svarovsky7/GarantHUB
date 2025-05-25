import React from 'react';
import dayjs from 'dayjs';
import {
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  IconButton,
  Typography,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { CorrespondenceLetter } from '@/shared/types/correspondence';

interface CorrespondenceTableProps {
  letters: CorrespondenceLetter[];
  onView: (letter: CorrespondenceLetter) => void;
  onDelete: (id: string) => void;
}

/** Таблица писем */
export default function CorrespondenceTable({
  letters,
  onView,
  onDelete,
}: CorrespondenceTableProps) {
  return (
    <Paper sx={{ p: 2 }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Тип</TableCell>
            <TableCell>Номер</TableCell>
            <TableCell>Дата</TableCell>
            <TableCell>Корреспондент</TableCell>
            <TableCell>Тема</TableCell>
            <TableCell align="right">Действия</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {letters.map((l) => (
            <TableRow key={l.id} hover>
              <TableCell>
                <Chip
                  label={l.type === 'incoming' ? 'Входящее' : 'Исходящее'}
                  color={l.type === 'incoming' ? 'success' : 'primary'}
                  size="small"
                />
              </TableCell>
              <TableCell>{l.number}</TableCell>
              <TableCell>{dayjs(l.date).format('DD.MM.YYYY')}</TableCell>
              <TableCell>{l.correspondent}</TableCell>
              <TableCell>{l.subject}</TableCell>
              <TableCell align="right">
                <IconButton size="small" onClick={() => onView(l)}>
                  <VisibilityIcon />
                </IconButton>
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => onDelete(l.id)}
                >
                  <DeleteIcon />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
          {letters.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} align="center">
                <Typography variant="body2" sx={{ py: 3 }}>
                  Нет писем
                </Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Paper>
  );
}
