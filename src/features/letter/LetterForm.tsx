import React, { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  TextField,
  Autocomplete,
} from "@mui/material";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import { useLetterTypes } from "@/entities/letterType";

export default function LetterForm({ open, initialData, onSubmit, onCancel }) {
  const { data: types = [] } = useLetterTypes();
  const { control, handleSubmit, reset } = useForm({
    defaultValues: {
      number: "",
      letter_type: "",
      letter_date: null,
      subject: "",
      sender: "",
      receiver: "",
    },
  });

  useEffect(() => {
    if (initialData) {
      reset({
        number: initialData.number ?? "",
        letter_type: initialData.letter_type ?? "",
        letter_date: initialData.letter_date
          ? dayjs(initialData.letter_date)
          : null,
        subject: initialData.subject ?? "",
        sender: initialData.sender ?? "",
        receiver: initialData.receiver ?? "",
      });
    } else {
      reset({
        number: "",
        letter_type: "",
        letter_date: null,
        subject: "",
        sender: "",
        receiver: "",
      });
    }
  }, [initialData, reset]);

  return (
    <Dialog
      open={open}
      onClose={onCancel}
      fullWidth
      maxWidth="sm"
      data-oid="y:0kasb"
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate data-oid=":s1qp9o">
        <DialogTitle data-oid="a09_3-l">
          {initialData ? "Редактировать письмо" : "Новое письмо"}
        </DialogTitle>
        <DialogContent dividers data-oid="25d4cw7">
          <LocalizationProvider
            dateAdapter={AdapterDayjs}
            adapterLocale="ru"
            data-oid="cz:zbpn"
          >
            <Stack spacing={2} sx={{ mt: 1 }} data-oid="m37mc11">
              <Controller
                name="number"
                control={control}
                rules={{ required: "Номер обязателен" }}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    label="Номер"
                    required
                    fullWidth
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                    data-oid="5b9w:cx"
                  />
                )}
                data-oid=":gb-dsq"
              />

              <Controller
                name="letter_type"
                control={control}
                render={({ field }) => (
                  <Autocomplete
                    options={types}
                    value={types.find((t) => t.name === field.value) || null}
                    onChange={(_, v) => field.onChange(v?.name ?? "")}
                    getOptionLabel={(o) => o.name || ""}
                    isOptionEqualToValue={(o, v) => o.name === v.name}
                    renderInput={(params) => (
                      <TextField {...params} label="Тип" data-oid=".c3u76w" />
                    )}
                    data-oid="4w6ezu4"
                  />
                )}
                data-oid="hg64l:-"
              />

              <Controller
                name="letter_date"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    {...field}
                    label="Дата"
                    format="DD.MM.YYYY"
                    onChange={(v) => field.onChange(v)}
                    data-oid="60gew31"
                  />
                )}
                data-oid="9jwyl:j"
              />

              <Controller
                name="subject"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Тема"
                    fullWidth
                    data-oid="_4thwfl"
                  />
                )}
                data-oid="qomrm43"
              />

              <Controller
                name="sender"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="От кого"
                    fullWidth
                    data-oid="105eztg"
                  />
                )}
                data-oid="5m3hm4c"
              />

              <Controller
                name="receiver"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Кому"
                    fullWidth
                    data-oid="ny7z_0k"
                  />
                )}
                data-oid="i8gmgts"
              />
            </Stack>
          </LocalizationProvider>
        </DialogContent>
        <DialogActions data-oid="3.cly53">
          <Button onClick={onCancel} data-oid="fjllja-">
            Отмена
          </Button>
          <Button type="submit" variant="contained" data-oid="2ek8k3k">
            Сохранить
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
