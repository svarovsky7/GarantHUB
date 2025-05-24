// src/features/ticketStatus/TicketStatusForm.js
import React from "react";
import { useForm, Controller } from "react-hook-form";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  TextField,
} from "@mui/material";

/**
 * @typedef {Object} TicketStatusFormProps
 * @property {Object} [initialData] начальные значения (edit-mode)
 * @property {(data:Object)=>void} onSubmit
 * @property {()=>void} onCancel
 */

/** Диалоговая форма статуса */
export default function TicketStatusForm({ initialData, onSubmit, onCancel }) {
  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm({
    defaultValues: {
      name: initialData?.name ?? "",
      description: initialData?.description ?? "",
      color: initialData?.color ?? "#1976d2", // CHANGE
    },
  });

  return (
    <Dialog open onClose={onCancel} fullWidth maxWidth="sm" data-oid="kb2n.2u">
      <DialogTitle data-oid="6ou6:_8">
        {initialData ? "Редактировать статус" : "Создать статус"}
      </DialogTitle>

      <DialogContent dividers data-oid="g0z-sq1">
        <Stack spacing={2} sx={{ mt: 1 }} data-oid="fkl3fj_">
          <Controller
            name="name"
            control={control}
            rules={{ required: "Название обязательно" }}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                label="Название"
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
                fullWidth
                autoFocus
                data-oid="alhf.bj"
              />
            )}
            data-oid="4u_ltub"
          />

          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Описание"
                multiline
                rows={3}
                fullWidth
                data-oid="u9slr01"
              />
            )}
            data-oid="pkdv2m4"
          />

          <Controller
            name="color"
            control={control}
            rules={{ required: "Цвет обязателен" }}
            render={({ field }) => (
              <TextField
                {...field}
                label="Цвет статуса"
                type="color"
                fullWidth
                inputProps={{ style: { height: 48, padding: 0 } }}
                data-oid="xn_isv:"
              />
            )}
            data-oid="y1fpu-z"
          />
        </Stack>
      </DialogContent>

      <DialogActions data-oid="wt7zh:4">
        <Button onClick={onCancel} data-oid="l72lnr0">
          Отмена
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit(onSubmit)}
          disabled={isSubmitting}
          data-oid="291hljj"
        >
          Сохранить
        </Button>
      </DialogActions>
    </Dialog>
  );
}
