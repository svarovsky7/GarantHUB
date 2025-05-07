import React, { useEffect } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import {
    Paper, Typography, Breadcrumbs, Link as MuiLink,
    Table, TableHead, TableRow, TableCell,
    TableBody, Skeleton,
} from '@mui/material';
import { useSnackbar }      from 'notistack';
import { useUnit }          from '../../entities/unit';
import { useTicketsByUnit } from '../../entities/ticket';

const UnitDetailPage = () => {
    const { enqueueSnackbar } = useSnackbar();
    const { unitId } = useParams();

    const { data: unit, isPending: uLoad, error: uErr }   = useUnit(unitId);
    const { data: tickets = [], isPending: tLoad, error: tErr } =
        useTicketsByUnit(unitId);

    useEffect(() => {
        if (uErr || tErr)
            enqueueSnackbar('Ошибка загрузки данных.', { variant: 'error' });
    }, [uErr, tErr, enqueueSnackbar]);

    if (uLoad || tLoad)
        return <Skeleton variant="rectangular" height={240} />;
    if (!unit)
        return <Typography>Объект не найден.</Typography>;

    return (
        <Paper sx={{ p: 3 }}>
            <Breadcrumbs sx={{ mb: 2 }}>
                <MuiLink component={RouterLink} underline="hover" to="/units">
                    Объекты
                </MuiLink>
                {unit.project && (
                    <MuiLink
                        component={RouterLink}
                        underline="hover"
                        to={`/units?project=${unit.project.id}`}
                    >
                        {unit.project.name}
                    </MuiLink>
                )}
                <Typography color="text.primary">{unit.name}</Typography>
            </Breadcrumbs>

            <Typography variant="h5" gutterBottom>{unit.name}</Typography>
            <Typography mb={2}>Проект: {unit.project?.name ?? '—'}</Typography>

            <Typography variant="h6" gutterBottom>Заявки</Typography>

            {tickets.length === 0 ? (
                <Typography>Заявок нет.</Typography>
            ) : (
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell>ID</TableCell>
                            <TableCell>Название</TableCell>
                            <TableCell>Статус ID</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {tickets.map(t => (
                            <TableRow key={t.id}>
                                <TableCell>{t.id}</TableCell>
                                <TableCell>{t.title}</TableCell>
                                <TableCell>{t.status_id}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}
        </Paper>
    );
};

export default UnitDetailPage;
