import {
    useQuery,
    useMutation,
    useQueryClient,
} from '@tanstack/react-query';
import { supabase } from '@shared/api/supabaseClient';

/* ─────────── SELECT ─────────── */
const TICKET_SELECT = `
  id,
  title,
  description,
  status_id,
  type_id,
  project_id,                        
  unit_id,
  unit:units (
    id, name, floor, section, building,
    project:projects ( id, name )
  ),
  type:ticket_types ( id, name ),
  attachments:attachments ( id, file_url, file_type )
`;

/* ─────────── helpers ─────────── */
const getDefaultStatusId = async () => {            // CHANGE
    const { data, error } = await supabase
        .from('ticket_statuses')
        .select('id')
        .order('id', { ascending: true })
        .limit(1)
        .maybeSingle();      // 406 → 200 + data = null, если пусто
    if (error) throw error;
    return data?.id ?? null;
};

const sanitize = (raw) => {
    const numKeys = [
        'project_id',
        'unit_id',
        'type_id',
        'status_id',
        'floor',
    ];
    return Object.fromEntries(
        Object.entries(raw)
            .filter(([, v]) => v !== '' && v !== undefined && v !== null)
            .map(([k, v]) => (numKeys.includes(k) ? [k, Number(v)] : [k, v])),
    );
};

const fetchTickets = async (filters = {}) => {
    const { unitId, projectId } = filters;
    let rq = supabase.from('tickets').select(TICKET_SELECT).order('id', { ascending: false });
    if (unitId) rq = rq.eq('unit_id', unitId);
    if (projectId) rq = rq.eq('project_id', projectId);
    const { data, error } = await rq;
    if (error) throw error;
    return data ?? [];
};

const createTicket = async (payload) => {
    const { attachments = [], ...raw } = payload;
    const fields = sanitize(raw);
    if (!fields.title) {
        fields.title = (fields.description ?? 'Новая заявка').slice(0, 120);
    }
    if (!fields.status_id) {
        fields.status_id = await getDefaultStatusId();
    }

    /* ticket */
    const { data: ticket, error } = await supabase
        .from('tickets')
        .insert(fields)
        .select()
        .single();
    if (error) throw error;

    /* attachments */
    if (attachments.length) {
        const rows = await Promise.all(
            attachments.map(async (file) => {
                const path = `${ticket.id}/${file.name}`;
                await supabase.storage
                    .from('ticket_attachments')
                    .upload(path, file, { upsert: false });
                const { data: { publicUrl } } =
                    supabase.storage
                        .from('ticket_attachments')
                        .getPublicUrl(path);
                return { ticket_id: ticket.id, file_url: publicUrl, file_type: file.type };
            }),
        );
        const { error: attErr } = await supabase.from('attachments').insert(rows);
        if (attErr) throw attErr;
    }
    return ticket;
};

/* ─────────── hooks ─────────── */
export const useTickets = (enabled = true) =>
    useQuery({ queryKey: ['tickets', 'all'], queryFn: () => fetchTickets(), enabled });

export const useTicketsByUnit = (unitId) =>
    useQuery({
        queryKey: ['tickets', 'unit', unitId ?? 'none'],
        queryFn: () => fetchTickets({ unitId }),
        enabled: !!unitId,
    });

export const useTicketsByProject = (projectId) =>
    useQuery({
        queryKey: ['tickets', 'project', projectId ?? 'none'],
        queryFn: () => fetchTickets({ projectId }),
        enabled: !!projectId,
    });

export const useAddTicket = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: createTicket,
        onSuccess: () => qc.invalidateQueries({ queryKey: ['tickets'] }),
    });
};
