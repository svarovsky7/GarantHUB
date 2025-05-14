// src/pages/LitigationsPage/LitigationsPage.js
// -----------------------------------------------------------------------------
// Страница перечня судебных дел: фильтры, DataGrid, кнопка «Добавить»
// -----------------------------------------------------------------------------

import React, { useState } from 'react';
import {
    Box,
    Typography,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Button,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

import { useLitigations }      from '@/entities/litigation';
import { useLitigationStages } from '@/entities/litigationStage';
import LitigationsTable        from '@/widgets/LitigationsTable';
import LitigationAddDialog     from '@/features/litigation/LitigationAddDialog';
import { useNotify }           from '@/shared/hooks/useNotify';

export default function LitigationsPage() {
    const notify                = useNotify();
    const [search,   setSearch] = useState('');
    const [stageId,  setStageId] = useState('');
    const [openAdd, setOpenAdd] = useState(false);

    const { data: stages = [] } = useLitigationStages();
    const {
        data: litigations = [],
        isLoading,
        error,
    } = useLitigations({ search, stageId: stageId || null });

    if (error) notify.error(error.message);

    return (
        <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Заголовок + кнопка */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h4" component="h1">
                    Судебные дела
                </Typography>
                <Button
                    variant="contained"
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={() => setOpenAdd(true)}
                >
                    Добавить
                </Button>
            </Box>

            {/* Фильтры */}
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
                <TextField
                    size="small"
                    label="Поиск № дела или суда…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    sx={{ maxWidth: 300 }}
                />
                <FormControl size="small" sx={{ minWidth: 180 }}>
                    <InputLabel id="stage-label">Стадия</InputLabel>
                    <Select
                        labelId="stage-label"
                        value={stageId}
                        label="Стадия"
                        onChange={(e) => setStageId(e.target.value)}
                    >
                        <MenuItem value="">
                            <em>Все стадии</em>
                        </MenuItem>
                        {stages.map((s) => (
                            <MenuItem key={s.id} value={String(s.id)}>
                                {s.name}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Box>

            {/* Таблица */}
            <LitigationsTable data={litigations} loading={isLoading} />

            {/* Диалог добавления нового дела */}
            <LitigationAddDialog open={openAdd} onClose={() => setOpenAdd(false)} />
        </Box>
    );
}
