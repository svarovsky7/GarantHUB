import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
} from "@mui/material";
import { supabase } from "@/shared/api/supabaseClient";
import { useAuthStore } from "@/shared/store/authStore";

export default function AddBuildingOrSectionDialog({
  open,
  type,
  onClose,
  projectId,
  building,
  afterAdd,
}) {
  const [value, setValue] = useState("");
  const handleConfirm = async () => {
    if (!value.trim()) return;
    const userId = useAuthStore.getState().profile?.id ?? null;
    if (type === "building") {
      await supabase.from("units").insert([
        {
          project_id: projectId,
          building: value.trim(),
          section: null,
          floor: 1,
          name: "1",
          person_id: userId,
        },
      ]);
    }
    if (type === "section") {
      await supabase.from("units").insert([
        {
          project_id: projectId,
          building,
          section: value.trim(),
          floor: 1,
          name: "1",
          person_id: userId,
        },
      ]);
    }
    onClose();
    afterAdd && afterAdd(value.trim());
  };

  return (
    <Dialog open={open} onClose={onClose} data-oid="n_2rafr">
      <DialogTitle data-oid="7nlr6k1">
        {type === "building" ? "Добавить корпус" : "Добавить секцию"}
      </DialogTitle>
      <DialogContent data-oid="vk6n.jk">
        <TextField
          autoFocus
          fullWidth
          label={type === "building" ? "Название корпуса" : "Название секции"}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          sx={{ mt: 1 }}
          data-oid="jnk:nhf"
        />
      </DialogContent>
      <DialogActions data-oid="vx2hi9u">
        <Button onClick={onClose} data-oid="odjk6cm">
          Отмена
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          disabled={!value.trim()}
          data-oid="ml1q2-a"
        >
          Добавить
        </Button>
      </DialogActions>
    </Dialog>
  );
}
