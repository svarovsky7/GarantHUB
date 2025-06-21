-- Нормализация связей вместо массивов

-- tickets

CREATE TABLE public.ticket_units (
    ticket_id bigint NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
    unit_id   integer NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
    PRIMARY KEY (ticket_id, unit_id)
);
CREATE INDEX idx_ticket_units_unit ON public.ticket_units(unit_id);

CREATE TABLE public.ticket_attachments (
    ticket_id bigint NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
    attachment_id integer NOT NULL REFERENCES public.attachments(id) ON DELETE CASCADE,
    PRIMARY KEY (ticket_id, attachment_id)
);
CREATE INDEX idx_ticket_attachments_file ON public.ticket_attachments(attachment_id);
ALTER TABLE public.tickets DROP COLUMN IF EXISTS unit_ids;
ALTER TABLE public.tickets DROP COLUMN IF EXISTS attachment_ids;
ALTER TABLE public.tickets DROP COLUMN IF EXISTS defect_ids;

-- defects

CREATE TABLE public.defect_attachments (
    defect_id bigint NOT NULL REFERENCES public.defects(id) ON DELETE CASCADE,
    attachment_id integer NOT NULL REFERENCES public.attachments(id) ON DELETE CASCADE,
    PRIMARY KEY (defect_id, attachment_id)
);
CREATE INDEX idx_defect_attachments_file ON public.defect_attachments(attachment_id);

ALTER TABLE public.defects DROP COLUMN IF EXISTS attachment_ids;
-- letters

CREATE TABLE public.letter_units (
    letter_id bigint NOT NULL REFERENCES public.letters(id) ON DELETE CASCADE,
    unit_id integer NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
    PRIMARY KEY (letter_id, unit_id)
);
CREATE INDEX idx_letter_units_unit ON public.letter_units(unit_id);

CREATE TABLE public.letter_attachments (
    letter_id bigint NOT NULL REFERENCES public.letters(id) ON DELETE CASCADE,
    attachment_id integer NOT NULL REFERENCES public.attachments(id) ON DELETE CASCADE,
    PRIMARY KEY (letter_id, attachment_id)
);
CREATE INDEX idx_letter_attachments_file ON public.letter_attachments(attachment_id);
INSERT INTO public.letter_units(letter_id, unit_id)
SELECT id, unnest(unit_ids)
FROM public.letters
WHERE unit_ids IS NOT NULL;

INSERT INTO public.letter_attachments(letter_id, attachment_id)
SELECT id, unnest(attachment_ids)
FROM public.letters
WHERE attachment_ids IS NOT NULL;

ALTER TABLE public.letters DROP COLUMN IF EXISTS unit_ids;
ALTER TABLE public.letters DROP COLUMN IF EXISTS attachment_ids;

-- court cases

CREATE TABLE public.court_case_units (
    court_case_id bigint NOT NULL REFERENCES public.court_cases(id) ON DELETE CASCADE,
    unit_id integer NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
    PRIMARY KEY (court_case_id, unit_id)
);
CREATE INDEX idx_court_case_units_unit ON public.court_case_units(unit_id);

CREATE TABLE public.court_case_attachments (
    court_case_id bigint NOT NULL REFERENCES public.court_cases(id) ON DELETE CASCADE,
    attachment_id integer NOT NULL REFERENCES public.attachments(id) ON DELETE CASCADE,
    PRIMARY KEY (court_case_id, attachment_id)
);
CREATE INDEX idx_court_case_attachments_file ON public.court_case_attachments(attachment_id);
ALTER TABLE public.court_cases DROP COLUMN IF EXISTS unit_ids;
ALTER TABLE public.court_cases DROP COLUMN IF EXISTS attachment_ids;

-- claims

CREATE TABLE public.claim_units (
    claim_id bigint NOT NULL REFERENCES public.claims(id) ON DELETE CASCADE,
    unit_id integer NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
    PRIMARY KEY (claim_id, unit_id)
);
CREATE INDEX idx_claim_units_unit ON public.claim_units(unit_id);

CREATE TABLE public.claim_tickets (
    claim_id bigint NOT NULL REFERENCES public.claims(id) ON DELETE CASCADE,
    ticket_id bigint NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
    PRIMARY KEY (claim_id, ticket_id)
);
CREATE INDEX idx_claim_tickets_ticket ON public.claim_tickets(ticket_id);

CREATE TABLE public.claim_attachments (
    claim_id bigint NOT NULL REFERENCES public.claims(id) ON DELETE CASCADE,
    attachment_id integer NOT NULL REFERENCES public.attachments(id) ON DELETE CASCADE,
    PRIMARY KEY (claim_id, attachment_id)
);
CREATE INDEX idx_claim_attachments_file ON public.claim_attachments(attachment_id);
ALTER TABLE public.claims DROP COLUMN IF EXISTS unit_ids;
ALTER TABLE public.claims DROP COLUMN IF EXISTS ticket_ids;
ALTER TABLE public.claims DROP COLUMN IF EXISTS attachment_ids;

