// src/entities/ticketStatus.js
import {
    useStatuses,
    useAddStatus,
    useUpdateStatus,
    useDeleteStatus,
} from './status';

const ENTITY = 'ticket';

// ---------------- select all ----------------
export const useTicketStatuses = () => useStatuses(ENTITY);

// ---------------- add ----------------
export const useAddTicketStatus = () => useAddStatus(ENTITY);

// ---------------- update ----------------
export const useUpdateTicketStatus = () => useUpdateStatus(ENTITY);

// ---------------- delete ----------------
export const useDeleteTicketStatus = () => useDeleteStatus(ENTITY);
