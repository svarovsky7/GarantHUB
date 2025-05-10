// src/app/Router.js
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import DashboardPage   from '@/pages/DashboardPage/DashboardPage';
import UnitsPage       from '@/pages/UnitsPage/UnitsPage';
import UnitDetailPage  from '@/pages/UnitDetailPage/UnitDetailPage';

import AddTicketPage   from '@/pages/TicketsPage/AddTicketPage';   // /tickets/new
import TicketsListPage from '@/pages/TicketsPage/TicketsListPage';

import LoginPage       from '@/pages/UnitsPage/LoginPage';
import RegisterPage    from '@/pages/UnitsPage/RegisterPage';
import AdminPage       from '@/pages/UnitsPage/AdminPage';

export default function AppRouter() {
        return (
            <Routes>
                    <Route path="/"            element={<DashboardPage />} />
                    <Route path="/units"       element={<UnitsPage />} />
                    <Route path="/units/:id"   element={<UnitDetailPage />} />

                    {/* замечания */}
                    <Route path="/tickets"     element={<TicketsListPage />} />   {/* список */}
                    <Route path="/tickets/new" element={<AddTicketPage />} />     {/* создание */}

                    {/* auth */}
                    <Route path="/login"       element={<LoginPage />} />
                    <Route path="/register"    element={<RegisterPage />} />

                    {/* admin */}
                    <Route path="/admin"       element={<AdminPage />} />

                    <Route path="*"            element={<Navigate to="/" replace />} />
            </Routes>
        );
}
