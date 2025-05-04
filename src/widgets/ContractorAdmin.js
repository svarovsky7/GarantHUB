import React, { useState } from 'react';
import { GridActionsCellItem } from '@mui/x-data-grid';
import EditIcon   from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

import {
    useContractors,
    useAddContractor,
    useUpdateContractor,
    useDeleteContractor,
} from '@/entities/contractor';

import ContractorForm from '@/features/contractor/ContractorForm';
import AdminDataGrid  from '@/shared/ui/AdminDataGrid';
import { useNotify }  from '@/shared/hooks/useNotify';

export default function ContractorAdmin() {
    const notify                                = useNotify();
    const { data: contractors = [], isPending } = useContractors({ individual: false });

    const add    = useAddContractor();
    const update = useUpdateContractor();
    const remove = useDeleteContractor();

    const [modal, setModal] = useState(null);   // {mode:'add'|'edit', data?}

    /* ───── columns ─────────────────────────────────────── */
    const columns = [
        { field: 'id',   headerName: 'ID',       width: 80 },
        { field: 'name', headerName: 'Название', flex: 1 },
        { field: 'inn',  headerName: 'ИНН',      width: 140 },
        {
            field     : 'phone',
            headerName: 'Телефон',
            width     : 160,
            renderCell: ({ value }) => value ?? '—',           // CHANGE
        },
        {
            field     : 'email',
            headerName: 'E-mail',
            flex      : 1,
            renderCell: ({ value }) => value ?? '—',           // CHANGE
        },
        {
            field : 'actions',
            type  : 'actions',
            width : 110,
            getActions: ({ row }) => [
                <GridActionsCellItem
                    key="edit"
                    icon={<EditIcon />}
                    label="Редактировать"
                    onClick={() => setModal({ mode: 'edit', data: row })}
                />,
                <GridActionsCellItem
                    key="del"
                    icon={<DeleteIcon color="error" />}
                    label="Удалить"
                    onClick={() => {
                        if (!window.confirm('Удалить контрагента?')) return;
                        remove.mutate(row.id, {
                            onSuccess: () => notify.success('Контрагент удалён'),
                            onError  : (e) => notify.error(e.message),
                        });
                    }}
                />,
            ],
        },
    ];

    /* ───── helpers ─────────────────────────────────────── */
    const close = () => setModal(null);
    const ok    = (msg) => { close(); notify.success(msg); };

    return (
        <>
            {modal?.mode === 'add' && (
                <ContractorForm
                    onSubmit={(d) =>
                        add.mutate(
                            { ...d, is_individual: false },
                            { onSuccess: () => ok('Компания добавлена') },
                        )}
                    onCancel={close}
                />
            )}

            {modal?.mode === 'edit' && (
                <ContractorForm
                    initialData={modal.data}
                    onSubmit={(d) =>
                        update.mutate(
                            { id: modal.data.id, updates: { ...d, is_individual: false } },
                            { onSuccess: () => ok('Компания обновлена') },
                        )}
                    onCancel={close}
                />
            )}

            <AdminDataGrid
                title="Контрагенты"
                rows={contractors}
                columns={columns}
                loading={isPending}
                onAdd={() => setModal({ mode: 'add' })}
            />
        </>
    );
}