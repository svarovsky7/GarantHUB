import React from "react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Stack, TextField, Button, CircularProgress } from "@mui/material";

const makeSchema = (min = 2, max = 120) =>
  z.object({
    name: z
      .string()
      .trim()
      .min(min, `Минимум ${min} символа(ов)`)
      .max(max, `Максимум ${max} символов`),
  });

const schema = makeSchema();

/**
 * Форма создания/редактирования проекта.
 */
interface ProjectFormProps {
  initialData?: { name?: string };
  onSubmit: (values: { name: string }) => void;
  onCancel?: () => void;
}

const ProjectForm = ({ initialData, onSubmit, onCancel }: ProjectFormProps) => {
  const {
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { name: initialData?.name ?? "" },
    mode: "onTouched",
  });

  return (
    /* CHANGE: выключаем автозаполнение всей формы */
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      autoComplete="off"
      data-oid="lqg5c7n"
    >
      <Stack spacing={3} sx={{ p: 3, maxWidth: 420 }} data-oid="_l76x0q">
        <Controller
          name="name"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Название проекта"
              fullWidth
              required
              error={!!errors.name}
              helperText={errors.name?.message}
              /* CHANGE: бронебойно отключаем подсказки браузера */
              autoComplete="off"
              inputProps={{ autoCorrect: "off", spellCheck: "false" }}
              data-oid="0xr.vfq"
            />
          )}
          data-oid="c9eg62."
        />

        <Stack
          direction="row"
          spacing={2}
          justifyContent="flex-end"
          data-oid="xm47_mn"
        >
          <Button
            type="submit"
            variant="contained"
            disabled={isSubmitting}
            startIcon={
              isSubmitting && (
                <CircularProgress
                  size={18}
                  color="inherit"
                  data-oid="kf98oq8"
                />
              )
            }
            data-oid="j.m:omo"
          >
            Сохранить
          </Button>
          {onCancel && (
            <Button
              variant="text"
              color="secondary"
              onClick={onCancel}
              disabled={isSubmitting}
              data-oid="tezwvho"
            >
              Отмена
            </Button>
          )}
        </Stack>
      </Stack>
    </form>
  );
};

export default ProjectForm;
