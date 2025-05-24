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
import { uploadAttachment, signedUrl } from "@/entities/ticket";

export default function TicketListDialog({
  open,
  unit,
  onClose,
  onTicketsChanged,
}) {
  const notify = useNotify();
  const queryClient = useQueryClient();
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
        .select("id, title, status_id, created_at, project_id")
        .eq("unit_id", unit.id)
        .order("created_at", { ascending: false });
      setTickets(t || []);

      const { data: s } = await supabase
        .from("ticket_statuses")
        .select("id, name, color")
        .order("id", { ascending: true });
      setStatuses(s || []);

      // attachments: все файлы по этим tickets
      const ids = (t || []).map((tk) => tk.id);
      if (ids.length > 0) {
        const { data: files } = await supabase
          .from("attachments")
          .select(
            "id, ticket_id, file_url, file_type, uploaded_at, is_fix_act, storage_path",
          )
          .in("ticket_id", ids);
        // группируем по ticket_id
        const map = {};
        (files || []).forEach((a) => {
          if (!map[a.ticket_id]) map[a.ticket_id] = [];
          map[a.ticket_id].push(a);
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
    if (unit?.project_id) {
      queryClient.invalidateQueries({ queryKey: ["tickets", unit.project_id] });
    } else {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
    }
    // ЯВНО ТРИГГЕРИМ ОБНОВЛЕНИЕ ВНЕШНЕГО ХРАНИЛИЩА (шахматки)
    if (onTicketsChanged) onTicketsChanged();
  };

  // Загрузка файла акта (строго как обычный attachment, только is_fix_act: true)
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
      const { path, url, type } = await uploadAttachment(
        file,
        projectId,
        ticketId,
      );
      const { error: insErr } = await supabase.from("attachments").insert({
        ticket_id: ticketId,
        file_url: url,
        file_type: type,
        is_fix_act: true,
        storage_path: path,
      });
      if (insErr) throw insErr;
      notify.success("Файл успешно прикреплён");
      setAttachments((prev) => ({
        ...prev,
        [ticketId]: [
          ...(prev[ticketId] || []),
          {
            file_url: url,
            file_type: type,
            is_fix_act: true,
            uploaded_at: new Date().toISOString(),
            storage_path: path,
          },
        ],
      }));
      // можно добавить onTicketsChanged() для upload, если нужно
    } catch (error) {
      notify.error(error.message || "Ошибка загрузки файла");
    }
  };

  const handleDownload = async (a) => {
    try {
      setDownloadingId(a.id);
      const filename = a.storage_path.split("/").pop() || "attachment";
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
        data-oid="stnd530"
      >
        <DialogTitle data-oid="rfltqrs">
          Все замечания по квартире {unit?.name}
        </DialogTitle>
        <DialogContent data-oid="ai-6-bs">
          {loading ? (
            <Box sx={{ py: 4, textAlign: "center" }} data-oid="wuwgaua">
              <CircularProgress data-oid="hm-dupm" />
            </Box>
          ) : (
            <>
              <Table size="small" sx={{ my: 2 }} data-oid="jh8-jp3">
                <TableHead data-oid="wx6rzp8">
                  <TableRow data-oid="bi:5w8e">
                    <TableCell data-oid="n6t3gj6">№</TableCell>
                    <TableCell data-oid="aacxm-.">Заголовок</TableCell>
                    <TableCell data-oid="qehzoh.">Статус</TableCell>
                    <TableCell data-oid="bgo5ddt">Акты об устранении</TableCell>
                    <TableCell data-oid="padwwd-">Действия</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody data-oid="abrcacp">
                  {tickets.map((t, i) => (
                    <TableRow key={t.id} data-oid="ps9qpfw">
                      <TableCell sx={{ width: 50 }} data-oid="t5hp_pr">
                        {i + 1}
                      </TableCell>
                      <TableCell
                        sx={{ minWidth: 160, maxWidth: 300 }}
                        data-oid="jnp33n5"
                      >
                        {t.title}
                      </TableCell>
                      <TableCell sx={{ minWidth: 180 }} data-oid=":bueeof">
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
                          data-oid="stgyeqb"
                        >
                          {statuses.map((s) => (
                            <MenuItem
                              key={s.id}
                              value={String(s.id)}
                              data-oid=":xyrsqn"
                            >
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
                                data-oid="kd9s5f6"
                              />

                              {s.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </TableCell>
                      <TableCell sx={{ minWidth: 180 }} data-oid="7ehv58x">
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            flexWrap: "wrap",
                            gap: 1,
                          }}
                          data-oid="pa8ek.."
                        >
                          {(
                            attachments[t.id]?.filter((a) => a.is_fix_act) || []
                          ).map((a, idx) => (
                            <Chip
                              key={a.file_url}
                              icon={
                                <AttachFileIcon
                                  sx={{ fontSize: 16 }}
                                  data-oid="e:27358"
                                />
                              }
                              label={
                                downloadingId === a.id ? (
                                  <CircularProgress
                                    size={16}
                                    data-oid="ho8.jl."
                                  />
                                ) : (
                                  `Акт ${idx + 1}`
                                )
                              }
                              size="small"
                              variant="outlined"
                              clickable
                              onClick={() => handleDownload(a)}
                              sx={{ mr: 1, mb: 0.2, cursor: "pointer" }}
                              data-oid="q1rmk.8"
                            />
                          ))}
                          <input
                            type="file"
                            accept="application/pdf,image/*"
                            style={{ display: "none" }}
                            id={`file-upload-${t.id}`}
                            onChange={(e) => handleUploadFile(t.id, e)}
                            data-oid="zit0pj0"
                          />

                          <label
                            htmlFor={`file-upload-${t.id}`}
                            data-oid=":s61vo:"
                          >
                            <IconButton
                              component="span"
                              size="small"
                              color="primary"
                              data-oid="7hmkab3"
                            >
                              <CloudUploadIcon
                                fontSize="small"
                                data-oid="y04xbb5"
                              />
                            </IconButton>
                          </label>
                        </Box>
                      </TableCell>
                      <TableCell data-oid="6j29z:4">
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<InfoOutlinedIcon data-oid="9ol_lfc" />}
                          onClick={() =>
                            setOpenTicketForm({ open: true, ticket: t })
                          }
                          data-oid="zf5seb5"
                        >
                          Подробно
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {tickets.length === 0 && (
                <Typography
                  sx={{ color: "#777", py: 2, textAlign: "center" }}
                  data-oid=".jc_xa1"
                >
                  Нет замечаний по данной квартире
                </Typography>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions data-oid="tn5c09j">
          <Button onClick={onClose} data-oid="ghp8h59">
            Закрыть
          </Button>
        </DialogActions>
      </Dialog>

      {openTicketForm.open && (
        <Dialog
          open={openTicketForm.open}
          onClose={() => setOpenTicketForm({ open: false, ticket: null })}
          maxWidth="sm"
          fullWidth
          data-oid="apja_ff"
        >
          <DialogTitle data-oid="-f7bc6b">Замечание</DialogTitle>
          <DialogContent data-oid="t.si:sm">
            <TicketForm
              embedded
              ticketId={openTicketForm.ticket?.id} // передаем явно!
              onCancel={() => setOpenTicketForm({ open: false, ticket: null })}
              onCreated={() => {
                setOpenTicketForm({ open: false, ticket: null });
                if (onTicketsChanged) onTicketsChanged();
              }}
              data-oid="y3_4j4x"
            />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
