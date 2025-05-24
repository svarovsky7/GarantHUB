import React, { useState, useMemo } from 'react';
import {
    Box,
    Paper,
    Stack,
    Typography,
    Container,
} from '@mui/material';
import CourtCaseCreateForm from '@/features/courtCase/CourtCaseCreateForm';
import CourtCasesFilters from '@/widgets/CourtCasesFilters';
import CourtCasesTable from '@/widgets/CourtCasesTable';
import CourtCaseDetailsDialog from '@/widgets/CourtCaseDetailsDialog';
import { useCourtCases, useAddCourtCase, useDeleteCourtCase } from '@/entities/courtCase';
import { useCourtCaseStatuses } from '@/entities/courtCaseStatus';

export default function CourtCasesPage() {
    const { data: cases = [], isLoading } = useCourtCases();
    const add = useAddCourtCase();
    const remove = useDeleteCourtCase();
    const { data: statuses = [] } = useCourtCaseStatuses();

    const [filters, setFilters] = useState({
        status: '',
        unit: '',
        lawyer: '',
        search: '',
    });

    const [viewCase, setViewCase] = useState(null);

    // Сброс фильтров
    const handleReset = () => setFilters({ status: '', unit: '', lawyer: '', search: '' });

    // Фильтрация (можно вынести в функцию-утилиту)
    const filteredRows = useMemo(
        () =>
            cases
                .map((c) => ({
                    ...c,
                    unit_name: c.units?.name ?? '',
                    lawyer_name: c.profiles?.name ?? '',
                }))
                .filter((r) => {
                    const s = filters.search?.toLowerCase() || '';
                    const matchesSearch =
                        r.internal_no?.toLowerCase().includes(s) ||
                        r.unit_name?.toLowerCase().includes(s) ||
                        r.lawyer_name?.toLowerCase().includes(s) ||
                        r.comments?.toLowerCase().includes(s);
                    const matchesStatus = !filters.status || r.status === filters.status;
                    const matchesUnit =
                        !filters.unit || r.unit_name?.toLowerCase().includes(filters.unit.toLowerCase());
                    const matchesLawyer =
                        !filters.lawyer || r.lawyer_name?.toLowerCase().includes(filters.lawyer.toLowerCase());
                    return matchesSearch && matchesStatus && matchesUnit && matchesLawyer;
                }),
        [cases, filters]
    );

    const handleCreate = async (values) => {
        await add.mutateAsync(values);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Удалить дело?')) {
            await remove.mutateAsync(id);
        }
    };

    return (
        <Box sx={{ width: '100%', px: 0, py: 3 }}>
            <Stack
                direction={{ xs: 'column', md: 'row' }}
                justifyContent="space-between"
                alignItems={{ xs: 'flex-start', md: 'center' }}
                spacing={2}
                sx={{ mb: 3 }}
            >
                <Typography variant="h4">Судебные дела</Typography>
            </Stack>

            <Paper elevation={3} sx={{ p: { xs: 2, sm: 3, md: 4 }, mb: 3, borderRadius: 2 }}>
                <CourtCaseCreateForm onSubmit={handleCreate} statuses={statuses} />
            </Paper>

            <Paper elevation={3} sx={{ p: { xs: 2, sm: 3, md: 4 }, borderRadius: 2 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                    Таблица судебных дел
                </Typography>
                <CourtCasesFilters
                    filters={filters}
                    setFilters={setFilters}
                    onReset={handleReset}
                />
                <CourtCasesTable
                    rows={filteredRows}
                    loading={isLoading}
                    onView={setViewCase}
                    onDelete={handleDelete}
                />
            </Paper>

            {viewCase && (
                <CourtCaseDetailsDialog
                    open
                    caseData={viewCase}
                    onClose={() => setViewCase(null)}
                />
            )}
        </Box>
    );
}
