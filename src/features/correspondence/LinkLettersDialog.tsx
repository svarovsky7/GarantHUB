import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button as MuiButton,
} from '@mui/material';
import { Select } from 'antd';
import { CorrespondenceLetter } from '@/shared/types/correspondence';

interface Props {
  open: boolean;
  parent: CorrespondenceLetter | null;
  letters: CorrespondenceLetter[];
  onClose: () => void;
  onSubmit: (ids: string[]) => void;
}

export default function LinkLettersDialog({
  open,
  parent,
  letters,
  onClose,
  onSubmit,
}: Props) {
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => setSelected([]), [parent]);

  const options = letters
    .filter((l) => l.id !== parent?.id)
    .map((l) => ({ value: l.id, label: `${l.number} - ${l.subject}` }));

  const handleSubmit = () => {
    onSubmit(selected);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Связать существующие письма</DialogTitle>
      <DialogContent dividers>
        <Select
          mode="multiple"
          showSearch
          style={{ width: '100%' }}
          options={options}
          value={selected}
          onChange={(vals) => setSelected(vals as string[])}
          placeholder="Выберите письма"
          getPopupContainer={(trigger) => trigger.parentElement!}
        />
      </DialogContent>
      <DialogActions>
        <MuiButton onClick={onClose}>Отмена</MuiButton>
        <MuiButton
          variant="contained"
          onClick={handleSubmit}
          disabled={selected.length === 0}
        >
          Связать
        </MuiButton>
      </DialogActions>
    </Dialog>
  );
}
