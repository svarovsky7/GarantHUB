// src/entities/ticket.js
// -----------------------------------------------------------------------------
// CRUD-hooks для «Замечаний» + работа с вложениями Supabase Storage
// -----------------------------------------------------------------------------
// Фильтрация КАЖДОГО запроса по project_id текущего пользователя
/* eslint-disable import/prefer-default-export */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import 'dayjs/locale/ru';

import { supabase } from '@/shared/api/supabaseClient';
import { useNotify } from '@/shared/hooks/useNotify';
import { useProjectId } from '@/shared/hooks/useProjectId';

// ──────────────────────────── constants ────────────────────────────
const ATTACH_BUCKET =
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_ATTACH_BUCKET) ||
    process.env.REACT_APP_ATTACH_BUCKET ||
    'attachments';

// ──────────────────────────── helpers ──────────────────────────────
export const slugify = (str) =>
    str
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[А-ЯЁ]/gi, (c) => {
            const map = {
                а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh',
                з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o',
                п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'c',
                ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e',
                ю: 'yu', я: 'ya',
            };
            return map[c.toLowerCase()] ?? '';
        })
        .replace(/[^0-9a-z._/-]+/gi, '_')
        .replace(/_+/g, '_')
        .toLowerCase();

export async function uploadAttachment(file, projectId, ticketId) {
    const safe = slugify(file.name);
    const path = `${projectId}/${ticketId}/${Date.now()}_${safe}`;

    const { error } = await supabase
        .storage.from(ATTACH_BUCKET)
        .upload(path, file, { upsert: true, contentType: file.type });

    if (error?.message?.includes('Bucket not found')) {
        throw new Error(`Storage bucket «${ATTACH_BUCKET}» отсутствует.`);
    }
    if (error) throw error;

    const { data: { publicUrl } } = supabase
        .storage.from(ATTACH_BUCKET)
        .getPublicUrl(path);

    return { path, type: file.type, url: publicUrl };
}

export async function signedUrl(path, filename = '') {
    const { data, error } = await supabase
        .storage.from(ATTACH_BUCKET)
        .createSignedUrl(path, 60, { download: filename || undefined });
    if (error) throw error;
    return data.signedUrl;
}

// ──────────────────────────── mapper ───────────────────────────────
function mapTicket(r) {
    const atts = Array.isArray(r.attachments) ? r.attachments : [];

    const attachments = atts.map((a) => {
        let name = a.storage_path;
        try {
            name = decodeURIComponent(
                a.storage_path.split('/').pop()?.replace(/^\d+_/, '') || a.storage_path,
            );
        } catch {
            /* ignore */
        }
        return {
            id: a.id,
            path: a.storage_path,
            name,
            url: a.file_url,
            type: a.file_type,
        };
    });

    const toDayjs = (d) => (d ? (dayjs(d).isValid() ? dayjs(d) : null) : null);

    return {
        id: r.id,
        projectId: r.project_id,
        unitId: r.unit_id,
        typeId: r.type_id,
        statusId: r.status_id,
        projectName: r.projects?.name ?? '—',
        unitName: r.units?.name ?? '—',
        typeName: r.ticket_types?.name ?? '—',
        statusName: r.ticket_statuses?.name ?? '—',
        title: r.title,
        description: r.description,
        isWarranty: r.is_warranty,
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
        queryKey: ['tickets', projectId],
        enabled : !!projectId,
        queryFn : async () => {
            const { data, error } = await supabase
                .from('tickets')
                .select(`
          id, project_id, unit_id, type_id, status_id, title, description,
          is_warranty, created_at, received_at, fixed_at,
          projects (id, name), units (id, name),
          ticket_types (id, name), ticket_statuses (id, name),
          attachments (id, file_type, storage_path, file_url)
        `)
                .eq('project_id', projectId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return (data ?? []).map(mapTicket);
        },
        staleTime: 5 * 60_000,
        gcTime  : 10 * 60_000,
    });
}

// ──────────────────────────── create ──────────────────────────────
export function useCreateTicket() {
    const projectId = useProjectId();
    const qc     = useQueryClient();
    const notify = useNotify();

    return useMutation({
        mutationFn: async ({ attachments = [], ...dto }) => {
            const { data: newTicket, error } = await supabase
                .from('tickets')
                .insert({ ...dto, project_id: projectId })
                .select('id, project_id')
                .single();

            if (error) throw error;

            if (attachments.length) {
                await Promise.all(
                    attachments.map(async (file) => {
                        try {
                            const { path, type, url } = await uploadAttachment(
                                file,
                                projectId,
                                newTicket.id,
                            );
                            await supabase.from('attachments').insert({
                                ticket_id: newTicket.id,
                                file_type: type,
                                storage_path: path,
                                file_url: url,
                            });
                        } catch (e) {
                            notify.error(`Ошибка загрузки файла ${file.name}: ${e.message}`);
                        }
                    }),
                );
            }
            return newTicket;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['tickets', projectId] });
            notify.success('Замечание успешно создано');
        },
        onError: (e) => notify.error(`Ошибка создания замечания: ${e.message}`),
    });
}

// ───────────────────────── one ticket / update ───────────────────
export function useTicket(ticketId) {
    const projectId = useProjectId();
    const qc     = useQueryClient();
    const notify = useNotify();
    const id     = Number(ticketId);

    const query = useQuery({
        queryKey: ['ticket', id, projectId],
        enabled : !!id && !!projectId,
        queryFn : async () => {
            const { data, error } = await supabase
                .from('tickets')
                .select(`
          id, project_id, unit_id, type_id, status_id, title, description,
          is_warranty, created_at, received_at, fixed_at,
          projects (id, name), units (id, name),
          ticket_types (id, name), ticket_statuses (id, name),
          attachments (id, file_type, storage_path, file_url)
        `)
                .eq('id', id)
                .eq('project_id', projectId)
                .single();
            if (error) throw error;
            return data ? mapTicket(data) : null;
        },
        staleTime: 5 * 60_000,
        gcTime  : 10 * 60_000,
    });

    const update = useMutation({
        mutationFn: async ({
                               id: updId,
                               newAttachments = [],
                               removedAttachmentIds = [],
                               ...updates
                           }) => {
            if (!updId) throw new Error('ID тикета обязателен');

            // удаляем вложения
            if (removedAttachmentIds.length) {
                const { data: atts } = await supabase
                    .from('attachments')
                    .select('storage_path')
                    .in('id', removedAttachmentIds);
                if (atts?.length) {
                    await supabase.storage.from(ATTACH_BUCKET)
                        .remove(atts.map((a) => a.storage_path));
                }
                await supabase.from('attachments')
                    .delete()
                    .in('id', removedAttachmentIds);
            }

            // обновляем тикет
            if (Object.keys(updates).length) {
                const { error } = await supabase
                    .from('tickets')
                    .update(updates)
                    .eq('id', updId)
                    .eq('project_id', projectId);
                if (error) throw error;
            }

            // новые вложения
            if (newAttachments.length) {
                await Promise.all(
                    newAttachments.map(async (file) => {
                        try {
                            const { path, type, url } = await uploadAttachment(
                                file,
                                projectId,
                                updId,
                            );
                            await supabase.from('attachments').insert({
                                ticket_id: updId,
                                file_type: type,
                                storage_path: path,
                                file_url: url,
                            });
                        } catch (e) {
                            notify.error(`Ошибка загрузки файла ${file.name}: ${e.message}`);
                        }
                    }),
                );
            }
        },
        onSuccess: (_, vars) => {
            qc.invalidateQueries({ queryKey: ['tickets', projectId] });
            qc.invalidateQueries({ queryKey: ['ticket', vars.id, projectId] });
            notify.success('Замечание успешно обновлено');
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
    const qc     = useQueryClient();
    const notify = useNotify();

    return useMutation({
        mutationFn: async (ticketId) => {
            const { data: files } = await supabase
                .from('attachments')
                .select('storage_path')
                .eq('ticket_id', ticketId);

            if (files?.length) {
                await supabase.storage.from(ATTACH_BUCKET)
                    .remove(files.map((f) => f.storage_path));
            }
            await supabase.from('attachments')
                .delete()
                .eq('ticket_id', ticketId);

            await supabase.from('tickets')
                .delete()
                .eq('id', ticketId)
                .eq('project_id', projectId);
        },
        onSuccess: (_, id) => {
            qc.invalidateQueries({ queryKey: ['tickets', projectId] });
            qc.invalidateQueries({ queryKey: ['ticket', id, projectId], exact: true });
            notify.success('Замечание удалено вместе с вложениями');
        },
        onError: (e) => notify.error(`Ошибка удаления замечания: ${e.message}`),
    });
}

// -----------------------------------------------------------------------------
// Получить все замечания без фильтрации по проекту (для статистики)
// -----------------------------------------------------------------------------
export function useAllTicketsSimple() {
    return useQuery({
        queryKey: ['tickets-all'],
        queryFn : async () => {
            const { data, error } = await supabase
                .from('tickets')
                .select('id, status_id');
            if (error) throw error;
            return data ?? [];
        },
        staleTime: 5 * 60_000,
    });
}
