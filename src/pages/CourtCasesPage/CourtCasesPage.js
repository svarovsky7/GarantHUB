import React, { useState, useMemo } from 'react';
import { Box, Paper, Typography } from '@mui/material';
import CourtCaseCreateForm from '@/features/courtCase/CourtCaseCreateForm';
import CourtCasesFilters from '@/widgets/CourtCasesFilters';
import CourtCasesTable from '@/widgets/CourtCasesTable';
import CourtCaseDetailsDialog from '@/widgets/CourtCaseDetailsDialog';
import { useCourtCases, useAddCourtCase, useDeleteCourtCase } from '@/entities/courtCase';

export default function CourtCasesPage() {
    const { data: cases = [], isLoading } = useCourtCases();
    const add = useAddCourtCase();
    const remove = useDeleteCourtCase();

    const [filters, setFilters] = useState({
        status: '',
        unit: '',
        lawyer: '',
        search: '',
    });

    const [viewCase, setViewCase] = useState(null);


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
        <Box sx={{ width: '100%', px: 0 }}>
            <Box
                sx={{
                    height: 60,
                    bgcolor: '#0d47a1',
                    color: '#fff',
                    px: 2,
                    mb: 3,
                    borderRadius: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                }}
            >
                <Typography variant="h6" lineHeight={1.2}>
                    Система учёта судебных дел
                </Typography>
                <Typography variant="caption">Генподрядчик</Typography>
            </Box>

            <Box sx={{ maxWidth: 1000, mx: 'auto' }}>
                <Paper elevation={1} sx={{ p: 4, mb: 4, borderRadius: 2 }}>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                        Добавить новое судебное дело
                    </Typography>
                    <CourtCaseCreateForm onSubmit={handleCreate} />
                </Paper>

                <Paper elevation={1} sx={{ p: 4, mb: 4, borderRadius: 2 }}>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                        Таблица судебных дел
                    </Typography>
                    <CourtCasesFilters
                        filters={filters}
                        setFilters={setFilters}
                    />
                    <CourtCasesTable
                        rows={filteredRows}
                        loading={isLoading}
                        onView={setViewCase}
                        onDelete={handleDelete}
                    />
                </Paper>
            </Box>

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
