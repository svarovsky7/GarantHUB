// src/app/Router.js
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import DashboardPage      from '@/pages/DashboardPage/DashboardPage';
import UnitsPage          from '@/pages/UnitsPage/UnitsPage';
import UnitDetailPage     from '@/pages/UnitDetailPage/UnitDetailPage';
import TicketsPage        from '@/pages/TicketsPage/TicketsPage';
import TicketsListPage    from '@/pages/TicketsPage/TicketsListPage';      // NEW
import LoginPage          from '@/pages/UnitsPage/LoginPage';
import RegisterPage       from '@/pages/UnitsPage/RegisterPage';
import AdminPage          from '@/pages/UnitsPage/AdminPage';

const AppRouter = () => (
    /* здесь НЕТ BrowserRouter – он уже обёрнут в index.js */
    <Routes>
        <Route path="/"                element={<DashboardPage />} />
        <Route path="/units"           element={<UnitsPage />} />
        <Route path="/units/:id"       element={<UnitDetailPage />} />

        {/* раздел замечаний */}
        <Route path="/tickets"         element={<TicketsPage />} />
        <Route path="/tickets/list"    element={<TicketsListPage />} /> {/* NEW */}

        {/* auth */}
        <Route path="/login"           element={<LoginPage />} />
        <Route path="/register"        element={<RegisterPage />} />

        {/* admin */}
        <Route path="/admin"           element={<AdminPage />} />

        {/* fallback */}
        <Route path="*"                element={<Navigate to="/" replace />} />
    </Routes>
);

export default AppRouter;
