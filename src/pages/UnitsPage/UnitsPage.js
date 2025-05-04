import React from 'react';
import { useSearchParams, Link as RouterLink } from 'react-router-dom';
import {
    Paper, Typography, Breadcrumbs, Link as MuiLink,
    Table, TableHead, TableRow, TableCell, TableBody, Skeleton, // CHANGE
} from '@mui/material';
import { useUnitsByProject } from '../../entities/unit';
import { useQuery }          from '@tanstack/react-query';
import { supabase }          from '@shared/api/supabaseClient';

const UnitsPage = () => {
    /* ——— 1. id проекта из query-string ——— */
    const [sp]      = useSearchParams();
    const projectId = sp.get('project');            // строка | null

    /* ——— 2. объекты (с фильтром или без) ——— */
    const {
        data: units = [],
        isPending: unitsPending,
        error:     unitsErr,
    } = useUnitsByProject(projectId);

    /* ——— 3. имя проекта (если выбран фильтр) ——— */
    const {
        data: projectData,
        isPending: projPending,
        error:     projErr,
    } = useQuery({
        queryKey: ['projectName', projectId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('projects')
                .select('name')
                .eq('id', projectId)
                .single();
            if (error) throw error;
            return data;                            // { name: '...' }
        },
        enabled: !!projectId,
    });

    const projectName = projectData?.name;

    /* ——— 4. состояния загрузки / ошибок ——— */
    if (unitsPending || projPending)
        return <Skeleton variant="rectangular" height={240} />;      // CHANGE
    if (unitsErr)  return <Typography color="error">Ошибка загрузки объектов.</Typography>;
    if (projErr)   return <Typography color="error">Ошибка загрузки проекта.</Typography>;

    /* ——— 5. UI ——— */
    return (
        <Paper sx={{ p: 3 }}>
            {projectId && (
                <Breadcrumbs sx={{ mb: 2 }}>
                    <MuiLink component={RouterLink} underline="hover" to="/units">
                        Все объекты
                    </MuiLink>
                    <Typography color="text.primary">{projectName}</Typography>
                </Breadcrumbs>
            )}

            <Typography variant="h5" mb={2}>
                {projectId ? `Объекты проекта «${projectName}»` : 'Все объекты'}
            </Typography>

            <Table size="small">
                <TableHead>
                    <TableRow>
                        <TableCell>ID</TableCell>
                        <TableCell>Название</TableCell>
                        {!projectId && <TableCell>Проект</TableCell>}
                        <TableCell>Этаж</TableCell>
                        <TableCell>Секция / Корпус</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {units.map(u => (
                        <TableRow key={u.id}>
                            <TableCell>{u.id}</TableCell>
                            <TableCell>
                                <MuiLink component={RouterLink} to={`/units/${u.id}`}>
                                    {u.name}
                                </MuiLink>
                            </TableCell>
                            {!projectId && <TableCell>{u.project?.name}</TableCell>}
                            <TableCell>{u.floor    ?? '—'}</TableCell>
                            <TableCell>{u.building ?? '—'}</TableCell>
                        </TableRow>
                    ))}
                    {units.length === 0 && (
                        <TableRow>
                            {/* colSpan пересчитан: 4 колонки с фильтром, 5 — без него */}
                            <TableCell colSpan={projectId ? 4 : 5} /* CHANGE */>
                                Нет объектов{projectId ? ' в этом проекте.' : '.'}
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </Paper>
    );
};

export default UnitsPage;
