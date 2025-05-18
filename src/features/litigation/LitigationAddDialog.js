// CHANGE: полностью переписан под полноценную форму + upload в Supabase Storage
// -----------------------------------------------------------------------------
import React, { useState } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, Stack, CircularProgress,
} from '@mui/material';
import { useForm, FormProvider } from 'react-hook-form';
import dayjs from 'dayjs';

import { useAddLitigation } from '@/entities/litigation';
import { useNotify }        from '@/shared/hooks/useNotify';
import LitigationForm       from '@/features/litigation/LitigationForm';
import FileDropZone         from '@/shared/ui/FileDropZone';
import { supabase }         from '@/shared/api/supabaseClient';

/* ---------- helpers ---------- */
const iso = (d) => (dayjs.isDayjs(d) ? d.format('YYYY-MM-DD') : null);

/* ---------- component ---------- */
export default function LitigationAddDialog({ open, onClose }) {
    const notify = useNotify();
    const { mutateAsync, isLoading } = useAddLitigation();

    /* -------- react-hook-form -------- */
    const form = useForm({
        defaultValues: { litigation: {} },
    });
    // CHANGE: удалён неиспользуемый watch
    const { handleSubmit, reset } = form;

    /* -------- files state -------- */
    const [files, setFiles] = useState([]);

    /* -------- submit -------- */
    const onSubmit = async (data) => {
        try {
            /* ---------- upload ---------- */
            const urls = [];
            for (const f of files) {
                const path = `litigations/${Date.now()}_${f.name}`;
                const { error } = await supabase
                    .storage
                    .from('litigation-docs')
                    .upload(path, f, { upsert: false });
                if (error) throw error;

                const { data: pub } = supabase
                    .storage
                    .from('litigation-docs')
                    .getPublicUrl(path);
                urls.push(pub.publicUrl);
            }

            /* ---------- api ---------- */
            const payload = {
                ...data.litigation,
                /* даты => ISO */
                claim_date   : iso(data.litigation.claim_date),
                ddu_date     : iso(data.litigation.ddu_date),
                lawsuit_date : iso(data.litigation.lawsuit_date),
                decision_date: iso(data.litigation.decision_date),
                payment_date : iso(data.litigation.payment_date),
                documents    : urls,
            };

            await mutateAsync(payload);
            notify.success('Судебное дело добавлено');
            reset();
            setFiles([]);
            onClose();
        } catch (e) {
            console.error(e);
            notify.error(e.message);
        }
    };

    /* -------- ui -------- */
    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
            <DialogTitle>Новое судебное дело</DialogTitle>

            <FormProvider {...form}>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <DialogContent dividers>
                        <Stack spacing={3}>
                            <LitigationForm />                 {/* все запрошенные поля */}
                            <FileDropZone value={files} onChange={setFiles} />
                        </Stack>
                    </DialogContent>

                    <DialogActions>
                        <Button onClick={onClose}>Отмена</Button>
                        <Button
                            type="submit"
                            variant="contained"
                            disabled={isLoading}
                            startIcon={isLoading && <CircularProgress size={18} />}
                        >
                            Сохранить
                        </Button>
                    </DialogActions>
                </form>
            </FormProvider>
        </Dialog>
    );
}
