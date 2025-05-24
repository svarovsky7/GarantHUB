import React, { useState } from 'react';
import {
    Container,
    Stack,
    Button,
    TextField,
    MenuItem,
    FormControl,
    InputLabel,
    Select,
} from '@mui/material';
import { useCourtCases, useAddCourtCase, useUpdateCourtCase } from '@/entities/courtCase';
import CourtCaseForm from '@/features/courtCase/CourtCaseForm';
import CourtCasesTable from '@/widgets/CourtCasesTable';
import { useCourtCaseStatuses } from '@/entities/courtCaseStatus';
import CourtCaseDetailsDialog from '@/widgets/CourtCaseDetailsDialog';

export default function CourtCasesPage() {
    const { data: cases = [], isLoading } = useCourtCases();
    const add = useAddCourtCase();
    const update = useUpdateCourtCase();
    const { data: statuses = [] } = useCourtCaseStatuses();
    const [modal, setModal] = useState(null); // {mode:'add'|'edit', data?}
    const [viewCase, setViewCase] = useState(null);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [unitFilter, setUnitFilter] = useState('');
    const [lawyerFilter, setLawyerFilter] = useState('');

    const rows = cases.map((c) => ({
        ...c,
        unit_name: c.units?.name ?? '',
        stage_name: c.litigation_stages?.name ?? '',
        lawyer_name: c.profiles?.name ?? '',
    }));

    const filteredRows = rows.filter((r) => {
        const s = search.toLowerCase();
        const matchesSearch =
            r.internal_no.toLowerCase().includes(s) ||
            r.unit_name.toLowerCase().includes(s) ||
            r.lawyer_name.toLowerCase().includes(s) ||
            r.comments?.toLowerCase().includes(s);
        const matchesStatus = !statusFilter || r.status === statusFilter;
        const matchesUnit = !unitFilter || r.unit_name.toLowerCase().includes(unitFilter.toLowerCase());
        const matchesLawyer = !lawyerFilter || r.lawyer_name.toLowerCase().includes(lawyerFilter.toLowerCase());
        return matchesSearch && matchesStatus && matchesUnit && matchesLawyer;
    });

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
            {viewCase && (
                <CourtCaseDetailsDialog
                    open
                    caseData={viewCase}
                    onClose={() => setViewCase(null)}
                />
            )}
            <Stack spacing={2}>
                <Button variant="contained" onClick={() => setModal({ mode: 'add' })}>
                    Новое дело
                </Button>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <TextField label="Поиск" value={search} onChange={(e) => setSearch(e.target.value)} />
                    <FormControl sx={{ minWidth: 160 }}>
                        <InputLabel>Статус</InputLabel>
                        <Select
                            label="Статус"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <MenuItem value="">Все</MenuItem>
                            {statuses.map((s) => (
                                <MenuItem key={s.name} value={s.name}>
                                    {s.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <TextField label="Объект" value={unitFilter} onChange={(e) => setUnitFilter(e.target.value)} />
                    <TextField label="Юрист" value={lawyerFilter} onChange={(e) => setLawyerFilter(e.target.value)} />
                </Stack>
                <CourtCasesTable
                    rows={filteredRows}
                    onEdit={(row) => setModal({ mode: 'edit', data: row })}
                    onView={(row) => setViewCase(row)}
                />
            </Stack>
        </Container>
    );
}
