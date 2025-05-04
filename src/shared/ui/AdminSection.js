import React from 'react';
import {
    Paper, Stack, Typography, IconButton, Button,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

/**
 * Админ-секция с заголовком, кнопкой «Добавить» и контентом.
 *
 * @param {string}   title     – заголовок
 * @param {boolean}  busy      – скрывать кнопку «+», если true
 * @param {() => void=} onAdd  – обработчик добавления
 * @param {boolean=} fullBtn   – true → кнопка с текстом («Добавить»)
 */
const AdminSection = ({
                          title, busy = false, onAdd, fullBtn = false, children,
                      }) => (
    <Paper
        sx={{
            p: 2,
            width: '100%',
            border: 1,
            borderColor: 'grey.300',
            borderRadius: 2,
            boxShadow: 1,
        }}
    >
        <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            mb={2}
        >
            <Typography variant="h6">{title}</Typography>

            {!busy && onAdd && (
                fullBtn ? (
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />} onClick={onAdd}
                    >
                        Добавить
                    </Button>
                ) : (
                    <IconButton onClick={onAdd} size="large">
                        <AddIcon />
                    </IconButton>
                )
            )}
        </Stack>

        {children}
    </Paper>
);

export default AdminSection;
