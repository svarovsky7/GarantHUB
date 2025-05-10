// src/entities/ticket.js
// -----------------------------------------------------------------------------
// CRUD-операции с замечаниями + загрузка вложений в Supabase Storage
// -----------------------------------------------------------------------------
import { supabase } from '@/shared/api/supabaseClient';
import {
    useQuery,
    useMutation,
    useQueryClient,
} from '@tanstack/react-query';
import dayjs from 'dayjs';
import slug from 'slugify';

/* ---------- helper ---------- */
const toSlug = (s) => slug(s, { lower: true, strict: true, locale: 'ru' });

/* ---------- SELECT ---------- */
export const TICKET_SELECT = `
  id, created_at, received_at, fixed_at,
  title, description, is_warranty,
  status_id, type_id, project_id, unit_id, created_by,
  unit:units ( id, name, floor, section, building, project:projects ( id, name ) ),
  type:ticket_types   ( id, name ),
  status:ticket_statuses ( id, name ),
  attachments:attachments ( id, file_url, file_type, storage_path )
`;

/* ---------- helpers ---------- */
const numeric = ['project_id', 'unit_id', 'type_id', 'status_id', 'floor'];

const sanitize = (obj) =>
    Object.fromEntries(
        Object.entries(obj)
            .filter(([, v]) => v !== undefined && v !== null && v !== '')
            .map(([k, v]) => (numeric.includes(k) ? [k, Number(v)] : [k, v])),
    );

const getDefaultStatusId = async () => {
    const { data, error } = await supabase
        .from('ticket_statuses')
        .select('id')
        .order('id')
        .limit(1)
        .maybeSingle();
    if (error) throw error;
    return data?.id ?? null;
};

/* ---------- attachments upload ---------- */
const uploadAttachments = async (files, projectName, ticketId) => {
    if (!files?.length) return [];
    const bucket = supabase.storage.from('attachments');
    const proj   = toSlug(projectName);

    return Promise.all(
        files.map(async (file) => {
            const [name, ext] = file.name.split(/(?=\.[^.]+$)/);
            const path = `${proj}/${ticketId}/${Date.now()}_${toSlug(name)}${ext}`;

            const { error: upErr } = await bucket.upload(path, file, {
                upsert: false,
                contentType: file.type,
            });
            if (upErr) throw upErr;

            const { data: { publicUrl } } = bucket.getPublicUrl(path);

            return { path, publicUrl, mimeType: file.type };
        }),
    );
};

/* ===================== CREATE ===================== */
export const createTicket = async (payload) => {
    const { attachments = [], ...raw } = payload;
    const fields = sanitize(raw);

    // дефолты
    if (!fields.title) fields.title = (fields.description ?? '').slice(0, 120);
    if (fields.is_warranty === undefined) fields.is_warranty = false;
    if (!fields.received_at) fields.received_at = dayjs().format('YYYY-MM-DD');
    if (!fields.status_id)  fields.status_id  = await getDefaultStatusId();

    // автор
    if (!fields.created_by) {
        const {
            data: { user },
            error: uErr,
        } = await supabase.auth.getUser();
        if (uErr) throw uErr;
        fields.created_by = user?.id ?? null;
    }

    /* 1. insert ticket */
    const { data: ticket, error } = await supabase
        .from('tickets')
        .insert(fields)
        .select()
        .single();
    if (error) throw error;

    /* 2. upload attachments */
    if (attachments.length) {
        const { data: project } = await supabase
            .from('projects')
            .select('name')
            .eq('id', ticket.project_id)
            .single();

        const stored = await uploadAttachments(attachments, project.name, ticket.id);

        const rows = stored.map((f) => ({
            ticket_id   : ticket.id,
            file_url    : f.publicUrl,
            file_type   : f.mimeType,
            storage_path: f.path,
        }));

        const { error: attErr } = await supabase
            .from('attachments')
            .insert(rows);
        if (attErr) throw attErr;
    }

    return ticket;
};

/* ===================== HOOKS ===================== */
export const useAddTicket = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: createTicket,
        onSuccess: () => qc.invalidateQueries({ queryKey: ['tickets'] }),
    });
};

export const useTickets = () =>
    useQuery({
        queryKey: ['tickets'],
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
