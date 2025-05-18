// src/features/litigation/LitigationForm.js
// -----------------------------------------------------------------------------
// Форма реквизитов судебного дела (подключается в TicketForm)
// -----------------------------------------------------------------------------

import React, { useMemo } from 'react';
import {
    Stack,
    TextField,
    Autocomplete,
    Divider,
} from '@mui/material';
import { Controller, useFormContext } from 'react-hook-form';
// CHANGE: удалён неиспользуемый импорт dayjs
// import dayjs from 'dayjs';
import {
    LocalizationProvider,
    DatePicker,
} from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

import { useLitigationStages } from '@/entities/litigationStage';
import { useContractors }      from '@/entities/contractor';
import { usePersonsByProject } from '@/entities/person';

/* ---------- helpers ---------- */
const fullName = (p = {}) =>
    [p.surname, p.name, p.patronymic].filter(Boolean).join(' ').trim();

/** убираем дубликаты по id */
const uniqById = (arr) => [...new Map(arr.map((o) => [o.id, o])).values()];

export default function LitigationForm() {
    const {
        control,
        watch,
        formState: { errors },
    } = useFormContext();

    /* текущий проект из родительской формы */
    const projectId = watch('project_id');

    /* справочники */
    const { data: stages = [] }          = useLitigationStages();
    const { data: contractorsRaw = [] }  = useContractors();
    const { data: personsRaw = [] }      = usePersonsByProject(projectId);

    const contractors = useMemo(() => uniqById(contractorsRaw), [contractorsRaw]);
    const persons     = useMemo(() => uniqById(personsRaw), [personsRaw]);

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="ru">
            <Stack spacing={2}>

                {/* =============== ОСНОВНЫЕ РЕКВИЗИТЫ =============== */}
                <Controller
                    name="litigation.court_number"
                    control={control}
                    rules={{ required: '№ дела обязателен' }}
                    render={({ field }) => (
                        <TextField
                            {...field}
                            label="№ судебного дела"
                            size="small"
                            error={!!errors.litigation?.court_number}
                            helperText={errors.litigation?.court_number?.message}
                        />
                    )}
                />

                <Controller
                    name="litigation.court_name"
                    control={control}
                    rules={{ required: 'Наименование суда обязательно' }}
                    render={({ field }) => (
                        <TextField
                            {...field}
                            label="Суд (название / подсудность)"
                            size="small"
                            error={!!errors.litigation?.court_name}
                            helperText={errors.litigation?.court_name?.message}
                        />
                    )}
                />

                <Controller
                    name="litigation.stage_id"
                    control={control}
                    render={({ field }) => (
                        <Autocomplete
                            {...field}
                            options={stages}
                            getOptionLabel={(s) => s?.name ?? `#${s?.id}`}
                            isOptionEqualToValue={(o, v) => o.id === v.id}
                            value={stages.find((s) => s.id === field.value) || null}
                            onChange={(_, v) => field.onChange(v?.id || null)}
                            renderOption={(props, option) => (
                                <li {...props} key={option.id}>{option.name}</li>
                            )}
                            renderInput={(params) => (
                                <TextField {...params} label="Стадия" size="small" />
                            )}
                        />
                    )}
                />

                {/* =============== УЧАСТНИКИ =============== */}
                <Controller
                    name="litigation.claimant_id"
                    control={control}
                    render={({ field }) => (
                        <Autocomplete
                            {...field}
                            options={persons}
                            getOptionLabel={(p) => fullName(p) || `Без имени #${p?.id}`}
                            isOptionEqualToValue={(o, v) => o.id === v.id}
                            value={persons.find((p) => p.id === field.value) || null}
                            onChange={(_, v) => field.onChange(v?.id || null)}
                            renderOption={(props, option) => (
                                <li {...props} key={option.id}>
                                    {fullName(option) || `Без имени #${option.id}`}
                                </li>
                            )}
                            renderInput={(params) => (
                                <TextField {...params} label="Истец (дольщик)" size="small" />
                            )}
                        />
                    )}
                />

                <Controller
                    name="litigation.defendant_id"
                    control={control}
                    render={({ field }) => (
                        <Autocomplete
                            {...field}
                            options={contractors}
                            getOptionLabel={(c) => c?.name || `Контрагент #${c?.id}`}
                            isOptionEqualToValue={(o, v) => o.id === v.id}
                            value={contractors.find((c) => c.id === field.value) || null}
                            onChange={(_, v) => field.onChange(v?.id || null)}
                            renderOption={(props, option) => (
                                <li {...props} key={option.id}>
                                    {option.name || `Контрагент #${option.id}`}
                                </li>
                            )}
                            renderInput={(params) => (
                                <TextField {...params} label="Ответчик (застройщик)" size="small" />
                            )}
                        />
                    )}
                />

                <Divider flexItem />

                {/* =============== ДОКУМЕНТЫ И ДАТЫ =============== */}
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <Controller
                        name="litigation.ddu_number"
                        control={control}
                        render={({ field }) => (
                            <TextField {...field} label="№ ДДУ" size="small" fullWidth />
                        )}
                    />
                    <Controller
                        name="litigation.ddu_date"
                        control={control}
                        render={({ field }) => (
                            <DatePicker
                                {...field}
                                label="Дата ДДУ"
                                slotProps={{ textField: { size: 'small', fullWidth: true } }}
                            />
                        )}
                    />
                </Stack>

                <Controller
                    name="litigation.defects"
                    control={control}
                    render={({ field }) => (
                        <TextField
                            {...field}
                            label="Перечень недостатков"
                            size="small"
                            multiline
                            minRows={2}
                            fullWidth
                        />
                    )}
                />

                {/* =============== СУММЫ =============== */}
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <Controller
                        name="litigation.repair_estimate"
                        control={control}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                label="Стоимость устранения, ₽"
                                type="number"
                                size="small"
                                fullWidth
                            />
                        )}
                    />
                    <Controller
                        name="litigation.main_amount"
                        control={control}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                label="Сумма основного требования, ₽"
                                type="number"
                                size="small"
                                fullWidth
                            />
                        )}
                    />
                </Stack>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <Controller
                        name="litigation.penalty"
                        control={control}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                label="Неустойка, ₽"
                                type="number"
                                size="small"
                                fullWidth
                            />
                        )}
                    />
                    <Controller
                        name="litigation.fine"
                        control={control}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                label="Штраф, ₽"
                                type="number"
                                size="small"
                                fullWidth
                            />
                        )}
                    />
                </Stack>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <Controller
                        name="litigation.moral_damage"
                        control={control}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                label="Компенсация морального вреда, ₽"
                                type="number"
                                size="small"
                                fullWidth
                            />
                        )}
                    />
                    <Controller
                        name="litigation.state_fee"
                        control={control}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                label="Госпошлина, ₽"
                                type="number"
                                size="small"
                                fullWidth
                            />
                        )}
                    />
                </Stack>

                {/* =============== ПРЕТЕНЗИЯ / ИСК =============== */}
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <Controller
                        name="litigation.claim_number"
                        control={control}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                label="№ претензии"
                                size="small"
                                fullWidth
                            />
                        )}
                    />
                    <Controller
                        name="litigation.claim_date"
                        control={control}
                        render={({ field }) => (
                            <DatePicker
                                {...field}
                                label="Дата претензии"
                                slotProps={{ textField: { size: 'small', fullWidth: true } }}
                            />
                        )}
                    />
                </Stack>

                <Controller
                    name="litigation.lawsuit_date"
                    control={control}
                    render={({ field }) => (
                        <DatePicker
                            {...field}
                            label="Дата подачи иска"
                            slotProps={{ textField: { size: 'small', fullWidth: true } }}
                        />
                    )}
                />

                {/* =============== РЕШЕНИЕ СУДА =============== */}
                <Controller
                    name="litigation.decision_date"
                    control={control}
                    render={({ field }) => (
                        <DatePicker
                            {...field}
                            label="Дата решения"
                            slotProps={{ textField: { size: 'small', fullWidth: true } }}
                        />
                    )}
                />

                <Controller
                    name="litigation.decision_text"
                    control={control}
                    render={({ field }) => (
                        <TextField
                            {...field}
                            label="Резолютивная часть"
                            size="small"
                            multiline
                            minRows={2}
                            fullWidth
                        />
                    )}
                />

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <Controller
                        name="litigation.amount_awarded"
                        control={control}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                label="Сумма, взысканная судом, ₽"
                                type="number"
                                size="small"
                                fullWidth
                            />
                        )}
                    />
                    <Controller
                        name="litigation.amount_paid"
                        control={control}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                label="Фактически уплачено, ₽"
                                type="number"
                                size="small"
                                fullWidth
                            />
                        )}
                    />
                </Stack>

                <Controller
                    name="litigation.payment_date"
                    control={control}
                    render={({ field }) => (
                        <DatePicker
                            {...field}
                            label="Дата оплаты"
                            slotProps={{ textField: { size: 'small', fullWidth: true } }}
                        />
                    )}
                />

                {/* =============== ПРОЧЕЕ =============== */}
                <Controller
                    name="litigation.documents"
                    control={control}
                    render={({ field }) => (
                        <TextField
                            {...field}
                            label="Ссылки на документы (URL, путь)"
                            size="small"
                            multiline
                            minRows={2}
                            fullWidth
                            placeholder="Каждую ссылку с новой строки"
                        />
                    )}
                />

                <Controller
                    name="litigation.lawyer"
                    control={control}
                    render={({ field }) => (
                        <TextField
                            {...field}
                            label="Ответственный юрист"
                            size="small"
                            fullWidth
                        />
                    )}
                />

                <Controller
                    name="litigation.comments"
                    control={control}
                    render={({ field }) => (
                        <TextField
                            {...field}
                            label="Комментарии"
                            size="small"
                            multiline
                            minRows={2}
                            fullWidth
                        />
                    )}
                />

            </Stack>
        </LocalizationProvider>
    );
}
