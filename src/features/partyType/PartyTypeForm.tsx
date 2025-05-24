import React from "react";
import { useForm, Controller } from "react-hook-form";
import {
  Stack,
  TextField,
  DialogActions,
  Button,
  CircularProgress,
} from "@mui/material";

export default function PartyTypeForm({ initialData, onSubmit, onCancel }) {
  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm({
    defaultValues: { name: initialData?.name ?? "" },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate data-oid="5b:u9j3">
      <Stack spacing={2} sx={{ minWidth: 320 }} data-oid="rpitpm8">
        <Controller
          name="name"
          control={control}
          rules={{ required: "Название обязательно" }}
          render={({ field, fieldState }) => (
            <TextField
              {...field}
              label="Тип участника"
              fullWidth
              required
              error={!!fieldState.error}
              helperText={fieldState.error?.message}
              autoFocus
              data-oid="zaycax-"
            />
          )}
          data-oid="p7.nnrk"
        />

        <DialogActions sx={{ px: 0 }} data-oid="urfr9xp">
          <Button onClick={onCancel} data-oid="0f:4enj">
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
                  data-oid="hkdlify"
                />
              )
            }
            data-oid="dyn:k7b"
          >
            Сохранить
          </Button>
        </DialogActions>
      </Stack>
    </form>
  );
}
