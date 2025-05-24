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
    <form onSubmit={handleSubmit(onSubmit)} noValidate data-oid="qlhsm:y">
      <Stack spacing={2} sx={{ minWidth: 320 }} data-oid="4uq:fo8">
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
              data-oid="6o0k08k"
            />
          )}
          data-oid="z9j7kyj"
        />

        <DialogActions sx={{ px: 0 }} data-oid="r9_zpt-">
          <Button onClick={onCancel} data-oid="bual-5k">
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
                  data-oid="rjx61_0"
                />
              )
            }
            data-oid="h4k059i"
          >
            Сохранить
          </Button>
        </DialogActions>
      </Stack>
    </form>
  );
}
