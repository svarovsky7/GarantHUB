import React from 'react';
import ReactDOM from 'react-dom/client';
import App       from './app/App';
import Notifier  from './shared/ui/Notifier';

import {
    CssBaseline,
    ThemeProvider,
    createTheme,
} from '@mui/material';

/* ——— минимальная кастомизация темы при желании ——— */
const theme = createTheme({
    palette: {
        mode: 'light',
    },
});

ReactDOM.createRoot(document.getElementById('root')).render(
    <ThemeProvider theme={theme}>
        <CssBaseline />
        <Notifier>
            <App />
        </Notifier>
    </ThemeProvider>,
);
