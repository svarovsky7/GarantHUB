import React, { useEffect, useState, useCallback } from "react";
import { useForm, FormProvider, Controller } from "react-hook-form";
import {
  Stack,
  TextField,
  Switch,
  Button,
  Divider,
  Autocomplete,
  Typography,
  CircularProgress,
  Box,
  Alert,
  Chip,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { Dayjs } from "dayjs";
import "dayjs/locale/ru";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useNavigate, useParams } from "react-router-dom";

import { useUnitsByProject } from "@/entities/unit";
import { useTicketTypes } from "@/entities/ticketType";
import { useTicketStatuses } from "@/entities/ticketStatus";
import { useCreateTicket, useTicket, signedUrl } from "@/entities/ticket";
import { useUsers } from "@/entities/user";

import { useProjectId } from "@/shared/hooks/useProjectId";
import { useAuthStore } from "@/shared/store/authStore";
import FileDropZone from "@/shared/ui/FileDropZone";
import AttachmentPreviewList from "@/shared/ui/AttachmentPreviewList";

// ---------- validation ----------
const schema = yup
  .object({
    project_id: yup.number().required(),
    unit_id: yup.number().nullable(),
    type_id: yup.number().required("Тип обязателен"),
    status_id: yup.number().required("Статус обязателен"),
    title: yup.string().trim().required("Заголовок обязателен").min(3),
    description: yup.string().trim().nullable(),
    customer_request_no: yup.string().trim().nullable(),
    customer_request_date: yup
      .mixed<Dayjs>()
      .nullable()
      .test(
        "is-dayjs-or-null",
        "Некорректная дата",
        (v) => v === null || (dayjs.isDayjs(v) && v.isValid()),
      ),
    responsible_engineer_id: yup.string().nullable(),
    is_warranty: yup.boolean().defined(),
    received_at: yup
      .mixed<Dayjs>()
      .required("Дата получения обязательна")
      .test(
        "is-dayjs",
        "Некорректная дата",
        (v) => dayjs.isDayjs(v) && v.isValid(),
      ),
    fixed_at: yup
      .mixed<Dayjs>()
      .nullable()
      .test(
        "is-dayjs-or-null",
        "Некорректная дата",
        (v) => v === null || (dayjs.isDayjs(v) && v.isValid()),
      ),
  })
  .required();

interface TicketFormValues {
  project_id: number;
  unit_id: number | null;
  type_id: number | null;
  status_id: number | null;
  title: string;
  description: string | null;
  customer_request_no: string | null;
  customer_request_date: Dayjs | null;
  responsible_engineer_id: string | null;
  is_warranty: boolean;
  received_at: Dayjs;
  fixed_at: Dayjs | null;
}

export default function TicketForm({
  embedded = false,
  initialUnitId = null,
  onCreated,
  onCancel,
  ticketId: propTicketId,
}) {
  const navigate = useNavigate();
  const params = useParams();
  const ticketId = propTicketId ?? params.ticketId;
  const isEditMode = Boolean(ticketId);

  const projectId = useProjectId();
  const profile = useAuthStore((s) => s.profile);

  const {
    data: ticket,
    isLoading: isLoadingTicket,
    updateAsync: updateTicket,
    updating: isUpdatingTicket,
  } = useTicket(ticketId);

  const { data: types = [], isLoading: isLoadingTypes } = useTicketTypes();
  const { data: statuses = [], isLoading: isLoadingStatuses } =
    useTicketStatuses();
  const { data: units = [], isLoading: isLoadingUnits } = useUnitsByProject(
    projectId,
    !!projectId,
  );
  const { data: users = [], isLoading: isLoadingUsers } = useUsers();

  const methods = useForm<TicketFormValues>({
    shouldUnregister: false,
    resolver: yupResolver(schema),
    defaultValues: {
      project_id: projectId,
      unit_id: initialUnitId ?? null,
      type_id: null,
      status_id: null,
      title: "",
      description: "",
      customer_request_no: "",
      customer_request_date: null,
      responsible_engineer_id: null,
      is_warranty: false,
      received_at: dayjs(),
      fixed_at: null,
    },
  });
  const {
    control,
    reset,
    setValue,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const [remoteFiles, setRemoteFiles] = useState([]);
  const [newFiles, setNewFiles] = useState([]);

  const handleDropFiles = useCallback((files) => {
    setNewFiles((prev) => [...prev, ...files]);
  }, []);
  const handleRemoveNewFile = (idx: number) =>
    setNewFiles((prev) => prev.filter((_, i) => i !== idx));
  const handleRemoveRemoteFile = (id: number) =>
    setRemoteFiles((prev) => prev.filter((f) => f.id !== id));

  const { mutateAsync: createTicket, isPending: isCreatingTicket } =
    useCreateTicket();

  useEffect(() => {
    if (isEditMode && ticket) {
      reset({
        project_id: ticket.projectId,
        unit_id: ticket.unitId ?? null,
        type_id: ticket.typeId,
        status_id: ticket.statusId,
        title: ticket.title,
        description: ticket.description ?? "",
        customer_request_no: ticket.customerRequestNo ?? "",
        customer_request_date: ticket.customerRequestDate,
        responsible_engineer_id: ticket.responsibleEngineerId ?? null,
        is_warranty: ticket.isWarranty,
        received_at: ticket.receivedAt,
        fixed_at: ticket.fixedAt,
      });
      setRemoteFiles(ticket.attachments ?? []);
    }
  }, [isEditMode, ticket, reset]);

  useEffect(() => {
    setValue("project_id", projectId);
  }, [projectId, setValue]);

  useEffect(() => {
    if (embedded && initialUnitId) {
      setValue("unit_id", initialUnitId);
    }
  }, [embedded, initialUnitId, setValue]);

  const serialize = (data: TicketFormValues) => ({
    project_id: data.project_id,
    unit_id: data.unit_id ?? null,
    type_id: data.type_id,
    status_id: data.status_id,
    title: data.title.trim(),
    description: data.description?.trim() || null,
    customer_request_no: data.customer_request_no?.trim() || null,
    customer_request_date: data.customer_request_date
      ? dayjs(data.customer_request_date).format("YYYY-MM-DD")
      : null,
    responsible_engineer_id: data.responsible_engineer_id ?? null,
    is_warranty: data.is_warranty,
    received_at: dayjs(data.received_at).format("YYYY-MM-DD"),
    fixed_at: data.fixed_at ? dayjs(data.fixed_at).format("YYYY-MM-DD") : null,
  });

  const onSubmit = async (data: TicketFormValues) => {
    const dto = serialize(data);

    if (isEditMode) {
      const removedIds = ticket.attachments
        .filter((f) => !remoteFiles.some((r) => r.id === f.id))
        .map((f) => f.id);

      await updateTicket({
        id: Number(ticketId),
        ...dto,
        newAttachments: newFiles,
        removedAttachmentIds: removedIds,
      });
    } else {
      await createTicket({ ...dto, attachments: newFiles });
    }
    if (onCreated) {
      onCreated();
    } else {
      navigate("/tickets");
    }
  };

  if (profile === undefined) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: 240,
        }}
        data-oid="-dgbo4."
      >
        <CircularProgress data-oid="wez2ntw" />
      </Box>
    );
  }
  if (!profile) {
    return (
      <Box
        sx={{
          minHeight: 240,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        data-oid="v_p8e_j"
      >
        <Alert severity="warning" data-oid="svkk:_c">
          Авторизуйтесь для создания замечаний.
        </Alert>
      </Box>
    );
  }
  if (!projectId) {
    return (
      <Box
        sx={{
          minHeight: 240,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        data-oid="615fmo6"
      >
        <Alert severity="warning" data-oid="lw3f17q">
          Не выбран проект. Выберите проект в верхней панели.
        </Alert>
      </Box>
    );
  }

  const isLoading =
    (isEditMode && isLoadingTicket) ||
    isLoadingTypes ||
    isLoadingStatuses ||
    isLoadingUsers ||
    (!isEditMode && !projectId) ||
    (projectId && isLoadingUnits);

  if (isLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: 240,
        }}
        data-oid=".h8x6y0"
      >
        <CircularProgress data-oid="2fhrj5u" />
      </Box>
    );
  }

  return (
    <LocalizationProvider
      dateAdapter={AdapterDayjs}
      adapterLocale="ru"
      data-oid="1e8ve9b"
    >
      <FormProvider {...methods} data-oid="98k-.7c">
        <form onSubmit={handleSubmit(onSubmit)} noValidate data-oid="pql95ie">
          <Stack spacing={3} data-oid="0k3piqi">
            {/* Unit */}
            <Controller
              name="unit_id"
              control={control}
              render={({ field, fieldState: { error } }) => (
                <Autocomplete
                  {...field}
                  options={units}
                  loading={isLoadingUnits}
                  getOptionLabel={(o) => o?.name ?? ""}
                  isOptionEqualToValue={(o, v) => o?.id === v?.id}
                  onChange={(_, v) => field.onChange(v ? v.id : null)}
                  value={units.find((u) => u.id === field.value) || null}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Объект"
                      error={!!error}
                      helperText={error?.message}
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {isLoadingUnits && (
                              <CircularProgress size={20} data-oid="2i2f8pn" />
                            )}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      }}
                      data-oid="47yj-vo"
                    />
                  )}
                  disabled={Boolean(embedded && initialUnitId)}
                  data-oid="bvkd8-e"
                />
              )}
              data-oid="p04eidp"
            />

            <Controller
              name="customer_request_no"
              control={control}
              render={({ field, fieldState: { error } }) => (
                <TextField
                  {...field}
                  label="№ заявки от Заказчика"
                  fullWidth
                  error={!!error}
                  helperText={error?.message}
                  data-oid="3nz9.q5"
                />
              )}
              data-oid="-t:e10k"
            />

            <Controller
              name="customer_request_date"
              control={control}
              render={({ field, fieldState: { error } }) => (
                <DatePicker
                  label="Дата регистрации заявки"
                  value={field.value}
                  onChange={field.onChange}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      error: !!error,
                      helperText: error?.message,
                    },
                  }}
                  data-oid="vd2ridt"
                />
              )}
              data-oid="lc5a29e"
            />

            <Controller
              name="received_at"
              control={control}
              render={({ field, fieldState: { error } }) => (
                <DatePicker
                  label="Дата получения *"
                  value={field.value}
                  onChange={field.onChange}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      required: true,
                      error: !!error,
                      helperText: error?.message,
                    },
                  }}
                  data-oid="3wlm80w"
                />
              )}
              data-oid="ieg8dk5"
            />

            {/* Быстрые чипы прибавления дней */}
            <Box sx={{ display: "flex", gap: 1, mt: 0.5 }} data-oid="odmqe:4">
              {[10, 30, 45].map((days) => (
                <Chip
                  key={days}
                  label={`+${days} дней`}
                  clickable
                  color="primary"
                  variant="outlined"
                  onClick={() => {
                    const rec = methods.getValues("received_at") as Dayjs;
                    if (dayjs(rec).isValid()) {
                      setValue("fixed_at", dayjs(rec).add(days, "day"));
                    }
                  }}
                  sx={{ fontWeight: 500 }}
                  data-oid="a.1sqwy"
                />
              ))}
            </Box>
            <Controller
              name="fixed_at"
              control={control}
              render={({ field, fieldState: { error } }) => (
                <DatePicker
                  label="Дата устранения"
                  value={field.value}
                  onChange={field.onChange}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      error: !!error,
                      helperText: error?.message,
                    },
                  }}
                  data-oid="rv75ubi"
                />
              )}
              data-oid=":wu_r_4"
            />

            <Controller
              name="status_id"
              control={control}
              render={({ field, fieldState: { error } }) => (
                <Autocomplete
                  {...field}
                  options={statuses}
                  loading={isLoadingStatuses}
                  getOptionLabel={(o) => o?.name ?? ""}
                  isOptionEqualToValue={(o, v) => o?.id === v?.id}
                  onChange={(_, v) => field.onChange(v ? v.id : null)}
                  value={statuses.find((s) => s.id === field.value) || null}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Статус"
                      required
                      error={!!error}
                      helperText={error?.message}
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {isLoadingStatuses && (
                              <CircularProgress size={20} data-oid="iqi99wr" />
                            )}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      }}
                      data-oid="z04flcr"
                    />
                  )}
                  data-oid="a:wiz_b"
                />
              )}
              data-oid="04-ogbu"
            />

            <Controller
              name="type_id"
              control={control}
              render={({ field, fieldState: { error } }) => (
                <Autocomplete
                  {...field}
                  options={types}
                  loading={isLoadingTypes}
                  getOptionLabel={(o) => o?.name ?? ""}
                  isOptionEqualToValue={(o, v) => o?.id === v?.id}
                  onChange={(_, v) => field.onChange(v ? v.id : null)}
                  value={types.find((t) => t.id === field.value) || null}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Тип замечания"
                      required
                      error={!!error}
                      helperText={error?.message}
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {isLoadingTypes && (
                              <CircularProgress size={20} data-oid="yxk4q7v" />
                            )}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      }}
                      data-oid="sufs5p2"
                    />
                  )}
                  data-oid="gs8czr_"
                />
              )}
              data-oid="b72pdmm"
            />

            <Controller
              name="is_warranty"
              control={control}
              render={({ field }) => (
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={1}
                  data-oid="ei2lv_."
                >
                  <Switch {...field} checked={field.value} data-oid="es8sl5y" />
                  <Typography
                    onClick={() => field.onChange(!field.value)}
                    sx={{ cursor: "pointer" }}
                    data-oid="q_hkn7-"
                  >
                    Гарантийный случай
                  </Typography>
                </Stack>
              )}
              data-oid="29rwcwj"
            />

            <Controller
              name="title"
              control={control}
              render={({ field, fieldState: { error } }) => (
                <TextField
                  {...field}
                  label="Краткое описание"
                  required
                  fullWidth
                  error={!!error}
                  helperText={error?.message}
                  data-oid="vso6zq."
                />
              )}
              data-oid="cro-99h"
            />

            <Controller
              name="description"
              control={control}
              render={({ field, fieldState: { error } }) => (
                <TextField
                  {...field}
                  label="Подробное описание"
                  multiline
                  minRows={4}
                  fullWidth
                  error={!!error}
                  helperText={error?.message}
                  data-oid="hkliip7"
                />
              )}
              data-oid="i3:h-zf"
            />

            <Controller
              name="responsible_engineer_id"
              control={control}
              render={({ field, fieldState: { error } }) => (
                <Autocomplete
                  {...field}
                  options={users}
                  loading={isLoadingUsers}
                  getOptionLabel={(o) => o?.name ?? ""}
                  isOptionEqualToValue={(o, v) => o?.id === v?.id}
                  onChange={(_, v) => field.onChange(v ? v.id : null)}
                  value={users.find((u) => u.id === field.value) || null}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Ответственный инженер"
                      error={!!error}
                      helperText={error?.message}
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {isLoadingUsers && (
                              <CircularProgress size={20} data-oid=":-rh.4v" />
                            )}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      }}
                      data-oid="jg4bx18"
                    />
                  )}
                  data-oid="pq:-pxl"
                />
              )}
              data-oid="4f8ko99"
            />

            {/* Attachments */}
            <Divider data-oid="zr695o5" />
            <Typography variant="h6" data-oid="udn.9le">
              Вложения
            </Typography>
            <FileDropZone onFiles={handleDropFiles} data-oid="0xc8nxm" />
            <AttachmentPreviewList
              remoteFiles={remoteFiles}
              newFiles={newFiles}
              onRemoveRemote={handleRemoveRemoteFile}
              onRemoveNew={handleRemoveNewFile}
              getSignedUrl={signedUrl}
              data-oid="m15lh15"
            />

            {/* Buttons */}
            <Stack
              direction="row"
              spacing={2}
              justifyContent="flex-end"
              data-oid="ypc_5ad"
            >
              <Button
                type="submit"
                variant="contained"
                disabled={isSubmitting || isCreatingTicket || isUpdatingTicket}
                data-oid="nahd399"
              >
                {isSubmitting || isCreatingTicket || isUpdatingTicket ? (
                  <CircularProgress
                    size={24}
                    sx={{ color: "white" }}
                    data-oid="997-xp_"
                  />
                ) : isEditMode ? (
                  "Сохранить"
                ) : (
                  "Создать"
                )}
              </Button>
              {embedded ? (
                <Button
                  variant="outlined"
                  color="inherit"
                  onClick={onCancel}
                  disabled={
                    isSubmitting || isCreatingTicket || isUpdatingTicket
                  }
                  data-oid="ipf.oh1"
                >
                  Отмена
                </Button>
              ) : (
                <Button
                  variant="outlined"
                  color="inherit"
                  onClick={() => navigate("/tickets")}
                  disabled={
                    isSubmitting || isCreatingTicket || isUpdatingTicket
                  }
                  data-oid="7d84ao1"
                >
                  Отмена
                </Button>
              )}
            </Stack>
          </Stack>
        </form>
      </FormProvider>
    </LocalizationProvider>
  );
}
