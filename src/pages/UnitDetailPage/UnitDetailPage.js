import React from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import {
    Paper, Typography, Breadcrumbs, Link as MuiLink,
    Table, TableHead, TableRow, TableCell,
    TableBody, Skeleton,
} from '@mui/material';
import { useUnit }         from '../../entities/unit';
import { useTicketsByUnit } from '../../entities/ticket';

const UnitDetailPage = () => {
    const { unitId } = useParams();
    const { data: unit, isPending: uLoad, error: uErr }   = useUnit(unitId);
    const { data: tickets = [], isPending: tLoad, error: tErr } =
        useTicketsByUnit(unitId);

    if (uLoad || tLoad) return <Skeleton variant="rectangular" height={240} />;
    if (uErr  || tErr)  return <Typography color="error">Ошибка загрузки.</Typography>;
    if (!unit)          return <Typography>Объект не найден.</Typography>;

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
            {/* serial удалён — такой колонки нет */}               {/* CHANGE */}
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
                            <TableCell>Статус ID</TableCell>       {/* CHANGE */}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {tickets.map(t => (
                            <TableRow key={t.id}>
                                <TableCell>{t.id}</TableCell>
                                <TableCell>{t.title}</TableCell>
                                <TableCell>{t.status_id}</TableCell> {/* CHANGE */}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}
        </Paper>
    );
};

export default UnitDetailPage;
