// -----------------------------------------------------------------------------
// Обёртка страницы создания / редактирования замечания с фиолетовым header
// ВАЖНО: форма полностью перемонтируется при смене projectId –
// благодаря этому пользователь никогда не увидит «чужие» проекты/объекты.
// -----------------------------------------------------------------------------
import React from 'react';
import { Box, Paper, Typography } from '@mui/material';
import { useParams } from 'react-router-dom';

import TicketForm          from '@/features/ticket/TicketForm';
import { useProjectId }    from '@/shared/hooks/useProjectId';      // CHANGE: текущий проект

export default function TicketFormPage() {
    const { ticketId } = useParams();
    const title       = ticketId ? 'Редактирование замечания' : 'Добавление замечания';

    const projectId = useProjectId();                               // CHANGE

    return (
        <Box sx={{ p: { xs: 2, md: 4 } }}>
            <Paper elevation={3} sx={{ borderRadius: 2, overflow: 'hidden' }}>
                {/* --- фиолетовый header --- */}
                <Box sx={{ bgcolor: 'primary.main', color: '#fff', py: 2, px: 3 }}>
                    <Typography variant="h6" fontWeight={600}>{title}</Typography>
                </Box>

                {/* --- форма --- */}
                <Box sx={{ p: { xs: 3, md: 5 } }}>
                    {/* -----------------------------------------------------------------
                       CHANGE: key заставляет React размонтировать TicketForm
                       при изменении projectId или ticketId.  Благодаря этому:
                       • при создании нового замечания в поле «Проект» остаётся
                         только один (разрешённый) пункт;
                       • смена проекта в NavBar мгновенно отражается на форме,
                         сбрасывает стейт и подгружает новые справочники.
                       ----------------------------------------------------------------- */}
                    <TicketForm key={`${projectId ?? 'none'}-${ticketId ?? 'new'}`} />
                </Box>
            </Paper>
        </Box>
    );
}
