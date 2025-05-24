// src/features/person/PersonForm.js
// -----------------------------------------------------------------------------
// Inline-форма добавления / редактирования физического лица
// -----------------------------------------------------------------------------
import React, { useMemo } from "react";
import {
  Paper,
  Stack,
  Typography,
  TextField,
  MenuItem,
  Button,
  IconButton,
  CircularProgress,
  Skeleton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { useProjects } from "@/entities/project";
import { useAddPerson, useUpdatePerson } from "@/entities/person";
import { useNotify } from "@/shared/hooks/useNotify";

/* ------------------------------ validation ------------------------------ */

const schema = z.object({
  project_id: z
    .union([z.number(), z.string()])
    .refine((v) => v !== "", "Проект обязателен"),
  full_name: z.string().min(3, "Укажите ФИО"),
  phone: z.string().optional(),
  email: z
    .string()
    .email("Некорректный e-mail")
    .or(z.literal("").transform(() => undefined))
    .optional(),
});

/**
 * @param {{
 *   initialData?: {
 *     id:number,
 *     project_id:number,
 *     full_name:string,
 *     phone?:string|null,
 *     email?:string|null
 *   },
 *   onSuccess: () => void,
 *   onCancel: () => void
 * }} props
 */
export default function PersonForm({ initialData, onSuccess, onCancel }) {
  const isEdit = !!initialData;
  const notify = useNotify();

  const addMut = useAddPerson();
  const updMut = useUpdatePerson();

  const { data: projects = [], isPending: projLoading } = useProjects();

  // --- корректное значение project_id для new/edit ---
  const defaults = useMemo(
    () =>
      initialData
        ? {
            project_id: initialData.project_id ?? "",
            full_name: initialData.full_name,
            phone: initialData.phone ?? "",
            email: initialData.email ?? "",
          }
        : { project_id: "", full_name: "", phone: "", email: "" },
    [initialData],
  );

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<any>({
    defaultValues: defaults,
    resolver: zodResolver(schema) as any,
    mode: "onTouched",
  });

  /* ------------------------------- submit ------------------------------- */
  const submit = async (values) => {
    const payload = {
      project_id: Number(values.project_id),
      full_name: values.full_name.trim(),
      phone: values.phone || null,
      email: values.email || null,
    };

    try {
      if (isEdit) {
        await updMut.mutateAsync({ id: initialData.id, updates: payload });
        notify.success("Запись обновлена");
      } else {
        await addMut.mutateAsync(payload);
        notify.success("Физлицо добавлено");
      }
      onSuccess?.();
    } catch (e) {
      notify.error(e.message);
    }
  };

  /* --------------------------------  UI  -------------------------------- */
  return (
    <Paper elevation={3} sx={{ p: 3, mb: 4 }} data-oid="1-l-a:z">
      <Stack
        direction="row"
        justifyContent="space-between"
        mb={2}
        data-oid=".42a.rx"
      >
        <Typography variant="h6" data-oid="3rj5vtu">
          {isEdit ? "Редактировать физлицо" : "Добавить физлицо"}
        </Typography>
        <IconButton onClick={onCancel} size="small" data-oid="6wfy6_4">
          <CloseIcon fontSize="small" data-oid="u8ud4f8" />
        </IconButton>
      </Stack>

      <form onSubmit={handleSubmit(submit)} noValidate data-oid="b-o.3p7">
        <Stack spacing={2} data-oid="t7vbbd5">
          {/* project_id ---------------------------------------------------- */}
          {projLoading ? (
            <Skeleton variant="rectangular" height={56} data-oid="apn.8ye" />
          ) : (
            <Controller
              control={control}
              name="project_id"
              render={({ field }) => (
                <TextField
                  {...field}
                  select
                  label="Проект *"
                  error={!!errors.project_id}
                  helperText={errors.project_id?.message as string}
                  fullWidth
                  // Критически важно: если value невалиден — ставим ''
                  value={
                    field.value !== undefined &&
                    projects.some((p) => String(p.id) === String(field.value))
                      ? field.value
                      : ""
                  }
                  data-oid="lp.uz0f"
                >
                  <MenuItem value="" data-oid="ijthqb2">
                    —
                  </MenuItem>
                  {projects.map((p) => (
                    <MenuItem key={p.id} value={p.id} data-oid="kr:5bbd">
                      {p.name}
                    </MenuItem>
                  ))}
                </TextField>
              )}
              data-oid="82xon0g"
            />
          )}

          {/* full_name ----------------------------------------------------- */}
          <Controller
            control={control}
            name="full_name"
            render={({ field }) => (
              <TextField
                {...field}
                label="ФИО *"
                error={!!errors.full_name}
                helperText={errors.full_name?.message as string}
                fullWidth
                data-oid="7:7hc6t"
              />
            )}
            data-oid="s9im1l."
          />

          {/* phone --------------------------------------------------------- */}
          <Controller
            control={control}
            name="phone"
            render={({ field }) => (
              <TextField
                {...field}
                label="Телефон"
                fullWidth
                data-oid="2hxa3b."
              />
            )}
            data-oid="7lv1ik_"
          />

          {/* email --------------------------------------------------------- */}
          <Controller
            control={control}
            name="email"
            render={({ field }) => (
              <TextField
                {...field}
                label="E-mail"
                error={!!errors.email}
                helperText={errors.email?.message as string}
                fullWidth
                data-oid="bws5auc"
              />
            )}
            data-oid="ldisz2o"
          />

          {/* actions ------------------------------------------------------- */}
          <Stack
            direction="row"
            spacing={2}
            justifyContent="flex-end"
            data-oid="17ptgln"
          >
            <Button onClick={onCancel} data-oid="hjz6ktu">
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
                    data-oid="8eq_nqf"
                  />
                )
              }
              data-oid="o9q45yx"
            >
              Сохранить
            </Button>
          </Stack>
        </Stack>
      </form>
    </Paper>
  );
}
