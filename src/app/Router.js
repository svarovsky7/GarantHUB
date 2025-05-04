// src/app/Router.js
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import { useAuthStore } from '@shared/store/authStore';

import DashboardPage     from '@pages/DashboardPage/DashboardPage';
import UnitsPage         from '@pages/UnitsPage/UnitsPage';
import UnitDetailPage    from '@pages/UnitDetailPage/UnitDetailPage';
import TicketsPage       from '@pages/TicketsPage/TicketsPage';


import AdminPage    from '@pages/UnitsPage/AdminPage';
import LoginPage    from '@pages/UnitsPage/LoginPage';
import RegisterPage from '@pages/UnitsPage/RegisterPage';

import NavBar from '@widgets/NavBar';

/* ---------- guard ---------- */
const RequireAdmin = ({ children }) => {
    const profile = useAuthStore((s) => s.profile);
    if (!profile) return <Navigate to="/login" replace />;
    return profile.role === 'ADMIN' ? children : <Navigate to="/" replace />;
};

const AppRouter = () => {
    const profile = useAuthStore((s) => s.profile);

    if (profile === undefined) {
        return <div style={{ padding: 32, textAlign: 'center' }}>Загрузка…</div>;
    }

    return (
        <BrowserRouter>
            {/* ---------- публичная секция ---------- */}
            {profile === null && (
                <Routes>
                    <Route path="/login"    element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="*"         element={<Navigate to="/login" replace />} />
                </Routes>
            )}

            {/* ---------- приватная секция ---------- */}
            {profile && (
                <>
                    <NavBar />
                    <Routes>
                        <Route path="/"              element={<DashboardPage />} />
                        <Route path="/units"         element={<UnitsPage />} />
                        <Route path="/units/:unitId" element={<UnitDetailPage />} />
                        <Route path="/tickets"       element={<TicketsPage />} />
                        <Route
                            path="/admin"
                            element={<RequireAdmin><AdminPage /></RequireAdmin>}
                        />
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </>
            )}
        </BrowserRouter>
    );
};

export default AppRouter;
