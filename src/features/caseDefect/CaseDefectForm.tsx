import React, { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Autocomplete,
} from "@mui/material";
import { useProjectDefects } from "@/entities/defect";

export default function CaseDefectForm({
  open,
  initialData,
  onSubmit,
  onCancel,
}) {
  const { data: defects = [] } = useProjectDefects();
  const { control, handleSubmit, reset } = useForm({
    defaultValues: { defect_id: null },
  });

  useEffect(() => {
    if (initialData) {
      reset({ defect_id: initialData.id });
    } else {
      reset({ defect_id: null });
    }
  }, [initialData, reset]);

  return (
    <Dialog
      open={open}
      onClose={onCancel}
      fullWidth
      maxWidth="sm"
      data-oid="bp62hck"
    >
      <form
        onSubmit={handleSubmit((vals) => onSubmit(vals.defect_id))}
        noValidate
        data-oid="6:ya9b4"
      >
        <DialogTitle data-oid="n1ejpug">Добавить недостаток</DialogTitle>
        <DialogContent dividers data-oid="f3q-dqp">
          <Controller
            name="defect_id"
            control={control}
            rules={{ required: "Недостаток обязателен" }}
            render={({ field, fieldState }) => (
              <Autocomplete
                options={defects}
                value={defects.find((d) => d.id === field.value) || null}
                onChange={(_, v) => field.onChange(v?.id ?? null)}
                getOptionLabel={(o) => o.description || ""}
                isOptionEqualToValue={(o, v) => o.id === v.id}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Недостаток"
                    required
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                    data-oid="i.itn5k"
                  />
                )}
                data-oid="oxt:eme"
              />
            )}
            data-oid="4lytrv4"
          />
        </DialogContent>
        <DialogActions data-oid="ci.iay3">
          <Button onClick={onCancel} data-oid=".sy3ol-">
            Отмена
          </Button>
          <Button type="submit" variant="contained" data-oid="zysx1eb">
            Сохранить
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
