// src/app/App.js
import React, { useEffect, useCallback } from "react";
import { Container, Box, Toolbar } from "@mui/material";
import { useLocation } from "react-router-dom";

import { supabase } from "@shared/api/supabaseClient";
import { useAuthStore } from "@shared/store/authStore";

import NavBar from "@/widgets/NavBar";
import AppRouter from "./Router";

const log = (...a) => console.log("%c[App]", "color:teal", ...a);

export default function App() {
  const setProfile = useAuthStore((s) => s.setProfile);
  const location = useLocation();

  const loadProfile = useCallback(
    async (user, tag = "") => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, name, role, project_id")
        .eq("id", user.id)
        .single();

      log(`loadProfile[${tag}]`, { data, error });

      setProfile(
        data ?? {
          id: user.id,
          email: user.email,
          name: user.user_metadata?.name ?? null,
          role: "USER",
          project_id: null,
        },
      );
    },
    [setProfile],
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
      data-oid="2y2e_y8"
    >
      {!hideNavBar && <NavBar data-oid="n7rr2vl" />}
      {!hideNavBar && <Toolbar data-oid="1f-y7q7" />}{" "}
      {/* Компенсация высоты фиксированной шапки */}
      <Container
        maxWidth={false}
        sx={{ flexGrow: 1, py: 3 }}
        data-oid="58qztm:"
      >
        <AppRouter data-oid="nlkhm26" />
      </Container>
    </Box>
  );
}
