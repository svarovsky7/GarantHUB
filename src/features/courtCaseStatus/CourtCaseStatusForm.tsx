import React from "react";
import { useForm, Controller } from "react-hook-form";
import {
  Stack,
  TextField,
  DialogActions,
  Button,
  CircularProgress,
} from "@mui/material";

export default function CourtCaseStatusForm({
  initialData,
  onSubmit,
  onCancel,
}) {
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
    <form onSubmit={handleSubmit(onSubmit)} noValidate data-oid="zhxpvr.">
      <Stack spacing={2} sx={{ minWidth: 320 }} data-oid="y-94i21">
        <Controller
          name="name"
          control={control}
          rules={{ required: "Название обязательно" }}
          render={({ field, fieldState }) => (
            <TextField
              {...field}
              label="Название статуса"
              fullWidth
              required
              error={!!fieldState.error}
              helperText={fieldState.error?.message}
              autoFocus
              data-oid="hbsg2ly"
            />
          )}
          data-oid="7_h84hg"
        />

        <DialogActions sx={{ px: 0 }} data-oid="87-:4my">
          <Button onClick={onCancel} data-oid="h8ve9ci">
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
                  data-oid="dzqwaxj"
                />
              )
            }
            data-oid=":d06cz."
          >
            Сохранить
          </Button>
        </DialogActions>
      </Stack>
    </form>
  );
}
