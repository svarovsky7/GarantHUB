// src/app/Router.js
// -----------------------------------------------------------------------------
// CHANGE: скорректированы пути к страницам Login и Register
// -----------------------------------------------------------------------------
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Backdrop, CircularProgress } from "@mui/material";

import { useAuthStore } from "@/shared/store/authStore";
import DashboardPage from "@/pages/DashboardPage/DashboardPage";
import TicketsPage from "@/pages/TicketsPage/TicketsPage";
import TicketFormPage from "@/pages/TicketsPage/TicketFormPage";
import StatsPage from "@/pages/StatsPage/StatsPage";
import LoginPage from "@/pages/UnitsPage/LoginPage"; // ← CHANGE
import RegisterPage from "@/pages/UnitsPage/RegisterPage"; // ← CHANGE
import AdminPage from "@/pages/UnitsPage/AdminPage";
import ProjectStructurePage from "@/pages/ProjectStructurePage/ProjectStructurePage";

/** --------------------------------------------------------------------------
 *  Компонент-сторож
 *  -------------------------------------------------------------------------*/
function RequireAuth({ children }) {
  const profile = useAuthStore((s) => s.profile);

  if (profile === undefined) {
    return (
      <Backdrop open data-oid="_b.0km4">
        <CircularProgress size={48} data-oid="fzms4oz" />
      </Backdrop>
    );
  }

  if (profile === null) {
    return <Navigate to="/login" replace data-oid="hu3popo" />;
  }

  return children;
}

/** --------------------------------------------------------------------------
 *  Маршрутизация
 *  -------------------------------------------------------------------------*/
export default function AppRouter() {
  return (
    <Routes data-oid="ruw1tw2">
      {/* Публичные -------------------------------------------------------*/}
      <Route
        path="/login"
        element={<LoginPage data-oid=":2eb:5p" />}
        data-oid=":1kpe3a"
      />

      <Route
        path="/register"
        element={<RegisterPage data-oid="fpkfpf1" />}
        data-oid="ws8fl2:"
      />

      {/* Приватные -------------------------------------------------------*/}
      <Route
        path="/"
        element={
          <RequireAuth data-oid="rptqkuu">
            <DashboardPage data-oid="o15tqwc" />
          </RequireAuth>
        }
        data-oid="v691dn1"
      />

      <Route
        path="/tickets"
        element={
          <RequireAuth data-oid="chl-fj_">
            <TicketsPage data-oid="tqdbckz" />
          </RequireAuth>
        }
        data-oid="t9:n-i1"
      />

      <Route
        path="/structure"
        element={
          <RequireAuth data-oid="lu7tggr">
            <ProjectStructurePage data-oid="v3k.:x-" />
          </RequireAuth>
        }
        data-oid="er:7idy"
      />

      <Route
        path="/tickets/new"
        element={
          <RequireAuth data-oid="s48ld_t">
            <TicketFormPage data-oid=":.dupuk" />
          </RequireAuth>
        }
        data-oid="071rhxx"
      />

      <Route
        path="/tickets/:ticketId/edit"
        element={
          <RequireAuth data-oid="6-8jbfm">
            <TicketFormPage data-oid="xdn478x" />
          </RequireAuth>
        }
        data-oid="7i4eigl"
      />

      <Route
        path="/stats"
        element={
          <RequireAuth data-oid="cg7xsi8">
            <StatsPage data-oid="1tc7jco" />
          </RequireAuth>
        }
        data-oid=":za0y8-"
      />

      <Route
        path="/admin"
        element={
          <RequireAuth data-oid="x8a6w87">
            <AdminPage data-oid="st0-nba" />
          </RequireAuth>
        }
        data-oid="uaq5me0"
      />

      {/* Fallback --------------------------------------------------------*/}
      <Route
        path="*"
        element={<Navigate to="/" replace data-oid="f33ncow" />}
        data-oid="7u9kbc."
      />
    </Routes>
  );
}
