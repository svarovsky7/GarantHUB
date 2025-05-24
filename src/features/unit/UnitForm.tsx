import React from "react";
import {
  Stack,
  TextField,
  MenuItem,
  Button,
  CircularProgress,
  Alert,
} from "@mui/material";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { useProjects } from "@/entities/project";
import { useAddUnit, useUpdateUnit } from "@/entities/unit";
import { useNotify } from "@/shared/hooks/useNotify";
import { useAuthStore } from "@/shared/store/authStore"; // Добавлено!

const schema = z.object({
  project_id: z.coerce.number().min(1, "Обязательно"),
  name: z.string().min(1, "Обязательно"),
  building: z.coerce.string().optional(),
  section: z.coerce.string().optional(),
  floor: z.coerce.string().optional(),
});

export default function UnitForm({ initialData, onSuccess, onCancel }) {
  const notify = useNotify();
  const profile = useAuthStore((s) => s.profile); // ← добавлено для UX-защиты
  const isEdit = Boolean(initialData?.id);
  const { data: projects = [] } = useProjects();

  const add = useAddUnit();
  const update = useUpdateUnit();

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      project_id: initialData?.project_id?.toString() ?? "",
      name: initialData?.name ?? "",
      building: initialData?.building ?? "",
      section: initialData?.section ?? "",
      floor: initialData?.floor ?? "",
    },
    mode: "onTouched",
  });

  // UX-защита: пока профиль не загружен — skeleton, если не авторизован — предупреждение
  if (profile === undefined) {
    return (
      <CircularProgress
        sx={{ display: "block", mx: "auto", my: 4 }}
        data-oid="ir8t5tw"
      />
    );
  }
  if (!profile) {
    return (
      <Alert severity="warning" sx={{ my: 4 }} data-oid="_1du-5f">
        Авторизуйтесь для создания объектов.
      </Alert>
    );
  }

  const submit = async (data) => {
    const payload = { ...data, project_id: Number(data.project_id) };
    try {
      if (isEdit) {
        await update.mutateAsync({ id: initialData.id, updates: payload });
        notify.success("Объект обновлён");
        onSuccess?.(initialData);
      } else {
        const newUnit = await add.mutateAsync(payload); // person_id подставится автоматически!
        notify.success("Объект создан");
        onSuccess?.(newUnit);
      }
    } catch (err) {
      if (/уже существует/i.test(err.message)) {
        (["project_id", "name"] as const).forEach((f) =>
          setError(
            f as any,
            { type: "duplicate", message: "Дубликат" },
            { shouldFocus: true },
          ),
        );
      }
      notify.error(err.message);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(submit)}
      noValidate
      autoComplete="off"
      data-oid="316-ppt"
    >
      <Stack spacing={2} sx={{ maxWidth: 420 }} data-oid="scgxy86">
        {/* ----- Проект ----- */}
        <Controller
          name="project_id"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              select
              required
              fullWidth
              id="unit-project_id"
              label="Проект"
              error={!!errors.project_id}
              helperText={errors.project_id?.message}
              autoComplete="off"
              inputProps={{ autoCorrect: "off", spellCheck: "false" }}
              value={field.value === undefined ? "" : field.value}
              data-oid="5_ytecq"
            >
              <MenuItem value="" data-oid="mg3cv23">
                —
              </MenuItem>
              {projects.map((p) => (
                <MenuItem key={p.id} value={p.id} data-oid="vn2o4rc">
                  {p.name}
                </MenuItem>
              ))}
            </TextField>
          )}
          data-oid="69nv:cn"
        />

        {/* ----- Квартира / Лот ----- */}
        <Controller
          name="name"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Квартира / Лот"
              required
              fullWidth
              id="unit-name"
              error={!!errors.name}
              helperText={errors.name?.message}
              autoComplete="off"
              inputProps={{ autoCorrect: "off", spellCheck: "false" }}
              data-oid="ici62ka"
            />
          )}
          data-oid="dj9694a"
        />

        {/* Корпус / Секция / Этаж */}
        {(["building", "section", "floor"] as const).map((field) => (
          <Controller
            key={field}
            name={field}
            control={control}
            render={({ field: f }) => (
              <TextField
                {...f}
                label={
                  { building: "Корпус", section: "Секция", floor: "Этаж" }[
                    field
                  ]
                }
                fullWidth
                autoComplete="off"
                inputProps={{ autoCorrect: "off", spellCheck: "false" }}
                data-oid="dyybgtx"
              />
            )}
            data-oid="xw_zklu"
          />
        ))}

        <Stack
          direction="row"
          spacing={2}
          justifyContent="flex-end"
          data-oid="1mv956w"
        >
          <Button
            type="submit"
            variant="contained"
            disabled={isSubmitting}
            startIcon={
              isSubmitting && <CircularProgress size={18} data-oid="c2jtk3h" />
            }
            data-oid=".87ykzp"
          >
            Сохранить
          </Button>
          <Button
            variant="text"
            onClick={onCancel}
            disabled={isSubmitting}
            data-oid="gx6idzv"
          >
            Отмена
          </Button>
        </Stack>
      </Stack>
    </form>
  );
}
