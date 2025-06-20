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
import ClaimsPage from "@/pages/ClaimsPage/ClaimsPage";
import TicketFormPage from "@/pages/TicketsPage/TicketFormPage";
import CourtCasesPage from "@/pages/CourtCasesPage/CourtCasesPage";
import CorrespondencePage from "@/pages/CorrespondencePage/CorrespondencePage";
import DefectsPage from "@/pages/DefectsPage/DefectsPage";
import LoginPage from "@/pages/UnitsPage/LoginPage"; // ← CHANGE
import RegisterPage from "@/pages/UnitsPage/RegisterPage"; // ← CHANGE
import AdminPage from "@/pages/UnitsPage/AdminPage";
import ProjectStructurePage from "@/pages/ProjectStructurePage/ProjectStructurePage";
import RequirePermission from "@/shared/components/RequirePermission";

/** --------------------------------------------------------------------------
 *  Компонент-сторож
 *  -------------------------------------------------------------------------*/
function RequireAuth({ children }) {
  const profile = useAuthStore((s) => s.profile);

  if (profile === undefined) {
    return (
      <Backdrop open data-oid="adbphkk">
        <CircularProgress size={48} data-oid="1i1455r" />
      </Backdrop>
    );
  }

  if (profile === null) {
    return <Navigate to="/login" replace data-oid="bnm5-em" />;
  }

  return children;
}

/** --------------------------------------------------------------------------
 *  Маршрутизация
 *  -------------------------------------------------------------------------*/
export default function AppRouter() {
  return (
    <Routes data-oid="t89l.33">
      {/* Публичные -------------------------------------------------------*/}
      <Route
        path="/login"
        element={<LoginPage data-oid="dom6-ww" />}
        data-oid="p7gyp9j"
      />

      <Route
        path="/register"
        element={<RegisterPage data-oid="mmc85_1" />}
        data-oid="0xz52qw"
      />

      {/* Приватные -------------------------------------------------------*/}
      <Route
        path="/"
        element={
          <RequireAuth data-oid="_5wblnc">
            <RequirePermission page="dashboard">
              <DashboardPage data-oid="mxrre2o" />
            </RequirePermission>
          </RequireAuth>
        }
        data-oid="9:ob6bt"
      />

      <Route
        path="/tickets"
        element={
          <RequireAuth data-oid="nq-xmuj">
            <RequirePermission page="tickets">
              <TicketsPage data-oid="i99wikm" />
            </RequirePermission>
          </RequireAuth>
        }
        data-oid="41m4r4h"
      />

      <Route
        path="/claims"
        element={
          <RequireAuth>
            <RequirePermission page="claims">
              <ClaimsPage />
            </RequirePermission>
          </RequireAuth>
        }
      />
      <Route
        path="/defects"
        element={
          <RequireAuth>
            <RequirePermission page="defects">
              <DefectsPage />
            </RequirePermission>
          </RequireAuth>
        }
      />

      <Route
        path="/court-cases"
        element={
          <RequireAuth>
            <RequirePermission page="court-cases">
              <CourtCasesPage />
            </RequirePermission>
          </RequireAuth>
        }
      />

      <Route
        path="/correspondence"
        element={
          <RequireAuth>
            <RequirePermission page="correspondence">
              <CorrespondencePage />
            </RequirePermission>
          </RequireAuth>
        }
      />

      <Route
        path="/structure"
        element={
          <RequireAuth data-oid="khk60eg">
            <RequirePermission page="structure">
              <ProjectStructurePage data-oid="1zm.al-" />
            </RequirePermission>
          </RequireAuth>
        }
        data-oid="50g:286"
      />


      <Route
        path="/tickets/:ticketId/edit"
        element={
          <RequireAuth data-oid="jw4mt.4">
            <RequirePermission page="tickets">
              <TicketFormPage data-oid="r9pp63u" />
            </RequirePermission>
          </RequireAuth>
        }
        data-oid="rdc_d7y"
      />


      <Route
        path="/admin"
        element={
          <RequireAuth data-oid="f0b3w1p">
            <RequirePermission page="admin">
              <AdminPage data-oid="rs22ppe" />
            </RequirePermission>
          </RequireAuth>
        }
        data-oid="b1_45g_"
      />

      {/* Fallback --------------------------------------------------------*/}
      <Route
        path="*"
        element={<Navigate to="/" replace data-oid="6dl71c8" />}
        data-oid="r4:ccsh"
      />
    </Routes>
  );
}
