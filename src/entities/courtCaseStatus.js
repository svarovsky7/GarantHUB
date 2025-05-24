import { useQuery, useMutation } from '@tanstack/react-query';

// В базе статусы представлены типом ENUM, поэтому таблицы нет.
// Возвращаем фиксированный список значений.
const STATUSES = [
    { id: 1, name: 'NEW' },
    { id: 2, name: 'IN_PROGRESS' },
    { id: 3, name: 'SETTLED' },
    { id: 4, name: 'CLOSED' },
];

export const useCourtCaseStatuses = () =>
    useQuery({
        queryKey: ['court_case_statuses'],
        queryFn : async () => STATUSES,
        staleTime: Infinity,
    });

export const useAddCourtCaseStatus = () =>
    useMutation({
        mutationFn: async () => {
            throw new Error('Court case statuses are static and cannot be modified');
        },
    });

export const useUpdateCourtCaseStatus = () =>
    useMutation({
        mutationFn: async () => {
            throw new Error('Court case statuses are static and cannot be modified');
        },
    });

export const useDeleteCourtCaseStatus = () =>
    useMutation({
        mutationFn: async () => {
            throw new Error('Court case statuses are static and cannot be modified');
        },
    });
