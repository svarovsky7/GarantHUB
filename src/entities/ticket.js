// src/entities/ticket.js
// -------------------------------------------------------------
// CRUD тикетов + загрузка вложений прямо в Google Drive
// -------------------------------------------------------------

import { supabase } from '@shared/api/supabaseClient';
import {
    useQuery,
    useMutation,
    useQueryClient,
} from '@tanstack/react-query';
import dayjs from 'dayjs';

/* ======================= SELECT-строка ======================= */

export const TICKET_SELECT = `
  id,
  created_at,
  received_at,
  title,
  description,
  is_warranty,
  status_id,
  type_id,
  project_id,
  unit_id,
  unit:units (
    id, name, floor, section, building,
    project:projects ( id, name )
  ),
  type:ticket_types ( id, name ),
  attachments:attachments (
    id, file_url, file_type, drive_file_id
  )
`;

/* ====================== helpers ====================== */

const getDefaultStatusId = async () => {
    const { data, error } = await supabase
        .from('ticket_statuses')
        .select('id')
        .order('id', { ascending: true })
        .limit(1)
        .maybeSingle();
    if (error) throw error;
    return data?.id ?? null;
};

const sanitize = (raw) => {
    const numeric = ['project_id', 'unit_id', 'type_id', 'status_id', 'floor'];
    return Object.fromEntries(
        Object.entries(raw)
            .filter(([, v]) => v !== undefined && v !== null && v !== '')
            .map(([k, v]) => (numeric.includes(k) ? [k, Number(v)] : [k, v])),
    );
};

/**
 * Загружает файлы на Google Drive через наш serverless-эндпоинт
 * @param {File[]} files
 * @param {string} projectName
 * @param {number} ticketId
 * @returns {Promise<Array<{id:string, webViewLink:string, mimeType:string}>>}
 */
const uploadAttachmentsToDrive = async (files, projectName, ticketId) => {   // CHANGE
    if (!files?.length) return [];

    const body = new FormData();
    files.forEach((f) => body.append('files', f, f.name));
    body.append('project_name', projectName);
    body.append('ticket_id',    ticketId.toString());

    const res = await fetch(import.meta.env.REACT_APP_API_DRIVE_UPLOAD, {           // CHANGE
        method: 'POST',
        body,
    });

    if (!res.ok) throw new Error(await res.text());
    return res.json(); // [{ id, webViewLink, mimeType }]
};

/* ============================ CRUD =========================== */

export const createTicket = async (payload) => {
    const { attachments = [], ...raw } = payload;         // CHANGE
    const fields = sanitize(raw);

    if (!fields.title)
        fields.title = (fields.description ?? 'Новая заявка').slice(0, 120);
    if (fields.is_warranty === undefined) fields.is_warranty = false;
    if (!fields.received_at) fields.received_at = dayjs().format('YYYY-MM-DD');
    if (!fields.status_id)  fields.status_id  = await getDefaultStatusId();

    /* 1. создаём запись тикета */
    const { data: ticket, error } = await supabase
        .from('tickets')
        .insert(fields)
        .select()
        .single();
    if (error) throw error;

    /* 2. грузим файлы в Drive (если есть) */
    if (attachments.length) {
        const { data: project, error: projErr } = await supabase
            .from('projects')
            .select('name')
            .eq('id', ticket.project_id)
            .single();
        if (projErr) throw projErr;

        const driveFiles = await uploadAttachmentsToDrive(
            attachments,
            project.name,
            ticket.id,
        );

        /* 3. пишем метаданные в attachments */
        const rows = driveFiles.map((f) => ({
            ticket_id:    ticket.id,
            file_url:     f.webViewLink,
            file_type:    f.mimeType,
            drive_file_id: f.id,                 // CHANGE
        }));
        const { error: attErr } = await supabase
            .from('attachments')
            .insert(rows);
        if (attErr) throw attErr;
    }

    return ticket;
};

/* ===================== React-Query hooks ===================== */

export const useTickets = (enabled = true) =>
    useQuery({
        queryKey: ['tickets', 'all'],
        enabled,
        queryFn: async () => {
            const { data, error } = await supabase
                .from('tickets')
                .select(TICKET_SELECT)
                .order('created_at', { ascending: false });
            if (error) throw error;
            return data;
        },
    });

export const useTicketsByUnit = (unitId, isWarranty) =>
    useQuery({
        queryKey: ['tickets', 'unit', unitId, isWarranty],
        enabled: !!unitId,
        queryFn: async () => {
            const { data, error } = await supabase
                .from('tickets')
                .select(TICKET_SELECT)
                .eq('unit_id', unitId)
                .eq('is_warranty', isWarranty ?? false)
                .order('created_at', { ascending: false });
            if (error) throw error;
            return data;
        },
    });

export const useTicketsByProject = (projectId, isWarranty) =>
    useQuery({
        queryKey: ['tickets', 'project', projectId, isWarranty],
        enabled: !!projectId,
        queryFn: async () => {
            const { data, error } = await supabase
                .from('tickets')
                .select(TICKET_SELECT)
                .eq('project_id', projectId)
                .eq('is_warranty', isWarranty ?? false)
                .order('created_at', { ascending: false });
            if (error) throw error;
            return data;
        },
    });

export const useAddTicket = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: createTicket,
        onSuccess: () =>
            qc.invalidateQueries({ queryKey: ['tickets', 'all'], exact: true }),
    });
};
