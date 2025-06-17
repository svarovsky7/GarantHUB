import React, { useEffect } from "react";
import { useForm, Controller, type SubmitHandler } from "react-hook-form";
import {
  Stack,
  TextField,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Button,
  CircularProgress,
  DialogActions,
  Typography,
  Box,
  FormControl,
  InputLabel,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers";
import dayjs, { Dayjs } from "dayjs";

import { useDefectTypes } from "@/entities/defectType";
import { useTicketStatuses } from "@/entities/ticketStatus";
import { useUnitsByProject } from "@/entities/unit";
import { useUsers } from "@/entities/user";
import { useVisibleProjects } from "@/entities/project";
import { useDefectDeadlines } from "@/entities/defectDeadline";
import { useAttachmentTypes } from "@/entities/attachmentType";
import { useCreateTicket, useTicket, signedUrl } from "@/entities/ticket";
import { useProjectId } from "@/shared/hooks/useProjectId";
import { useUnsavedChangesWarning } from "@/shared/hooks/useUnsavedChangesWarning";
import { useNotify } from "@/shared/hooks/useNotify";
import { useTicketAttachments } from "./model/useTicketAttachments";
import AttachmentEditorTable from "@/shared/ui/AttachmentEditorTable";
import { downloadZip } from "@/shared/utils/downloadZip";
import type { Ticket } from "@/entities/ticket";

interface Attachment {
  id: string | number;
  name: string;
  path: string;
  url: string;
  type: string;
  attachment_type_id: number | null;
  attachment_type_name?: string;
}

interface NewFile {
  file: File;
  type_id: number | null;
}

interface TicketFormProps {
  ticketId?: string;
  onCreated?: () => void;
  onCancel?: () => void;
  embedded?: boolean;
  /** Предустановленный ID квартиры */
  initialUnitId?: number;
}

interface TicketFormValues {
  project_id: number | null;
  unit_ids: number[];
  responsible_engineer_id: string | null;
  status_id: number | null;
  type_id: number | null;
  is_warranty: boolean;
  customer_request_no: string;
  customer_request_date: Dayjs | null;
  received_at: Dayjs | null;
  fixed_at: Dayjs | null;
  title: string;
  description: string;
}

/**
 * Форма просмотра и редактирования замечания.
 * При отсутствии ticketId создаёт новое замечание.
 */
export default function TicketForm({
  ticketId,
  onCreated,
  onCancel,
  embedded = false,
  initialUnitId,
}: TicketFormProps) {
  const globalProjectId = useProjectId();
  const notify = useNotify();
  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    getValues,
    formState: { isSubmitting, isDirty, dirtyFields },
  } = useForm<TicketFormValues>({
    defaultValues: {
      project_id:
        globalProjectId != null ? Number(globalProjectId) : null,
      unit_ids: initialUnitId != null ? [initialUnitId] : [],
      responsible_engineer_id: null,
      status_id: null,
      type_id: null,
      is_warranty: false,
      customer_request_no: "",
      customer_request_date: null,
      received_at: null,
      fixed_at: null,
      title: "",
      description: "",
    },
  });

  const { data: projects = [] } = useVisibleProjects();
  const { data: types = [] } = useDefectTypes();
  const { data: statuses = [] } = useTicketStatuses();
  const { data: users = [] } = useUsers();
  const { data: attachmentTypes = [] } = useAttachmentTypes();
  const { data: deadlines = [] } = useDefectDeadlines();
  const projectIdWatch =
    watch("project_id") ?? (globalProjectId != null ? Number(globalProjectId) : null);
  const { data: units = [] } = useUnitsByProject(projectIdWatch);
  const typeIdWatch = watch("type_id");
  const deadlineDays = React.useMemo(() => {
    if (!projectIdWatch || !typeIdWatch) return null;
    const rec = deadlines.find(
      (d) =>
        d.project_id === projectIdWatch &&
        d.defect_type_id === typeIdWatch,
    );
    return rec?.fix_days ?? null;
  }, [deadlines, projectIdWatch, typeIdWatch]);

  const create = useCreateTicket();
  const { data: ticket, updateAsync } = useTicket(ticketId);
  /** Форма открыта для редактирования существующего замечания */
  const isEdit = Boolean(ticketId);

  const {
    remoteFiles,
    newFiles,
    changedTypes,
    removedIds,
    addFiles,
    removeNew,
    removeRemote,
    changeRemoteType,
    changeNewType,
    appendRemote,
    markPersisted,
    attachmentsChanged,
    reset: resetAttachments,
  } = useTicketAttachments({ ticket, attachmentTypes });

  useEffect(() => {
    if (ticket) {
      reset({
        project_id: ticket.projectId,
        unit_ids: ticket.unitIds,
        responsible_engineer_id: ticket.responsibleEngineerId,
        status_id: ticket.statusId,
        is_warranty: ticket.isWarranty,
        customer_request_no: ticket.customerRequestNo || "",
        customer_request_date: ticket.customerRequestDate,
        received_at: ticket.receivedAt,
        fixed_at: ticket.fixedAt,
        title: ticket.title,
        description: ticket.description || "",
      });
    }
  }, [ticket, reset]);

  const hasChanges = isDirty || attachmentsChanged;

  useUnsavedChangesWarning(hasChanges);

  const highlight = (name: keyof TicketFormValues) =>
    dirtyFields[name] ? { bgcolor: '#fffbe6' } : {};

  const handleDownloadArchive = async () => {
    const files = [
      ...remoteFiles.map((f) => ({
        name: f.original_name ?? f.name,
        getFile: async () => {
          const url = await signedUrl(f.path, f.original_name ?? f.name);
          const res = await fetch(url);
          return res.blob();
        },
      })),
      ...newFiles.map((f) => ({ name: f.file.name, getFile: async () => f.file })),
    ];
    if (files.length) {
      await downloadZip(files, `ticket-${ticketId ?? 'new'}-files.zip`);
    }
  };

  const handleCancel = () => {
    if (hasChanges && !window.confirm('Изменения будут потеряны. Покинуть форму?')) {
      return;
    }
    onCancel?.();
  };


  const submit = async (values: TicketFormValues) => {
    if (
      newFiles.some((f) => f.type_id == null) ||
      remoteFiles.some((f) => (changedTypes[f.id] ?? null) == null)
    ) {
      notify.error('Выберите тип файла для всех документов');
      return;
    }
    const payload = {
      project_id:
        values.project_id ?? (globalProjectId != null ? Number(globalProjectId) : null),
      unit_ids: values.unit_ids,
      type_id: values.type_id,
      status_id: values.status_id,
      title: values.title,
      description: values.description || null,
      customer_request_no: values.customer_request_no || null,
      customer_request_date: values.customer_request_date
        ? values.customer_request_date.format("YYYY-MM-DD")
        : null,
      responsible_engineer_id: values.responsible_engineer_id ?? null,
      is_warranty: values.is_warranty,
      received_at: values.received_at
        ? values.received_at.format("YYYY-MM-DD")
        : dayjs().format("YYYY-MM-DD"),
      fixed_at: values.fixed_at ? values.fixed_at.format("YYYY-MM-DD") : null,
    };

    if (ticketId) {
      const uploaded = await (updateAsync as any)({
        id: Number(ticketId),
        ...payload,
        newAttachments: newFiles,
        removedAttachmentIds: removedIds,
        updatedAttachments: Object.entries(changedTypes).map(([id, type]) => ({
          id,
          type_id: type,
        })),
      });
        if (uploaded?.length) {
          appendRemote(
            uploaded.map((u) => ({
              id: u.id,
              name:
                u.original_name ||
                u.storage_path.split("/").pop() ||
                "file",
              original_name: u.original_name ?? null,
              path: u.storage_path,
              url: u.file_url,
              type: u.file_type,
              attachment_type_id: u.attachment_type_id ?? null,
            }))
          );
        }
      markPersisted();
      onCreated?.();
    } else {
      await (create.mutateAsync as any)({
        ...payload,
        attachments: newFiles.map((f) => ({ file: f.file, type_id: f.type_id })),
      });
      onCreated?.();
      reset();
      resetAttachments();
    }
  };

  return (
    <form onSubmit={handleSubmit(submit as SubmitHandler<TicketFormValues>)} noValidate>
      <Stack spacing={2} sx={{ maxWidth: embedded ? "none" : 640 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <Controller
            name="project_id"
            control={control}
            rules={{ required: true }}
            render={({ field, fieldState }) => (
              <FormControl
                fullWidth
                required
                error={!!fieldState.error}
                sx={highlight('project_id')}
              >
              <InputLabel id="project-label">Проект</InputLabel>
              <Select
                {...field}
                labelId="project-label"
                label="Проект"
                displayEmpty
                value={field.value ?? ""}
                onChange={(e) => {
                  const val = String(e.target.value);
                  field.onChange(val === "" ? null : Number(val));
                }}
              >
                {!isEdit && (
                  <MenuItem value="">
                    <em>Не выбрано</em>
                  </MenuItem>
                )}
                {projects.map((p) => (
                  <MenuItem key={p.id} value={p.id}>
                    {p.name}
                  </MenuItem>
                ))}
              </Select>
              </FormControl>
            )}
          />
          <Controller
            name="unit_ids"
            control={control}
            rules={{ required: true }}
            render={({ field, fieldState }) => (
              <FormControl
                fullWidth
                required
                error={!!fieldState.error}
                sx={highlight('unit_ids')}
              >
              <InputLabel id="units-label">Объекты</InputLabel>
              <Select
                {...field}
                labelId="units-label"
                label="Объекты"
                multiple
                value={field.value}
                onChange={(e) =>
                  field.onChange(
                    typeof e.target.value === "string"
                      ? e.target.value.split(",").map(Number)
                      : e.target.value,
                  )
                }
              >
                {units.map((u) => (
                  <MenuItem key={u.id} value={u.id}>
                    {u.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          />
        </Stack>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <Controller
            name="responsible_engineer_id"
            control={control}
            rules={{ required: true }}
            render={({ field, fieldState }) => (
              <FormControl
                fullWidth
                required
                error={!!fieldState.error}
                sx={highlight('responsible_engineer_id')}
              >
              <InputLabel id="engineer-label">Ответственный инженер</InputLabel>
              <Select
                {...field}
                labelId="engineer-label"
                label="Ответственный инженер"
                displayEmpty
                value={field.value ?? ""}
                onChange={(e) => {
                  const val = e.target.value;
                  field.onChange(val === "" ? null : val);
                }}
              >
                {!isEdit && (
                  <MenuItem value="">
                    <em>Не указано</em>
                  </MenuItem>
                )}
                {users.map((u) => (
                  <MenuItem key={u.id} value={u.id}>
                    {u.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          />
          <Controller
            name="status_id"
            control={control}
            rules={{ required: true }}
            render={({ field, fieldState }) => (
              <FormControl fullWidth error={!!fieldState.error} sx={highlight('status_id')}>
              <InputLabel id="status-label">Статус</InputLabel>
              <Select
                {...field}
                labelId="status-label"
                label="Статус"
                displayEmpty
                value={field.value ?? ""}
                onChange={(e) => {
                  const val = String(e.target.value);
                  field.onChange(val === "" ? null : Number(val));
                }}
              >
                {!isEdit && (
                  <MenuItem value="">
                    <em>Статус не выбран</em>
                  </MenuItem>
                )}
                {statuses.map((s) => (
                  <MenuItem key={s.id} value={s.id}>
                    {s.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          />
        </Stack>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <Controller
            name="type_id"
            control={control}
            rules={{ required: true }}
            render={({ field, fieldState }) => (
              <FormControl fullWidth error={!!fieldState.error} sx={highlight('type_id')}>
              <InputLabel id="type-label">
                {`Тип${deadlineDays ? ` (${deadlineDays} дн.)` : ""}`}
              </InputLabel>
              <Select
                {...field}
                labelId="type-label"
                label={`Тип${deadlineDays ? ` (${deadlineDays} дн.)` : ""}`}
                displayEmpty
                value={field.value ?? ""}
                onChange={(e) => {
                  const val = String(e.target.value);
                  field.onChange(val === "" ? null : Number(val));
                }}
              >
                {!isEdit && (
                  <MenuItem value="">
                    <em>Тип не выбран</em>
                  </MenuItem>
                )}
                {types.map((t) => (
                  <MenuItem key={t.id} value={t.id}>
                    {t.name}
                  </MenuItem>
                ))}
              </Select>
              </FormControl>
            )}
          />
          <Controller
            name="is_warranty"
            control={control}
            render={({ field }) => (
              <FormControlLabel
                control={<Switch {...field} checked={field.value} />}
                label="Гарантийный случай"
                sx={highlight('is_warranty')}
              />
            )}
          />
        </Stack>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <Controller
            name="customer_request_no"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="№ заявки от Заказчика"
                fullWidth
                sx={highlight('customer_request_no')}
              />
            )}
          />
          <Controller
            name="customer_request_date"
            control={control}
            render={({ field }) => (
              <DatePicker
                {...field}
                format="DD.MM.YYYY"
                value={field.value}
                onChange={(d) => field.onChange(d)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    label: 'Дата заявки Заказчика',
                    sx: highlight('customer_request_date'),
                  },
                }}
              />
            )}
          />
        </Stack>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <Controller
            name="received_at"
            control={control}
            rules={{ required: true }}
            render={({ field, fieldState }) => (
              <DatePicker
                {...field}
                format="DD.MM.YYYY"
                value={field.value}
                onChange={(d) => field.onChange(d)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    label: 'Дата получения',
                    required: true,
                    error: !!fieldState.error,
                    sx: highlight('received_at'),
                  },
                }}
              />
            )}
          />
          <Controller
            name="fixed_at"
            control={control}
            rules={{ required: true }}
            render={({ field, fieldState }) => (
              <DatePicker
                {...field}
                format="DD.MM.YYYY"
                value={field.value}
                onChange={(d) => field.onChange(d)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    label: 'Дата устранения',
                    required: true,
                    error: !!fieldState.error,
                    sx: highlight('fixed_at'),
                  },
                }}
              />
            )}
          />
        </Stack>
        <Box>
          {[10, 45, 60].map((d) => (
            <Button
              key={d}
              size="small"
              sx={{ mr: 1, mb: 1 }}
              onClick={() => {
                const rec = getValues("received_at");
                if (rec) setValue("fixed_at", dayjs(rec).add(d, "day"));
              }}
            >
              +{d} дней
            </Button>
          ))}
          {deadlineDays && (
            <Button
              size="small"
              sx={{ mr: 1, mb: 1, bgcolor: "success.main", color: "#fff", '&:hover': { bgcolor: 'success.dark' } }}
              onClick={() => {
                const rec = getValues("received_at");
                if (rec) setValue("fixed_at", dayjs(rec).add(deadlineDays, "day"));
              }}
            >
              +{deadlineDays} дней
            </Button>
          )}
        </Box>
        <Controller
          name="title"
          control={control}
          rules={{ required: true }}
          render={({ field, fieldState }) => (
            <TextField
              {...field}
              label="Краткое описание"
              fullWidth
              required
              error={!!fieldState.error}
              sx={highlight('title')}
            />
          )}
        />
        <Controller
          name="description"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Подробное описание"
              fullWidth
              multiline
              rows={3}
              sx={highlight('description')}
            />
          )}
        />
        <Box sx={attachmentsChanged ? { bgcolor: '#fffbe6', p: 1, borderRadius: 1 } : {}}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Typography variant="subtitle1" sx={{ flexGrow: 1 }}>
              Файлы
            </Typography>
            <Button
              size="small"
              onClick={handleDownloadArchive}
              disabled={!remoteFiles.length && !newFiles.length}
            >
              Скачать архив
            </Button>
          </Box>
          <AttachmentEditorTable
            remoteFiles={remoteFiles.map((f) => ({
              id: String(f.id),
              name: f.original_name ?? f.name,
              path: f.path,
              typeId: changedTypes[f.id] ?? f.attachment_type_id,
              typeName: f.attachment_type_name,
              mime: f.type,
            }))}
            newFiles={newFiles.map((f) => ({
              file: f.file,
              typeId: f.type_id,
              mime: f.file.type,
            }))}
            attachmentTypes={attachmentTypes}
            onRemoveRemote={(id) => removeRemote(String(id))}
            onRemoveNew={removeNew}
            onChangeRemoteType={changeRemoteType}
            onChangeNewType={changeNewType}
            getSignedUrl={(path, name) => signedUrl(path, name)}
          />
          <Button variant="outlined" size="small" component="label" sx={{ mt: 1 }}>
            Загрузить ещё документы
            <input
              type="file"
              multiple
              hidden
              onChange={(e) => {
                const files = Array.from(e.target.files || []);
                if (files.length) addFiles(files as File[]);
                e.target.value = '';
              }}
            />
          </Button>
        </Box>
        <DialogActions sx={{ px: 0 }}>
          <Button variant="text" onClick={handleCancel} disabled={isSubmitting}>
            Отмена
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isSubmitting || (isEdit && !hasChanges)}
            startIcon={isSubmitting && <CircularProgress size={18} />}
          >
            Сохранить
          </Button>
        </DialogActions>
      </Stack>
    </form>
  );
}
