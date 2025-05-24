import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Stack,
    Typography,
    Tabs,
    Tab,
} from '@mui/material';
import dayjs from 'dayjs';
import LettersTable from './LettersTable';
import CaseDefectsTable from './CaseDefectsTable';
import { useCaseLetters } from '@/entities/letter';
import { useCaseDefects } from '@/entities/caseDefect';

export default function CourtCaseDetailsDialog({ open, caseData, onClose }) {
    const { data: letters = [] } = useCaseLetters(caseData?.id);
    const { data: defects = [] } = useCaseDefects(caseData?.id);
    const [tab, setTab] = useState(0);

    if (!caseData) return null;

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
            <DialogTitle>Дело № {caseData.internal_no}</DialogTitle>
            <DialogContent dividers>
                <Stack spacing={1} mb={2}>
                    <Typography variant="body2">Объект: {caseData.unit_name}</Typography>
                    <Typography variant="body2">Стадия: {caseData.stage_name}</Typography>
                    <Typography variant="body2">Статус: {caseData.status}</Typography>
                    {caseData.fix_start_date && (
                        <Typography variant="body2">
                            Начало устранения: {dayjs(caseData.fix_start_date).format('DD.MM.YYYY')}
                        </Typography>
                    )}
                    {caseData.fix_end_date && (
                        <Typography variant="body2">
                            Завершение устранения: {dayjs(caseData.fix_end_date).format('DD.MM.YYYY')}
                        </Typography>
                    )}
                    {caseData.comments && (
                        <Typography variant="body2">Заметки: {caseData.comments}</Typography>
                    )}
                </Stack>
                <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
                    <Tab label="Письма" />
                    <Tab label="Недостатки" />
                </Tabs>
                {tab === 0 && <LettersTable rows={letters} onEdit={() => {}} />}
                {tab === 1 && <CaseDefectsTable rows={defects} />}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Закрыть</Button>
            </DialogActions>
        </Dialog>
    );
}
