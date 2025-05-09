/**
 * Типы, связанные с сущностью «Замечание» (ticket) и связанными таблицами.
 * Располагается в shared-слое, чтобы переиспользовать во всех фичах и виджетах.
 */

export interface Ticket {
    id: number;
    created_at: string;          // TIMESTAMP – дата/время создания
    received_at: string;         // DATE – дата получения замечания
    unit_id: number | null;      // FK → units.id
    status_id: number | null;    // FK → ticket_statuses.id
    responsible_user_id: string | null; // FK → profiles.id
    is_warranty: boolean;        // TRUE = гарантийный случай
}

export interface Unit {
    id: number;
    name: string;
}

export interface TicketStatus {
    id: number;
    name: string;
}

export interface Profile {
    id: string;
    name: string;
}

/**
 * TicketItem — плоская структура, уже «расшитая» JOIN-ами:
 * содержит имена связанных сущностей, пригодна для прямого отображения в UI.
 */
export interface TicketItem {
    id: number;
    created_at: string;
    received_at: string;
    is_warranty: boolean;
    unit_name: string;
    status_name: string;
    responsible_name: string;
}
