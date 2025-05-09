// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import App from './app/App';
import Notifier from './shared/ui/Notifier';

import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';

import {
    QueryClientProvider,
    HydrationBoundary        // ← корректный компонент v5
} from '@tanstack/react-query';
// DevTools подключаем только в разработке
/* eslint-disable import/no-extraneous-dependencies */
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

import { queryClient } from '@/shared/config/queryClient';

const theme = createTheme({ palette: { mode: 'light' } });

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <QueryClientProvider client={queryClient}>
            {/* HydrationBoundary можно убрать, если не планируете SSR */}
            <HydrationBoundary>
                <BrowserRouter>
                    <ThemeProvider theme={theme}>
                        <CssBaseline />
                        <Notifier>
                            <App />
                        </Notifier>
                    </ThemeProvider>
                </BrowserRouter>
            </HydrationBoundary>

            {/* показываем DevTools только в dev-режиме */}
            {process.env.NODE_ENV !== 'production' && (
                <ReactQueryDevtools initialIsOpen={false} />
            )}
        </QueryClientProvider>
    </React.StrictMode>
);
