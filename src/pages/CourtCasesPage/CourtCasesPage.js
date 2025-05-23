import React, { useState } from 'react';
import { Container, Stack, Button } from '@mui/material';
import { useCourtCases, useAddCourtCase, useUpdateCourtCase } from '@/entities/courtCase';
import CourtCaseForm from '@/features/courtCase/CourtCaseForm';
import CourtCasesTable from '@/widgets/CourtCasesTable';

export default function CourtCasesPage() {
    const { data: cases = [], isLoading } = useCourtCases();
    const add = useAddCourtCase();
    const update = useUpdateCourtCase();
    const [modal, setModal] = useState(null); // {mode:'add'|'edit', data?}

    const rows = cases.map((c) => ({
        id: c.id,
        internal_no: c.internal_no,
        unit_name: c.units?.name ?? '',
        stage_name: c.litigation_stages?.name ?? '',
        status: c.status,
    }));

    const handleCreate = async (values) => {
        await add.mutateAsync(values);
    };

    const handleUpdate = async (values) => {
        if (!modal?.data?.id) return;
        await update.mutateAsync({ id: modal.data.id, updates: values });
    };

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            {modal && (
                <CourtCaseForm
                    initialData={modal.data}
                    onSubmit={modal.mode === 'add' ? handleCreate : handleUpdate}
                    onCancel={() => setModal(null)}
                />
            )}
            <Stack spacing={2}>
                <Button variant="contained" onClick={() => setModal({ mode: 'add' })}>
                    Новое дело
                </Button>
                <CourtCasesTable rows={rows} onEdit={(row) => setModal({ mode: 'edit', data: row })} />
            </Stack>
        </Container>
    );
}
