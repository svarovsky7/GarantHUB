import React, { useState, useMemo } from 'react';
import { Container, Paper } from '@mui/material';
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
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
            <header className="bg-blue-800 text-white shadow-lg">
                <div className="container mx-auto px-4 py-6">
                    <h1 className="text-3xl font-bold">Система учета судебных дел</h1>
                    <p className="text-blue-200">Генподрядчик</p>
                </div>
            </header>
            <Container maxWidth="lg" sx={{ py: 6 }}>
                <CourtCaseCreateForm onSubmit={handleCreate} statuses={statuses} />
                <Paper elevation={3} sx={{ p: 4, borderRadius: 3, mb: 6 }}>
                    <h2 className="text-xl font-bold mb-6 text-gray-800">Таблица судебных дел</h2>
                    <CourtCasesFilters filters={filters} setFilters={setFilters} onReset={handleReset} />
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
            </Container>
        </div>
    );
}
