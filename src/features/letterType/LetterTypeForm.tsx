import React from "react";
import { useForm, Controller } from "react-hook-form";
import {
  Stack,
  TextField,
  DialogActions,
  Button,
  CircularProgress,
} from "@mui/material";

export default function LetterTypeForm({ initialData, onSubmit, onCancel }) {
  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm({
    defaultValues: { name: initialData?.name ?? "" },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate data-oid="zzxen8z">
      <Stack spacing={2} sx={{ minWidth: 320 }} data-oid="jrj.-d0">
        <Controller
          name="name"
          control={control}
          rules={{ required: "Название обязательно" }}
          render={({ field, fieldState }) => (
            <TextField
              {...field}
              label="Тип письма"
              fullWidth
              required
              error={!!fieldState.error}
              helperText={fieldState.error?.message}
              autoFocus
              data-oid="z4ukg6h"
            />
          )}
          data-oid="aw0e902"
        />

        <DialogActions sx={{ px: 0 }} data-oid="jzxoh6t">
          <Button onClick={onCancel} data-oid="qfxeb_z">
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
                  data-oid="50pl38j"
                />
              )
            }
            data-oid="qnwysle"
          >
            Сохранить
          </Button>
        </DialogActions>
      </Stack>
    </form>
  );
}
