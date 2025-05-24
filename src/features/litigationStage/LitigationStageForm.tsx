// src/features/litigationStage/LitigationStageForm.js
// -----------------------------------------------------------------------------
// Модальная форма добавления / редактирования стадии судебного дела
// -----------------------------------------------------------------------------

import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Stack,
} from "@mui/material";

interface LitigationStageFormProps {
  initialData?: { id?: number; name?: string };
  onSubmit: (values: { name: string }) => void;
  onCancel: () => void;
}

export default function LitigationStageForm({
  initialData,
  onSubmit,
  onCancel,
}: LitigationStageFormProps) {
  const [name, setName] = useState(initialData?.name ?? "");

  const handleSave = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({ name: name.trim() });
  };

  return (
    <Dialog open onClose={onCancel} fullWidth maxWidth="xs" data-oid=":7q_n1a">
      <form onSubmit={handleSave} data-oid="250bna8">
        <DialogTitle data-oid="vtp.thp">
          {initialData.id ? "Редактировать стадию" : "Новая стадия"}
        </DialogTitle>

        <DialogContent dividers data-oid="qigbtgz">
          <Stack spacing={2} data-oid="i_3u255">
            <TextField
              label="Название"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              required
              size="small"
              fullWidth
              data-oid="fhy7cqs"
            />
          </Stack>
        </DialogContent>

        <DialogActions data-oid="dlfk4tg">
          <Button onClick={onCancel} data-oid="4-_3kwh">
            Отмена
          </Button>
          <Button type="submit" variant="contained" data-oid="8jejipq">
            Сохранить
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
