// src/entities/ticket.js
// -----------------------------------------------------------------------------
// CRUD-hooks для «Замечаний» + работа с вложениями Supabase Storage
// -----------------------------------------------------------------------------
/* eslint-disable import/prefer-default-export */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import "dayjs/locale/ru";

import { supabase } from "@/shared/api/supabaseClient";
import {
  addTicketAttachments,
  getAttachmentsByIds,
} from "@/entities/attachment";
import { useNotify } from "@/shared/hooks/useNotify";
import { useProjectId } from "@/shared/hooks/useProjectId";
import { useAuthStore } from "@/shared/store/authStore";

const LINKS_TABLE = "ticket_links";

// ──────────────────────────── constants ────────────────────────────
let ATTACH_BUCKET =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_ATTACH_BUCKET) ||
  process.env.REACT_APP_ATTACH_BUCKET ||
  "attachments";

try {
  if (ATTACH_BUCKET.includes("://")) {
    const { pathname } = new URL(ATTACH_BUCKET);
    const parts = pathname.split("/").filter(Boolean);
    if (parts.length) ATTACH_BUCKET = parts[parts.length - 1];
  }
} catch {
  /* ignore invalid URL */
}

// Если по ошибке указали только базовый путь «s3», используем корзину
// «attachments», которая настроена в Supabase.
if (ATTACH_BUCKET.toLowerCase() === "s3") {
  ATTACH_BUCKET = "attachments";
}

// ──────────────────────────── helpers ──────────────────────────────
export const slugify = (str) =>
  str
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[А-ЯЁ]/gi, (c) => {
      const map = {
        а: "a",
        б: "b",
        в: "v",
        г: "g",
        д: "d",
        е: "e",
        ё: "e",
        ж: "zh",
        з: "z",
        и: "i",
        й: "y",
        к: "k",
        л: "l",
        м: "m",
        н: "n",
        о: "o",
        п: "p",
        р: "r",
        с: "s",
        т: "t",
        у: "u",
        ф: "f",
        х: "h",
        ц: "c",
        ч: "ch",
        ш: "sh",
        щ: "sch",
        ъ: "",
        ы: "y",
        ь: "",
        э: "e",
        ю: "yu",
        я: "ya",
      };
      return map[c.toLowerCase()] ?? "";
    })
    .replace(/[^0-9a-z._/-]+/gi, "_")
    .replace(/_+/g, "_")
    .toLowerCase();

export async function uploadAttachment(file, projectId, ticketId) {
  const safe = slugify(file.name);
  // При загрузке замечаний файлы помещаем в папку tickets/<id>
  const path = `tickets/${ticketId}/${Date.now()}_${safe}`;

  const { error } = await supabase.storage
    .from(ATTACH_BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type });

  if (error?.message?.includes("Bucket not found")) {
    throw new Error(`Storage bucket «${ATTACH_BUCKET}» отсутствует.`);
  }
  if (error) throw error;

  const {
    data: { publicUrl },
  } = supabase.storage.from(ATTACH_BUCKET).getPublicUrl(path);

  return { path, type: file.type, url: publicUrl };
}

export async function signedUrl(path, filename = "") {
  const { data, error } = await supabase.storage
    .from(ATTACH_BUCKET)
    .createSignedUrl(path, 60, { download: filename || undefined });
  if (error) throw error;
  return data.signedUrl;
}

// ──────────────────────────── mapper ───────────────────────────────
function mapTicket(r) {
  const atts = Array.isArray(r.attachments) ? r.attachments : [];

  const attachments = atts.map((a) => {
    let name = a.original_name;
    if (!name) {
      try {
        name = decodeURIComponent(
          a.storage_path.split("/").pop()?.replace(/^\d+_/, "") || a.storage_path,
        );
      } catch {
        name = a.storage_path;
      }
    }
    return {
      id: a.id,
      path: a.storage_path,
      original_name: a.original_name ?? null,
      name,
      url: a.file_url,
      type: a.file_type,
      attachment_type_id: a.attachment_type_id ?? null,
    };
  });

  const toDayjs = (d) => (d ? (dayjs(d).isValid() ? dayjs(d) : null) : null);

  return {
    id: r.id,
    parentId: r.parent_id ?? null,
    projectId: r.project_id,
    unitIds: r.unit_ids || [],
    statusId: r.status_id,
    projectName: r.projects?.name ?? "—",
    unitNames: [],
    defectIds: r.defect_ids || [],
    statusName: r.ticket_statuses?.name ?? "—",
    statusColor: r.ticket_statuses?.color ?? null,
    title: r.title,
    description: r.description,
    customerRequestNo: r.customer_request_no,
    customerRequestDate: toDayjs(r.customer_request_date),
    responsibleEngineerId: r.responsible_engineer_id,
    createdBy: r.created_by,
    isWarranty: r.is_warranty,
    isClosed: r.is_closed,
    hasAttachments: attachments.length > 0,
    attachments,
    createdAt: toDayjs(r.created_at),
    receivedAt: toDayjs(r.received_at),
    fixedAt: toDayjs(r.fixed_at),
  };
}

// ──────────────────────────── queries ─────────────────────────────
export function useTickets() {
  const projectId = useProjectId();
  return useQuery({
    queryKey: ["tickets", projectId],
    enabled: !!projectId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tickets")
        .select(
          `
          id, project_id, unit_ids, defect_ids, status_id, title, description,
          customer_request_no, customer_request_date, responsible_engineer_id,
          created_by, is_warranty, is_closed, created_at, received_at, fixed_at,
          attachment_ids,
          projects (id, name),
          ticket_statuses (id, name, color)
        `,
        )
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const allIds = Array.from(
        new Set((data ?? []).flatMap((t) => t.attachment_ids || [])),
      );
      let filesMap = {};
      if (allIds.length) {
        const files = await getAttachmentsByIds(allIds);
        files.forEach((f) => {
          filesMap[f.id] = {
            id: f.id,
            storage_path: f.storage_path,
            original_name: f.original_name,
            file_url: f.file_url,
            file_type: f.file_type,
            attachment_type_id: f.attachment_type_id ?? null,
          };
        });
      }

      const { data: links, error: linkErr } = await supabase
        .from(LINKS_TABLE)
        .select('parent_id, child_id');
      if (linkErr) throw linkErr;
      const linkMap = new Map();
      (links ?? []).forEach((lnk) => linkMap.set(lnk.child_id, lnk.parent_id));

      const result = [];
      for (const r of data ?? []) {
        const atts = (r.attachment_ids || [])
          .map((i) => filesMap[i])
          .filter(Boolean);
        if (atts.length !== (r.attachment_ids || []).length) {
          const existIds = atts.map((a) => a.id);
          await supabase
            .from("tickets")
            .update({ attachment_ids: existIds })
            .eq("id", r.id)
            .eq("project_id", projectId);
          r.attachment_ids = existIds;
        }
        result.push(
          mapTicket({ ...r, attachments: atts, parent_id: linkMap.get(r.id) })
        );
      }
      return result;
    },
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
  });
}

// ──────────────────────────── create ──────────────────────────────
export function useCreateTicket() {
  const projectId = useProjectId();
  const userId = useAuthStore((s) => s.profile?.id ?? null);
  const profile = useAuthStore((s) => s.profile); // ← получаем весь профиль
  const qc = useQueryClient();
  const notify = useNotify();

  return useMutation({
    mutationFn: async ({ attachments = [], ...dto }) => {
      // CHANGE: Проверка на наличие userId/profie
      if (!profile || !userId) {
        throw new Error(
          "Профиль пользователя не загружен. Попробуйте обновить страницу или повторно войти.",
        );
      }

      const { data: newTicket, error } = await supabase
        .from("tickets")
        .insert({
          ...dto,
          project_id: dto.project_id ?? projectId,
          created_by: userId,
        })
        .select("id, project_id")
        .single();

      if (error) throw error;

      let ids = [];
      if (attachments.length) {
        const prepared = attachments.map((f) =>
          "file" in f
            ? { file: f.file, type_id: f.type_id ?? null }
            : { file: f, type_id: null },
        );
        const uploaded = await addTicketAttachments(
          prepared,
          projectId,
          newTicket.id,
        );
        ids = uploaded.map((u) => u.id);
        await supabase
          .from("tickets")
          .update({ attachment_ids: ids })
          .eq("id", newTicket.id);
      }
      return { ...newTicket, attachment_ids: ids };
    },
    onSuccess: (_, vars) => {
      const pid = vars.project_id ?? projectId;
      qc.invalidateQueries({ queryKey: ["tickets", pid] });
      qc.invalidateQueries({ queryKey: ["tickets-simple", pid] });
      notify.success("Замечание успешно создано");
    },
    onError: (e) => notify.error(`Ошибка создания замечания: ${e.message}`),
  });
}

// ───────────────────────── one ticket / update ───────────────────
export function useTicket(ticketId) {
  const projectId = useProjectId();
  const qc = useQueryClient();
  const notify = useNotify();
  const id = Number(ticketId);

  const query = useQuery({
    queryKey: ["ticket", id, projectId],
    enabled: !!id && !!projectId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tickets")
        .select(
          `
          id, project_id, unit_ids, defect_ids, status_id, title, description,
          customer_request_no, customer_request_date, responsible_engineer_id,
          created_by, is_warranty, is_closed, created_at, received_at, fixed_at,
          attachment_ids,
          projects (id, name),
          ticket_statuses (id, name, color)
        `,
        )
        .eq("id", id)
        .eq("project_id", projectId)
        .single();
      if (error) throw error;
      let atts = [];
      if (data?.attachment_ids?.length) {
        const files = await getAttachmentsByIds(data.attachment_ids);
        atts = files.map((f) => ({
          id: f.id,
          storage_path: f.storage_path,
          original_name: f.original_name,
          file_url: f.file_url,
          file_type: f.file_type,
          attachment_type_id: f.attachment_type_id ?? null,
        }));
        const existIds = files.map((f) => f.id);
        if (existIds.length !== data.attachment_ids.length) {
          await supabase
            .from("tickets")
            .update({ attachment_ids: existIds })
            .eq("id", id)
            .eq("project_id", projectId);
          data.attachment_ids = existIds;
        }
      }
      const { data: link } = await supabase
        .from(LINKS_TABLE)
        .select('parent_id')
        .eq('child_id', id)
        .maybeSingle();
      return data ? mapTicket({ ...data, attachments: atts, parent_id: link?.parent_id }) : null;
    },
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
  });

  const update = useMutation({
    mutationFn: async ({
      id: updId,
      newAttachments = [],
      removedAttachmentIds = [],
      updatedAttachments = [],
      ...updates
    }) => {
      if (!updId) throw new Error("ID тикета обязателен");

      // удаляем вложения
      const { data: current } = await supabase
        .from("tickets")
        .select("attachment_ids")
        .eq("id", updId)
        .single();
      let ids = current?.attachment_ids ?? [];

      if (removedAttachmentIds.length) {
        const { data: atts } = await supabase
          .from("attachments")
          .select("storage_path")
          .in("id", removedAttachmentIds);
        if (atts?.length) {
          await supabase.storage
            .from(ATTACH_BUCKET)
            .remove(atts.map((a) => a.storage_path));
        }
        await supabase
          .from("attachments")
          .delete()
          .in("id", removedAttachmentIds);
        ids = ids.filter((i) => !removedAttachmentIds.includes(String(i)));
      }

      // обновляем тикет
      if (Object.keys(updates).length) {
        const { error } = await supabase
          .from("tickets")
          .update(updates)
          .eq("id", updId)
          .eq("project_id", projectId);
        if (error) throw error;
      }

      if (updatedAttachments.length) {
        for (const a of updatedAttachments) {
          await supabase
            .from("attachments")
            .update({ attachment_type_id: a.type_id })
            .eq("id", Number(a.id));
        }
      }

      // новые вложения
      let uploaded = [];
      if (newAttachments.length) {
        uploaded = await addTicketAttachments(
          newAttachments.map((f) =>
            "file" in f ? { file: f.file, type_id: f.type_id ?? null } : { file: f, type_id: null },
          ),
          projectId,
          updId,
        );
        ids = ids.concat(uploaded.map((u) => u.id));
      }

      if (
        Object.keys(updates).length ||
        removedAttachmentIds.length ||
        newAttachments.length ||
        updatedAttachments.length
      ) {
        const { error } = await supabase
          .from("tickets")
          .update({ ...updates, attachment_ids: ids })
          .eq("id", updId)
          .eq("project_id", projectId);
        if (error) throw error;
      }
      return uploaded;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["tickets", projectId] });
      qc.invalidateQueries({ queryKey: ["ticket", vars.id, projectId] });
      notify.success("Замечание успешно обновлено");
    },
    onError: (e) => notify.error(`Ошибка обновления замечания: ${e.message}`),
  });

  return {
    ...query,
    updateAsync: update.mutateAsync,
    updating: update.isPending,
  };
}

// ──────────────────────────── delete ──────────────────────────────
export function useDeleteTicket() {
  const projectId = useProjectId();
  const qc = useQueryClient();
  const notify = useNotify();

  return useMutation({
    mutationFn: async (ticketId) => {
      const { data: ticket } = await supabase
        .from("tickets")
        .select("attachment_ids, defect_ids")
        .eq("id", ticketId)
        .single();
      const ids = ticket?.attachment_ids || [];
      if (ids.length) {
        const files = await getAttachmentsByIds(ids);
        if (files?.length) {
          await supabase.storage
            .from(ATTACH_BUCKET)
            .remove(files.map((f) => f.storage_path));
        }
        await supabase.from("attachments").delete().in("id", ids);
      }

      const defectIds = ticket?.defect_ids || [];
      if (defectIds.length) {
        const { data: defects } = await supabase
          .from("defects")
          .select("id, attachment_ids")
          .in("id", defectIds);
        const attIds = Array.from(
          new Set(
            (defects ?? []).flatMap((d) => d.attachment_ids || [])
          ),
        );
        if (attIds.length) {
          const files = await getAttachmentsByIds(attIds);
          if (files?.length) {
            await supabase.storage
              .from(ATTACH_BUCKET)
              .remove(files.map((f) => f.storage_path));
          }
          await supabase.from("attachments").delete().in("id", attIds);
        }
        await supabase.from("defects").delete().in("id", defectIds);
      }

      await supabase
        .from("tickets")
        .delete()
        .eq("id", ticketId)
        .eq("project_id", projectId);
    },
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ["tickets", projectId] });
      qc.invalidateQueries({
        queryKey: ["ticket", id, projectId],
        exact: true,
      });
      notify.success("Замечание удалено вместе с вложениями");
    },
    onError: (e) => notify.error(`Ошибка удаления замечания: ${e.message}`),
  });
}

// -----------------------------------------------------------------------------
// Получить все замечания без фильтрации по проекту (для статистики)
// -----------------------------------------------------------------------------
export function useAllTicketsSimple() {
  return useQuery({
    queryKey: ["tickets-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tickets")
        .select("id, status_id");
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 5 * 60_000,
  });
}

// -----------------------------------------------------------------------------
// Получить список замечаний текущего проекта (минимальный набор полей)
// -----------------------------------------------------------------------------
export function useTicketsSimple() {
  const projectId = useProjectId();
  return useQuery({
    queryKey: ["tickets-simple", projectId],
    enabled: !!projectId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tickets")
        .select("id, project_id, unit_ids, defect_ids")
        .eq("project_id", projectId);
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 5 * 60_000,
  });
}

// -----------------------------------------------------------------------------
// Обновить статус замечания
// -----------------------------------------------------------------------------
export function useUpdateTicketStatus() {
  const projectId = useProjectId();
  const qc = useQueryClient();
  const notify = useNotify();

  return useMutation({
    mutationFn: async ({ id, statusId }) => {
      const { data, error } = await supabase
        .from("tickets")
        .update({ status_id: statusId })
        .eq("id", id)
        .eq("project_id", projectId)
        .select("id, status_id")
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["tickets", projectId] });
      qc.invalidateQueries({
        queryKey: ["ticket", vars.id, projectId],
        exact: true,
      });
      notify.success("Статус обновлён");
    },
    onError: (e) => notify.error(`Ошибка обновления статуса: ${e.message}`),
  });
}

// -----------------------------------------------------------------------------
// Обновить признак закрытого замечания
// -----------------------------------------------------------------------------
export function useUpdateTicketClosed() {
  const projectId = useProjectId();
  const qc = useQueryClient();
  const notify = useNotify();

  return useMutation({
    mutationFn: async ({ id, isClosed }) => {
      const { data, error } = await supabase
        .from("tickets")
        .update({ is_closed: isClosed })
        .eq("id", id)
        .eq("project_id", projectId)
        .select("id, is_closed, defect_ids")
        .single();
      if (error) throw error;

      if (isClosed && data?.defect_ids?.length) {
        const { data: statuses } = await supabase
          .from('defect_statuses')
          .select('id, name');
        const closedId = statuses?.find((s) => /закры/i.test(s.name))?.id ?? null;
        const update = closedId
          ? { defect_status_id: closedId, is_fixed: true }
          : { is_fixed: true };
        await supabase.from('defects').update(update).in('id', data.defect_ids);
        qc.invalidateQueries({ queryKey: ['defects'] });
      }
      return { id: data.id, is_closed: data.is_closed };
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["tickets", projectId] });
      qc.invalidateQueries({
        queryKey: ["ticket", vars.id, projectId],
        exact: true,
      });
      notify.success("Статус закрытия обновлён");
    },
    onError: (e) => notify.error(`Ошибка обновления: ${e.message}`),
  });
}

// -----------------------------------------------------------------------------
// Работа со связями замечаний
// -----------------------------------------------------------------------------
export function useTicketLinks() {
  return useQuery({
    queryKey: [LINKS_TABLE],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(LINKS_TABLE)
        .select('id, parent_id, child_id');
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 5 * 60_000,
  });
}

export function useLinkTickets() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ parentId, childIds }) => {
      const ids = childIds.map((c) => Number(c));
      if (!ids.length) return;
      await supabase.from(LINKS_TABLE).delete().in('child_id', ids);
      const rows = ids.map((child_id) => ({ parent_id: Number(parentId), child_id }));
      await supabase.from(LINKS_TABLE).insert(rows);
      qc.invalidateQueries({ queryKey: [LINKS_TABLE] });
      qc.invalidateQueries({ queryKey: ['tickets'] });
    },
  });
}

export function useUnlinkTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const childId = Number(id);
      await supabase.from(LINKS_TABLE).delete().eq('child_id', childId);
      qc.invalidateQueries({ queryKey: [LINKS_TABLE] });
      qc.invalidateQueries({ queryKey: ['tickets'] });
    },
  });
}
