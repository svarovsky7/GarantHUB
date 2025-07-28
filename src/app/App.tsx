// src/app/App.js
import React, { useEffect, useCallback } from "react";
import { Container, Box, Toolbar } from "@mui/material";
import { useLocation } from "react-router-dom";
import { useSnackbar } from "notistack";

import { supabase } from "@/shared/api/supabaseClient";
import { useAuthStore } from "@/shared/store/authStore";
import { useRealtimeUpdates } from "@/shared/hooks/useRealtimeUpdates";

import NavBar from "@/widgets/NavBar";
import AppRouter from "./Router";

export default function App() {
  const setProfile = useAuthStore((s) => s.setProfile);
  const location = useLocation();
  const { enqueueSnackbar } = useSnackbar();
  useRealtimeUpdates();

  const loadProfile = useCallback(
    async (user, tag = "") => {
      const { data, error } = await supabase
        .from("profiles")
        .select(
          "id, email, name, role, created_at, is_active, profiles_projects(project_id)"
        )
        .eq("id", user.id)
        .single();

      // Проверка активности происходит в LoginPage при входе
      // Здесь пропускаем проверку, чтобы избежать дублирования сообщений

      setProfile(
        data
          ? {
              ...data,
              project_ids: data.profiles_projects?.map((p: any) => p.project_id) ?? [],
            }
          : {
              id: user.id,
              email: user.email,
              name: user.user_metadata?.name ?? null,
              role: "USER",
              project_ids: [],
              created_at: null,
              is_active: true,
            },
      );
    },
    [setProfile, enqueueSnackbar],
  );

  useEffect(() => {
    let unsub = null;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session?.user) {
        loadProfile(data.session.user, "init");
      } else {
        setProfile(null);
      }
      const { data: { subscription } = {} } = supabase.auth.onAuthStateChange(
        (evt, sess) => {
          if (!sess?.user) {
            setProfile(null);
          } else {
            loadProfile(sess.user, `evt:${evt}`);
          }
        },
      );
      unsub = subscription;
    })();

    return () => unsub?.unsubscribe?.();
  }, [loadProfile, setProfile]);

  const hideNavBar = ["/login", "/register"].includes(location.pathname);

  return (
    <Box
      sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}
      data-oid=":l5ev61"
    >
      {!hideNavBar && <NavBar data-oid="fyv_m5h" />}
      <Container
        maxWidth={false}
        sx={{ 
          flexGrow: 1, 
          py: 2, 
          px: 3,
          width: '100%',
          maxWidth: '100%',
          overflowX: 'auto'
        }}
        data-oid=".x4sl-p"
      >
        <AppRouter data-oid="ozp552w" />
      </Container>
    </Box>
  );
}
