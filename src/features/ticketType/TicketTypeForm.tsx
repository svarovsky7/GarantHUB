import React from "react";
import { useForm, Controller } from "react-hook-form";
import {
  DialogActions,
  Stack,
  TextField,
  Button,
  CircularProgress,
} from "@mui/material";

/**
 * @param {{
 *   initialData?: { id?: number, name?: string },
 *   onSubmit: (data: { name: string }) => void,
 *   onCancel: () => void
 * }} props
 */
export default function TicketTypeForm({ initialData, onSubmit, onCancel }) {
  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm({
    defaultValues: {
      name: initialData?.name ?? "",
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate data-oid="zakwb00">
      <Stack spacing={2} sx={{ minWidth: 320 }} data-oid="4_bn:wp">
        <Controller
          name="name"
          control={control}
          rules={{ required: "Название обязательно" }}
          render={({ field, fieldState }) => (
            <TextField
              {...field}
              label="Название типа"
              fullWidth
              required
              error={!!fieldState.error}
              helperText={fieldState.error?.message}
              autoFocus
              data-oid="fugvyb4"
            />
          )}
          data-oid="t740p2q"
        />

        <DialogActions sx={{ px: 0 }} data-oid="hq:678s">
          <Button onClick={onCancel} data-oid="v_8lyp6">
            Отмена
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isSubmitting}
            startIcon={
              isSubmitting && (
                <CircularProgress
                  size={18}
                  color="inherit"
                  data-oid="kxius71"
                />
              )
            }
            data-oid="34z9mm-"
          >
            Сохранить
          </Button>
        </DialogActions>
      </Stack>
    </form>
  );
}
