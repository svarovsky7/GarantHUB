// src/app/Router.js
// -----------------------------------------------------------------------------
// CHANGE: скорректированы пути к страницам Login и Register
// -----------------------------------------------------------------------------
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Backdrop, CircularProgress } from '@mui/material';

import { useAuthStore } from '@/shared/store/authStore';
import DashboardPage   from '@/pages/DashboardPage/DashboardPage';
import TicketsPage     from '@/pages/TicketsPage/TicketsPage';
import TicketFormPage  from '@/pages/TicketsPage/TicketFormPage';
import LitigationsPage from '@/pages/LitigationsPage/LitigationsPage';

import LoginPage    from '@/pages/UnitsPage/LoginPage';     // ← CHANGE
import RegisterPage from '@/pages/UnitsPage/RegisterPage';  // ← CHANGE
import AdminPage    from '@/pages/UnitsPage/AdminPage';

/** --------------------------------------------------------------------------
 *  Компонент-сторож
 *  -------------------------------------------------------------------------*/
function RequireAuth({ children }) {
    const profile = useAuthStore((s) => s.profile);

    if (profile === undefined) {
        return (
            <Backdrop open>
                <CircularProgress size={48} />
            </Backdrop>
        );
    }

    if (profile === null) {
        return <Navigate to="/login" replace />;
    }

    return children;
}

/** --------------------------------------------------------------------------
 *  Маршрутизация
 *  -------------------------------------------------------------------------*/
export default function AppRouter() {
    return (
        <Routes>
            {/* Публичные -------------------------------------------------------*/}
            <Route path="/login"    element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Приватные -------------------------------------------------------*/}
            <Route
                path="/"
                element={(
                    <RequireAuth>
                        <DashboardPage />
                    </RequireAuth>
                )}
            />
            <Route
                path="/tickets"
                element={(
                    <RequireAuth>
                        <TicketsPage />
                    </RequireAuth>
                )}
            />
            <Route
                path="/tickets/new"
                element={(
                    <RequireAuth>
                        <TicketFormPage />
                    </RequireAuth>
                )}
            />
            <Route
                path="/tickets/:ticketId/edit"
                element={(
                    <RequireAuth>
                        <TicketFormPage />
                    </RequireAuth>
                )}
            />
            <Route
                path="/litigations"
                element={(
                    <RequireAuth>
                        <LitigationsPage />
                    </RequireAuth>
                )}
            />
            <Route
                path="/admin"
                element={(
                    <RequireAuth>
                        <AdminPage />
                    </RequireAuth>
                )}
            />

            {/* Fallback --------------------------------------------------------*/}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}
