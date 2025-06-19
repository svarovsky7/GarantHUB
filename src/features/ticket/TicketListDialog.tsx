import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Select,
  MenuItem,
  CircularProgress,
  Chip,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { supabase } from "@/shared/api/supabaseClient";
import { useNotify } from "@/shared/hooks/useNotify";
import { useQueryClient } from "@tanstack/react-query";
import TicketForm from "@/features/ticket/TicketForm";
import { signedUrl } from "@/entities/ticket";
import { addTicketAttachments, getAttachmentsByIds } from "@/entities/attachment";
import { useProjectFilter } from "@/shared/hooks/useProjectFilter";
import { ticketsKey } from "@/shared/utils/queryKeys";

export default function TicketListDialog({
  open,
  unit,
  onClose,
  onTicketsChanged,
}) {
  const notify = useNotify();
  const queryClient = useQueryClient();
  const { projectIds } = useProjectFilter();
  const [tickets, setTickets] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [attachments, setAttachments] = useState({});
  const [loading, setLoading] = useState(true);
  const [openTicketForm, setOpenTicketForm] = useState({
    open: false,
    ticket: null,
  });
  const [downloadingId, setDownloadingId] = useState(null);

  // Загрузка замечаний, статусов и файлов
  useEffect(() => {
    if (!unit?.id || !open) return;
    setLoading(true);
    (async () => {
      const { data: t } = await supabase
        .from("tickets")
        .select("id, title, status_id, created_at, project_id, attachment_ids")
        .contains("unit_ids", [unit.id])
        .order("created_at", { ascending: false });
      setTickets(t || []);

      const { data: s } = await supabase
        .from("ticket_statuses")
        .select("id, name, color")
        .order("id", { ascending: true });
      setStatuses(s || []);

      const allIds = (t || [])
        .flatMap((tk) => tk.attachment_ids || [])
        .filter(Boolean);
      if (allIds.length) {
        const files = await getAttachmentsByIds(allIds);
        const map = {};
        (t || []).forEach((tk) => {
          map[tk.id] = (tk.attachment_ids || [])
            .map((id) => files.find((f) => f.id === id))
            .filter(Boolean);
        });
        setAttachments(map);
      } else {
        setAttachments({});
      }
      setLoading(false);
    })();
  }, [unit, open]);

  // Обновление статуса
  const handleStatusChange = async (ticketId, newStatusId) => {
    await supabase
      .from("tickets")
      .update({ status_id: newStatusId })
      .eq("id", ticketId);
    setTickets((ts) =>
      ts.map((tk) =>
        tk.id === ticketId ? { ...tk, status_id: newStatusId } : tk,
      ),
    );
    notify.success("Статус обновлён");
    // Инвалидируем кэш тикетов
    const pid = unit?.project_id ?? null;
    queryClient.invalidateQueries({ queryKey: ticketsKey(pid, projectIds) });
    // ЯВНО ТРИГГЕРИМ ОБНОВЛЕНИЕ ВНЕШНЕГО ХРАНИЛИЩА (шахматки)
    if (onTicketsChanged) onTicketsChanged();
  };

  // Загрузка файла акта
  const handleUploadFile = async (ticketId, e) => {
    const file = e.target.files[0];
    if (!file) return;
    const ticket = tickets.find((tk) => tk.id === ticketId);
    const projectId = ticket?.project_id || unit?.project_id;
    if (!projectId) {
      notify.error("Не удалось определить проект для загрузки файла");
      return;
    }
    try {
      const uploaded = await addTicketAttachments(
        [{ file, type_id: null }],
        projectId,
        ticketId,
      );
      await supabase
        .from("tickets")
        .update({ attachment_ids: uploaded.map((u) => u.id) })
        .eq("id", ticketId);
      notify.success("Файл успешно прикреплён");
      setAttachments((prev) => ({
        ...prev,
        [ticketId]: [...(prev[ticketId] || []), ...uploaded],
      }));
      // можно добавить onTicketsChanged() для upload, если нужно
    } catch (error) {
      notify.error(error.message || "Ошибка загрузки файла");
    }
  };

  const handleDownload = async (a) => {
    try {
      setDownloadingId(a.id);
      const filename = a.original_name || a.storage_path.split("/").pop() || "attachment";
      const url = await signedUrl(a.storage_path, filename);
      const link = document.createElement("a");
      link.href = url;
          link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      notify.error("Ошибка скачивания файла");
    } finally {
      setDownloadingId(null);
    }
  };

  const getStatus = (id) => statuses.find((s) => String(s.id) === String(id));

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { minWidth: 700 } }}
      >
        <DialogTitle>Все замечания по квартире {unit?.name}</DialogTitle>
        <DialogContent>
          {loading ? (
            <Box sx={{ py: 4, textAlign: "center" }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <Table size="small" sx={{ my: 2 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>№</TableCell>
                    <TableCell>Заголовок</TableCell>
                    <TableCell>Статус</TableCell>
                    <TableCell>Акты об устранении</TableCell>
                    <TableCell>Действия</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tickets.map((t, i) => (
                    <TableRow key={t.id}>
                      <TableCell sx={{ width: 50 }}>{i + 1}</TableCell>
                      <TableCell sx={{ minWidth: 160, maxWidth: 300 }}>
                        {t.title}
                      </TableCell>
                      <TableCell sx={{ minWidth: 180 }}>
                        <Select
                          size="small"
                          value={String(t.status_id) || ""}
                          onChange={(e) =>
                            handleStatusChange(t.id, e.target.value)
                          }
                          sx={{
                            minWidth: 130,
                            bgcolor: getStatus(t.status_id)?.color || undefined,
                            fontWeight: 600,
                          }}
                        >
                          {statuses.map((s) => (
                            <MenuItem key={s.id} value={String(s.id)}>
                              <Box
                                component="span"
                                sx={{
                                  display: "inline-block",
                                  width: 12,
                                  height: 12,
                                  borderRadius: "50%",
                                  bgcolor: s.color,
                                  mr: 1,
                                  verticalAlign: "middle",
                                }}
                              />

                              {s.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </TableCell>
                      <TableCell sx={{ minWidth: 180 }}>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            flexWrap: "wrap",
                            gap: 1,
                          }}
                        >
                          {(attachments[t.id] || []).map((a) => (
                            <Chip
                              key={a.file_url}
                              icon={<AttachFileIcon sx={{ fontSize: 16 }} />}
                              label={
                                downloadingId === a.id ? (
                                  <CircularProgress size={16} />
                                ) : (
                                  a.original_name || a.storage_path.split('/').pop() || 'file'
                                )
                              }
                              size="small"
                              variant="outlined"
                              clickable
                              onClick={() => handleDownload(a)}
                              sx={{ mr: 1, mb: 0.2, cursor: "pointer" }}
                            />
                          ))}
                          <input
                            type="file"
                            accept="application/pdf,image/*"
                            style={{ display: "none" }}
                            id={`file-upload-${t.id}`}
                            onChange={(e) => handleUploadFile(t.id, e)}
                          />

                          <label htmlFor={`file-upload-${t.id}`}>
                            <IconButton
                              component="span"
                              size="small"
                              color="primary"
                            >
                              <CloudUploadIcon fontSize="small" />
                            </IconButton>
                          </label>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<InfoOutlinedIcon />}
                          onClick={() =>
                            setOpenTicketForm({ open: true, ticket: t })
                          }
                        >
                          Подробно
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {tickets.length === 0 && (
                <Typography sx={{ color: "#777", py: 2, textAlign: "center" }}>
                  Нет замечаний по данной квартире
                </Typography>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Закрыть</Button>
        </DialogActions>
      </Dialog>

      {openTicketForm.open && (
        <Dialog
          open={openTicketForm.open}
          onClose={() => setOpenTicketForm({ open: false, ticket: null })}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Замечание</DialogTitle>
          <DialogContent>
            <TicketForm
              embedded
              ticketId={openTicketForm.ticket?.id} // передаем явно!
              onCancel={() => setOpenTicketForm({ open: false, ticket: null })}
              onCreated={() => {
                setOpenTicketForm({ open: false, ticket: null });
                if (onTicketsChanged) onTicketsChanged();
              }}
            />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
