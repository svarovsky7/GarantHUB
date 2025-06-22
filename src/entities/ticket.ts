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
import { useProjectFilter } from '@/shared/hooks/useProjectFilter';
import { useProjectId } from '@/shared/hooks/useProjectId';
import { useAuthStore } from '@/shared/store/authStore';
import { useRolePermission } from '@/entities/rolePermission';
import type { RoleName } from '@/shared/types/rolePermission';
import { filterByProjects } from '@/shared/utils/projectQuery';
import { ticketsKey, ticketsSimpleKey } from '@/shared/utils/queryKeys';

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
    statusName: r.statuses?.name ?? "—",
    statusColor: r.statuses?.color ?? null,
    title: r.title,
    description: r.description,
    customerRequestNo: r.customer_request_no,
    customerRequestDate: toDayjs(r.customer_request_date),
    responsibleEngineerId: r.responsible_engineer_id,
    createdBy: r.created_by,
    hasAttachments: attachments.length > 0,
    attachments,
    createdAt: toDayjs(r.created_at),
    receivedAt: toDayjs(r.received_at),
    fixedAt: toDayjs(r.fixed_at),
  };
}

// ──────────────────────────── queries ─────────────────────────────
export function useTickets() {
  const { projectId, projectIds, onlyAssigned, enabled } = useProjectFilter();
  const keyProjectId = onlyAssigned ? projectId : null;
  return useQuery({
    queryKey: ticketsKey(keyProjectId, projectIds),
    enabled: onlyAssigned ? enabled : true,
    queryFn: async () => {
      let query = supabase
        .from("tickets")
        .select(
          `
          id, project_id, status_id, title, description,
          customer_request_no, customer_request_date, responsible_engineer_id,
          created_by, created_at, received_at, fixed_at,
          projects (id, name),
          statuses (id, name, color)
        `,
        );
      query = filterByProjects(query, keyProjectId, projectIds, onlyAssigned);
      query = query.order("created_at", { ascending: false });
      const { data, error } = await query;

      if (error) throw error;

      const ids = (data ?? []).map((t: any) => t.id) as number[];

      const { data: unitRows } = ids.length
        ? await supabase
            .from('ticket_units')
            .select('ticket_id, unit_id')
            .in('ticket_id', ids)
        : { data: [] };
      const unitMap: Record<number, number[]> = {};
      (unitRows ?? []).forEach((u: any) => {
        if (!unitMap[u.ticket_id]) unitMap[u.ticket_id] = [];
        unitMap[u.ticket_id].push(u.unit_id);
      });

      const { data: attachRows } = ids.length
        ? await supabase
            .from('ticket_attachments')
            .select(
              'ticket_id, attachments(id, storage_path, file_url:path, file_type:mime_type, original_name)'
            )
            .in('ticket_id', ids)
        : { data: [] };
      const attachMap: Record<number, any[]> = {};
      (attachRows ?? []).forEach((row: any) => {
        const file = row.attachments;
        if (!file) return;
        const arr = attachMap[row.ticket_id] ?? [];
        arr.push(file);
        attachMap[row.ticket_id] = arr;
      });

      const { data: links, error: linkErr } = await supabase
        .from(LINKS_TABLE)
        .select('parent_id, child_id');
      if (linkErr) throw linkErr;
      const linkMap = new Map();
      (links ?? []).forEach((lnk) => linkMap.set(lnk.child_id, lnk.parent_id));

      const result = [];
      for (const r of data ?? []) {
        const atts = attachMap[r.id] ?? [];
        result.push(
          mapTicket({
            ...r,
            unit_ids: unitMap[r.id] ?? [],
            defect_ids: [],
            attachments: atts,
            parent_id: linkMap.get(r.id),
          })
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
  const { projectIds, onlyAssigned } = useProjectFilter();
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
    onSuccess: () => {
      const keyPid = onlyAssigned ? projectId : null;
      qc.invalidateQueries({ queryKey: ticketsKey(keyPid, projectIds) });
      qc.invalidateQueries({ queryKey: ticketsSimpleKey(keyPid, projectIds) });
      notify.success("Замечание успешно создано");
    },
    onError: (e) => notify.error(`Ошибка создания замечания: ${e.message}`),
  });
}

// ───────────────────────── one ticket / update ───────────────────
export function useTicket(ticketId) {
  const projectId = useProjectId();
  const projectIds = useAuthStore((s) => s.profile?.project_ids) ?? [];
  const role = useAuthStore((s) => s.profile?.role as RoleName | undefined);
  const { data: perm } = useRolePermission(role);
  const qc = useQueryClient();
  const notify = useNotify();
  const id = Number(ticketId);

  const query = useQuery({
    queryKey: ["ticket", id, projectId],
    enabled: !!id && (!!projectId || (perm?.only_assigned_project && projectIds.length > 0)),
    queryFn: async () => {
      let tQuery = supabase
        .from("tickets")
        .select(
          `
          id, project_id, status_id, title, description,
          customer_request_no, customer_request_date, responsible_engineer_id,
          created_by, created_at, received_at, fixed_at,
          projects (id, name),
          statuses (id, name, color)
        `,
        )
        .eq("id", id);
      tQuery = filterByProjects(tQuery, projectId, projectIds, perm?.only_assigned_project);
      tQuery = tQuery.single();
      const { data, error } = await tQuery;
      if (error) throw error;

      const { data: units } = await supabase
        .from('ticket_units')
        .select('unit_id')
        .eq('ticket_id', id);
      const unitIds = (units ?? []).map((u: any) => u.unit_id);

      const { data: attachRows } = await supabase
        .from('ticket_attachments')
        .select('attachments(id, storage_path, file_url:path, file_type:mime_type, original_name)')
        .eq('ticket_id', id);
      const atts = (attachRows ?? []).map((row: any) => row.attachments);
      const { data: link } = await supabase
        .from(LINKS_TABLE)
        .select('parent_id')
        .eq('child_id', id)
        .maybeSingle();
      return data
        ? mapTicket({
            ...data,
            unit_ids: unitIds,
            defect_ids: [],
            attachments: atts,
            parent_id: link?.parent_id,
          })
        : null;
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
        let uq = supabase
          .from("tickets")
          .update(updates)
          .eq("id", updId);
        uq = filterByProjects(uq, projectId, projectIds, perm?.only_assigned_project);
        const { error } = await uq;
        if (error) throw error;
      }

      if (updatedAttachments.length) {
        // attachment types are no longer used
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
        let fq = supabase
          .from("tickets")
          .update({ ...updates, attachment_ids: ids })
          .eq("id", updId);
        fq = filterByProjects(fq, projectId, projectIds, perm?.only_assigned_project);
        const { error } = await fq;
        if (error) throw error;
      }
      return uploaded;
    },
    onSuccess: (_, vars) => {
      const keyPid = onlyAssigned ? projectId : null;
      qc.invalidateQueries({ queryKey: ticketsKey(keyPid, projectIds) });
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
/**
 * Удалить замечание вместе с вложениями и связанными дефектами.
 * После успешного удаления инвалидирует кэш замечаний и дефектов.
 */
export function useDeleteTicket() {
  const projectId = useProjectId();
  const projectIds = useAuthStore((s) => s.profile?.project_ids) ?? [];
  const role = useAuthStore((s) => s.profile?.role as RoleName | undefined);
  const { data: perm } = useRolePermission(role);
  const onlyAssigned = !!perm?.only_assigned_project;
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

      let dq = supabase
        .from("tickets")
        .delete()
        .eq("id", ticketId);
      dq = filterByProjects(dq, projectId, projectIds, perm?.only_assigned_project);
      await dq;
    },
    onSuccess: (_, id) => {
      const keyPid = onlyAssigned ? projectId : null;
      qc.invalidateQueries({ queryKey: ticketsKey(keyPid, projectIds) });
      qc.invalidateQueries({
        queryKey: ["ticket", id, projectId],
        exact: true,
      });
      qc.invalidateQueries({ queryKey: ["defects"] });
      qc.invalidateQueries({ queryKey: ["defects-by-ids"] });
      qc.invalidateQueries({ queryKey: ["defects-with-names"] });
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
// Получить список замечаний по всем проектам (минимальный набор полей)
// Используется на странице дефектов при отсутствии ограничения only_assigned_project
// -----------------------------------------------------------------------------
export function useTicketsSimpleAll() {
  return useQuery({
    queryKey: ["tickets-simple-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tickets")
        .select("id, project_id");
      if (error) throw error;
      const ids = (data ?? []).map((r: any) => r.id) as number[];
      const { data: unitRows } = ids.length
        ? await supabase
            .from('ticket_units')
            .select('ticket_id, unit_id')
            .in('ticket_id', ids)
        : { data: [] };
      const unitMap: Record<number, number[]> = {};
      (unitRows ?? []).forEach((u: any) => {
        if (!unitMap[u.ticket_id]) unitMap[u.ticket_id] = [];
        unitMap[u.ticket_id].push(u.unit_id);
      });
      return (data ?? []).map((r: any) => ({
        id: r.id,
        project_id: r.project_id,
        unit_ids: unitMap[r.id] ?? [],
        defect_ids: [],
      }));
    },
    staleTime: 5 * 60_000,
  });
}

// -----------------------------------------------------------------------------
// Получить список замечаний текущего проекта (минимальный набор полей)
// -----------------------------------------------------------------------------
export function useTicketsSimple() {
  const { projectId, projectIds, onlyAssigned, enabled } = useProjectFilter();
  return useQuery({
    queryKey: ticketsSimpleKey(projectId, projectIds),
    enabled,
    queryFn: async () => {
      let q = supabase
        .from("tickets")
        .select("id, project_id");
      q = filterByProjects(q, projectId, projectIds, onlyAssigned);
      const { data, error } = await q;
      if (error) throw error;
      const ids = (data ?? []).map((r: any) => r.id) as number[];
      const { data: unitRows } = ids.length
        ? await supabase
            .from('ticket_units')
            .select('ticket_id, unit_id')
            .in('ticket_id', ids)
        : { data: [] };
      const unitMap: Record<number, number[]> = {};
      (unitRows ?? []).forEach((u: any) => {
        if (!unitMap[u.ticket_id]) unitMap[u.ticket_id] = [];
        unitMap[u.ticket_id].push(u.unit_id);
      });
      return (data ?? []).map((r: any) => ({
        id: r.id,
        project_id: r.project_id,
        unit_ids: unitMap[r.id] ?? [],
        defect_ids: [],
      }));
    },
    staleTime: 5 * 60_000,
  });
}

// -----------------------------------------------------------------------------
// Обновить статус замечания
// -----------------------------------------------------------------------------
export function useUpdateTicketStatus() {
  const projectId = useProjectId();
  const projectIds = useAuthStore((s) => s.profile?.project_ids) ?? [];
  const role = useAuthStore((s) => s.profile?.role as RoleName | undefined);
  const { data: perm } = useRolePermission(role);
  const qc = useQueryClient();
  const notify = useNotify();

  return useMutation({
    mutationFn: async ({ id, statusId, projectId: rowProjectId }) => {
      const pid = rowProjectId ?? projectId;
      let q = supabase
        .from("tickets")
        .update({ status_id: statusId })
        .eq("id", id);
      q = filterByProjects(q, pid, projectIds, perm?.only_assigned_project);
      q = q.select("id, defect_ids").single();
      const { data, error } = await q;
      if (error) throw error;

      const { data: status } = await supabase
        .from('statuses')
        .select('name')
        .eq('id', statusId)
        .eq('entity', 'ticket')
        .maybeSingle();
      const closedTicket = /закры/i.test(status?.name ?? '');

      if (closedTicket && data?.defect_ids?.length) {
        const { data: statuses } = await supabase
          .from('statuses')
          .select('id, name')
          .eq('entity', 'defect');
        const closedId = statuses?.find((s) => /закры/i.test(s.name))?.id ?? null;
        const update = closedId ? { defect_status_id: closedId } : {};
        await supabase.from('defects').update(update).in('id', data.defect_ids);
        qc.invalidateQueries({ queryKey: ['defects'] });
        qc.invalidateQueries({ queryKey: ['defects-by-ids'] });
      }
      return { id: data.id, status_id: statusId, projectId: pid };
    },
    onSuccess: (_, vars) => {
      const pid = vars.projectId ?? projectId;
      const keyPid = perm?.only_assigned_project ? pid : null;
      qc.invalidateQueries({ queryKey: ticketsKey(keyPid, projectIds) });
      qc.invalidateQueries({
        queryKey: ["ticket", vars.id, pid],
        exact: true,
      });
      notify.success("Статус обновлён");
    },
    onError: (e) => notify.error(`Ошибка обновления статуса: ${e.message}`),
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
  const { projectId, projectIds, onlyAssigned } = useProjectFilter();
  return useMutation({
    mutationFn: async ({ parentId, childIds }) => {
      const ids = childIds.map((c) => Number(c));
      if (!ids.length) return;
      await supabase.from(LINKS_TABLE).delete().in('child_id', ids);
      const rows = ids.map((child_id) => ({ parent_id: Number(parentId), child_id }));
      await supabase.from(LINKS_TABLE).insert(rows);
      qc.invalidateQueries({ queryKey: [LINKS_TABLE] });
      const keyPid = onlyAssigned ? projectId : null;
      qc.invalidateQueries({ queryKey: ticketsKey(keyPid, projectIds) });
    },
  });
}

export function useUnlinkTicket() {
  const qc = useQueryClient();
  const { projectId, projectIds, onlyAssigned } = useProjectFilter();
  return useMutation({
    mutationFn: async (id) => {
      const childId = Number(id);
      await supabase.from(LINKS_TABLE).delete().eq('child_id', childId);
      qc.invalidateQueries({ queryKey: [LINKS_TABLE] });
      const keyPid = onlyAssigned ? projectId : null;
      qc.invalidateQueries({ queryKey: ticketsKey(keyPid, projectIds) });
    },
  });
}
