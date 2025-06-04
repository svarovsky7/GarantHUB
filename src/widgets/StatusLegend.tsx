import React from 'react';
import { Box, Typography } from '@mui/material';
import { useTicketStatuses } from '@/entities/ticketStatus';

/**
 * Небольшой блок легенды статусов.
 * Отображает цвета статусов замечаний и пояснение к красной обводке.
 */
export default function StatusLegend() {
  const { data: statuses = [] } = useTicketStatuses();

  return (
    <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
      <Typography variant="subtitle2">Легенда:</Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        {statuses.map((s) => (
          <Box key={s.id} sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
            <Box
              sx={{
                width: 12,
                height: 12,
                bgcolor: s.color,
                borderRadius: '50%',
                mr: 0.5,
              }}
            />
            <Typography variant="body2">{s.name}</Typography>
          </Box>
        ))}
      </Box>
      <Typography variant="body2" color="text.secondary">
        Красная обводка — квартиры с судебными делами
      </Typography>
    </Box>
  );
}
