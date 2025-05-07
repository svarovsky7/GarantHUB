// src/entities/ticket.js
// -------------------------------------------------------------
// CRUD тикетов + загрузка вложений в Supabase Storage
// -------------------------------------------------------------
import { supabase } from '@/shared/api/supabaseClient';
import {
    useQuery,
    useMutation,
    useQueryClient,
} from '@tanstack/react-query';
import dayjs from 'dayjs';
import slug from 'slugify';                        // CHANGE: ascii-slug

/* ---------- helper: ASCII-slug без % и юникода ---------- */
const toSlug = (str) =>
    slug(str, {
        lower: true,          // «Ситибей 1» → «sitibey-1»
        strict: true,         // удаляет всё, что не [a-z0-9_-]
        locale: 'ru',         // корректная транслитерация кириллицы
    });

/* ======================= SELECT-строка ====================== */

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
    id, file_url, file_type, storage_path           -- CHANGE: storage_path
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
    const numeric = [
        'project_id',
        'unit_id',
        'type_id',
        'status_id',
        'floor',
    ];
    return Object.fromEntries(
        Object.entries(raw)
            .filter(([, v]) => v !== undefined && v !== null && v !== '')
            .map(([k, v]) =>
                numeric.includes(k) ? [k, Number(v)] : [k, v],
            ),
    );
};

/**
 * Безопасный slug для имени файла
 * @param {string} name
 */
const slugify = (name) =>
    encodeURIComponent(
        name.trim().toLowerCase().replace(/\s+/g, '-'),
    );

/**
 * Загружает файлы в bucket `attachments`
 * @param {File[]} files
 * @param {string} projectName
 * @param {number} ticketId
 * @returns {Promise<Array<{path:string, publicUrl:string, mimeType:string}>>}
 */
const uploadAttachments = async (
    files,
    projectName,
    ticketId,
) => {
    if (!files?.length) return [];

    const bucket = supabase.storage.from('attachments');
    const projSlug = toSlug(projectName);

    return Promise.all(
        files.map(async (file) => {
            const [name, ext] = file.name.split(/(?=\.[^.]+$)/); // «приказ.doc»
            const filePath = `${projSlug}/${ticketId}/${Date.now()}_${toSlug(
                name,
            )}${ext}`;

            const { error: uploadErr } = await bucket.upload(
                filePath,
                file,
                { contentType: file.type, upsert: false },
            );
            if (uploadErr) throw uploadErr;               // пробрасываем 4xx/5xx

            const {
                data: { publicUrl },
            } = bucket.getPublicUrl(filePath);            // приватный → createSignedUrl
            return { path: filePath, publicUrl, mimeType: file.type };
        }),
    );
};

/* ============================ CRUD =========================== */

export const createTicket = async (payload) => {
    const { attachments = [], ...raw } = payload;
    const fields = sanitize(raw);

    if (!fields.title)
        fields.title = (fields.description ?? 'Новая заявка').slice(
            0,
            120,
        );
    if (fields.is_warranty === undefined)
        fields.is_warranty = false;
    if (!fields.received_at)
        fields.received_at = dayjs().format('YYYY-MM-DD');
    if (!fields.status_id)
        fields.status_id = await getDefaultStatusId();

    /* 1. создаём запись тикета */
    const { data: ticket, error } = await supabase
        .from('tickets')
        .insert(fields)
        .select()
        .single();
    if (error) throw error;

    /* 2. грузим вложения (если есть) */
    if (attachments.length) {
        const { data: project, error: projErr } = await supabase
            .from('projects')
            .select('name')
            .eq('id', ticket.project_id)
            .single();
        if (projErr) throw projErr;

        const stored = await uploadAttachments(
            attachments,
            project.name,
            ticket.id,
        );

        /* 3. пишем метаданные в attachments */
        const rows = stored.map((f) => ({
            ticket_id: ticket.id,
            file_url: f.publicUrl,
            file_type: f.mimeType,
            storage_path: f.path, // CHANGE
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
            qc.invalidateQueries({
                queryKey: ['tickets', 'all'],
                exact: true,
            }),
    });
};
