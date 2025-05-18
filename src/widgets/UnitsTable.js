import React, { useState, useCallback } from 'react';
import { GridActionsCellItem } from '@mui/x-data-grid';
import EditIcon      from '@mui/icons-material/Edit';
import DeleteIcon    from '@mui/icons-material/Delete';
import PersonAddIcon from '@mui/icons-material/PersonAdd';

import UnitForm            from '@/features/unit/UnitForm';
import { useUnits, useDeleteUnit } from '@/entities/unit';
import { useProjects } from '@/entities/project';
import { usePersons  } from '@/entities/person';

import {
    useUnitPersons,
    useAddUnitPerson,
    useDeleteUnitPerson,
} from '@/entities/unitPerson';

import AdminDataGrid from '@/shared/ui/AdminDataGrid';
import { useNotify } from '@/shared/hooks/useNotify';

import {
    Dialog, DialogTitle, DialogContent,
    Stack, Autocomplete, TextField,
    IconButton, Tooltip,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

export default function UnitsTable() {
    const notify                          = useNotify();
    const { data: units = [], isLoading } = useUnits();
    const delUnit                         = useDeleteUnit();

    const { data: projects = [] } = useProjects();

    const projectNameById = useCallback(
        (id) => projects.find((p) => p.id === id)?.name,
        [projects],
    );

    const [dialog, setDialog] = useState(null); // {mode:'edit'|'persons', unit}

    const columns = [
        { field: 'id', headerName: 'ID', width: 70 },
        {
            field     : 'project',
            headerName: 'Проект',
            flex      : 1,
            renderCell: ({ row }) =>
                row?.project?.name ?? projectNameById(row?.project_id) ?? '—',
        },
        { field: 'name', headerName: 'Квартира', width: 130 },
        {
            field     : 'persons',
            headerName: 'Физлица',
            flex      : 2,
            renderCell: ({ row }) =>
                row?.persons?.length
                    ? row.persons.map((p) => p.full_name).join('; ')
                    : '—',
        },
        {
            field : 'actions',
            type  : 'actions',
            width : 120,
            getActions: ({ row }) => [
                <GridActionsCellItem
                    key="add-person"
                    icon={<PersonAddIcon />}
                    label="Физлица"
                    onClick={() => setDialog({ mode: 'persons', unit: row })}
                />,
                <GridActionsCellItem
                    key="edit"
                    icon={<EditIcon />}
                    label="Редактировать"
                    onClick={() => setDialog({ mode: 'edit', unit: row })}
                />,
                <GridActionsCellItem
                    key="del"
                    icon={<DeleteIcon color="error" />}
                    label="Удалить"
                    onClick={() => {
                        if (!window.confirm('Удалить объект?')) return;
                        delUnit.mutate(row.id, { onSuccess: () => notify.success('Объект удалён') });
                    }}
                />,
            ],
        },
    ];

    return (
        <>
            {/* ---------- форма объекта ---------- */}
            {dialog?.mode === 'edit' && (
                <UnitForm
                    initialData={dialog.unit}
                    onCancel={() => setDialog(null)}
                    onSuccess={(u) => {
                        if (dialog.unit) setDialog(null);            // редактирование
                        else             setDialog({ mode: 'persons', unit: u }); // новый
                    }}
                />
            )}

            {/* ---------- диалог физлиц ---------- */}
            {dialog?.mode === 'persons' && (
                <UnitPersonsDialog unit={dialog.unit} onClose={() => setDialog(null)} />
            )}

            <AdminDataGrid
                title="Объекты"
                rows={units}
                columns={columns}
                loading={isLoading}
                onAdd={() => setDialog({ mode: 'edit', unit: null })}
                autoHeight
            />
        </>
    );
}

/* ------------------------------------------------------------------ */
/* Диалог: назначение/удаление физлиц объекта                          */
/* ------------------------------------------------------------------ */
function UnitPersonsDialog({ unit, onClose }) {
    const notify                             = useNotify();
    const { data: personsAll = [] }          = usePersons();
    const { data: links = [] }               = useUnitPersons(unit.id);
    const addLink                            = useAddUnitPerson();
    const removeLink                         = useDeleteUnitPerson();

    const assignedIds = links.map((l) => l.person.id);

    /* --------- Фильтр ФЛ по проекту объекта --------- */
    const personsForProject = personsAll
        .filter((p) => p.project_id === unit.project_id);

    const [inputValue, setInputValue] = useState('');
    const [selected,    setSelected]  = useState(null);

    const handleAdd = (_e, p) =>
        p && addLink.mutate(
            { unit_id: unit.id, person_id: p.id },
            {
                onSuccess: () => {
                    notify.success('Добавлено');
                    setSelected(null);
                    setInputValue('');
                },
            },
        );

    const handleRemove = (id) =>
        removeLink.mutate(
            { unit_id: unit.id, person_id: id },
            { onSuccess: () => notify.success('Удалено') },
        );

    return (
        <Dialog open onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>Физлица объекта {unit.name}</DialogTitle>

            <IconButton onClick={onClose} sx={{ position:'absolute', right:8, top:8 }}>
                <CloseIcon />
            </IconButton>

            <DialogContent dividers>
                <Stack spacing={2}>
                    <Autocomplete
                        options={personsForProject.filter((p) => !assignedIds.includes(p.id))}
                        getOptionLabel={(o) => o.full_name}
                        value={selected}
                        onChange={handleAdd}
                        inputValue={inputValue}
                        onInputChange={(_e, v) => setInputValue(v)}
                        size="small"
                        renderOption={(props, option) => (
                            <li {...props} key={option.id}>
                                {option.full_name}
                            </li>
                        )}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="Добавить физлицо"
                                autoComplete="off"
                                inputProps={{
                                    ...params.inputProps,
                                    autoCorrect:'off',
                                    spellCheck:'false',
                                }}
                            />
                        )}
                    />

                    {/* Исправленный ключ: обязательно l.person.id! */}
                    {links.map((l) => (
                        <Stack key={l.person.id} direction="row" spacing={1} alignItems="center">
                            <span>{l.person.full_name}</span>
                            <Tooltip title="Убрать">
                                <IconButton size="small" onClick={() => handleRemove(l.person.id)}>
                                    <CloseIcon fontSize="inherit" />
                                </IconButton>
                            </Tooltip>
                        </Stack>
                    ))}
                </Stack>
            </DialogContent>
        </Dialog>
    );
}
