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
    afterAdd && afterAdd();
  };

  return (
    <Dialog open={open} onClose={onClose} data-oid="0.pz735">
      <DialogTitle data-oid="xt.w95g">
        {type === "building" ? "Добавить корпус" : "Добавить секцию"}
      </DialogTitle>
      <DialogContent data-oid="xhotonp">
        <TextField
          autoFocus
          fullWidth
          label={type === "building" ? "Название корпуса" : "Название секции"}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          sx={{ mt: 1 }}
          data-oid="3f1o5pw"
        />
      </DialogContent>
      <DialogActions data-oid="75s3tr1">
        <Button onClick={onClose} data-oid="shr0-7p">
          Отмена
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          disabled={!value.trim()}
          data-oid="secba6y"
        >
          Добавить
        </Button>
      </DialogActions>
    </Dialog>
  );
}
