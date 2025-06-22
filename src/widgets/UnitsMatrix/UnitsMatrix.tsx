import React, { useState, useEffect } from "react";
import {
  Box,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Tooltip,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import FloorCell from "@/entities/floor/FloorCell";
import useUnitsMatrix from "@/shared/hooks/useUnitsMatrix";
import { supabase } from "@/shared/api/supabaseClient";
import HistoryDialog from "@/features/history/HistoryDialog";
import { useNavigate, createSearchParams } from 'react-router-dom';
import { useAuthStore } from '@/shared/store/authStore';

/**
 * Шахматка квартир/этажей для заданного проекта/корпуса/секции.
 */
export default function UnitsMatrix({
  projectId,
  building,
  section,
  onUnitsChanged,
}) {
  const {
    floors,
    unitsByFloor,
    handleAddUnit,
    handleAddFloor,
    fetchUnits,
    casesByUnit,
    units,
  } = useUnitsMatrix(projectId, building, section);
  const navigate = useNavigate();
  const profileId = useAuthStore((s) => s.profile?.id);

  // Диалоги редактирования/удаления
  const [editDialog, setEditDialog] = useState({
    open: false,
    type: "",
    target: null,
    value: "",
  });
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    type: "",
    target: null,
  });

  // Диалог действий по квартире
  const [actionDialog, setActionDialog] = useState({
    open: false,
    unit: null,
    action: "",
  });

  // Прокидываем units (все объекты проекта) наверх для счетчиков
  useEffect(() => {
    if (typeof onUnitsChanged === "function") {
      onUnitsChanged(units);
    }
  }, [units, onUnitsChanged]);

  // Этаж
  const handleEditFloor = (floor) =>
    setEditDialog({
      open: true,
      type: "floor",
      target: floor,
      value: String(floor),
    });
  const handleDeleteFloor = (floor) =>
    setConfirmDialog({ open: true, type: "floor", target: floor });
  // Квартира
  const handleEditUnit = (unit) =>
    setEditDialog({ open: true, type: "unit", target: unit, value: unit.name });
  const handleDeleteUnit = (unit) =>
    setConfirmDialog({ open: true, type: "unit", target: unit });
  const handleUnitAction = (unit) =>
    setActionDialog({ open: true, unit, action: "" });

  // Сохранить (обновление в базе и fetchUnits)
  const handleSaveEdit = async () => {
    if (editDialog.type === "floor") {
      const newFloor = isNaN(editDialog.value as any)
        ? editDialog.value
        : Number(editDialog.value);
      // Получаем все квартиры на выбранном этаже
      const floorUnits: any[] = [];
      for (const u of Object.values(unitsByFloor).flat() as any[]) {
        if ((u as any).floor === editDialog.target) floorUnits.push(u);
      }
      if (floorUnits.length) {
        const ids = floorUnits.map((u) => u.id);
        await supabase.from("units").update({ floor: newFloor }).in("id", ids);
      }
    }
    if (editDialog.type === "unit") {
      await supabase
        .from("units")
        .update({ name: editDialog.value })
        .eq("id", editDialog.target.id);
    }
    setEditDialog({ open: false, type: "", target: null, value: "" });
    await fetchUnits();
  };

  // Удалить (с реальным удалением из БД)
  const handleConfirmDelete = async () => {
    if (confirmDialog.type === "floor") {
      await supabase
        .from("units")
        .delete()
        .eq("project_id", projectId)
        .eq("building", building)
        .eq("floor", Number(confirmDialog.target));
      await fetchUnits(); // Только fetchUnits, не setUnits!
    }
    if (confirmDialog.type === "unit") {
      await supabase.from("units").delete().eq("id", confirmDialog.target.id);
      await fetchUnits(); // Только fetchUnits, не setUnits!
    }
    setConfirmDialog({ open: false, type: "", target: null });
  };

  if (!floors.length) {
    return (
      <Box
        sx={{
          mt: 4,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 100,
        }}
      >
        <IconButton
          onClick={handleAddFloor}
          sx={{
            border: "2px dashed #1976d2",
            width: 56,
            height: 56,
            color: "#1976d2",
            background: "#F3F7FF",
            borderRadius: "50%",
            fontSize: 38,
            "&:hover": { background: "#e3ecfb" },
          }}
        >
          <AddIcon fontSize="inherit" />
        </IconButton>
        <Box sx={{ color: "#888", mt: 1, fontSize: 15, fontWeight: 500 }}>
          Добавить первый этаж
        </Box>
      </Box>
    );
  }

  // Если этажи есть — обычный вывод шахматки
  return (
    <>
      <Box
        sx={{
          display: "inline-flex",
          flexDirection: "column",
          alignItems: "flex-start",
          pl: 0,
          mt: 2,
          gap: 1,
        }}
      >
        {floors.map((floor) => (
          <FloorCell
            key={floor}
            floor={floor}
            units={unitsByFloor[floor] || []}
            casesByUnit={casesByUnit}
            onAddUnit={() => handleAddUnit(floor)}
            onEditFloor={handleEditFloor}
            onDeleteFloor={handleDeleteFloor}
            onEditUnit={handleEditUnit}
            onDeleteUnit={handleDeleteUnit}
            onUnitClick={handleUnitAction}
          />
        ))}
        {/* Кнопка добавления нового этажа */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            mt: 1,
          }}
        >
          <Box
            sx={{
              width: 80,
              minWidth: 80,
              height: 54,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRight: "2.5px solid #1976d2",
              borderRadius: "12px 0 0 12px",
              background: "#fff",
            }}
          >
            <IconButton
              onClick={handleAddFloor}
              sx={{
                border: "2px dashed #1976d2",
                width: 44,
                height: 44,
                background: "#F3F7FF",
                color: "#1976d2",
                "&:hover": { background: "#e3ecfb" },
              }}
            >
              <AddIcon fontSize="large" />
            </IconButton>
          </Box>
        </Box>

        {/* Диалоги */}
        <Dialog
          open={editDialog.open}
          onClose={() =>
            setEditDialog({ open: false, type: "", target: null, value: "" })
          }
        >
          <DialogTitle>
            {editDialog.type === "floor"
              ? "Переименовать этаж"
              : "Переименовать квартиру"}
          </DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              autoFocus
              value={editDialog.value}
              onChange={(e) =>
                setEditDialog({ ...editDialog, value: e.target.value })
              }
              sx={{ mt: 2 }}
            />
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() =>
                setEditDialog({
                  open: false,
                  type: "",
                  target: null,
                  value: "",
                })
              }
            >
              Отмена
            </Button>
            <Button variant="contained" onClick={handleSaveEdit}>
              Сохранить
            </Button>
          </DialogActions>
        </Dialog>
        <Dialog
          open={confirmDialog.open}
          onClose={() =>
            setConfirmDialog({ open: false, type: "", target: null })
          }
        >
          <DialogTitle>
            {confirmDialog.type === "floor"
              ? `Удалить этаж "${confirmDialog.target}" со всеми квартирами?`
              : `Удалить квартиру "${confirmDialog.target?.name}"?`}
          </DialogTitle>
          <DialogContent>
            {confirmDialog.type === "floor"
              ? "Все квартиры на этом этаже будут удалены безвозвратно."
              : "Квартира будет удалена безвозвратно."}
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() =>
                setConfirmDialog({ open: false, type: "", target: null })
              }
            >
              Отмена
            </Button>
            <Button
              color="error"
              variant="contained"
              onClick={handleConfirmDelete}
            >
              Удалить
            </Button>
          </DialogActions>
        </Dialog>
      </Box>

      {/* Модальное меню по ячейке квартиры */}
      <Dialog
        open={actionDialog.open}
        onClose={() => setActionDialog({ open: false, unit: null, action: "" })}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { minWidth: 540, maxWidth: 900 },
        }}
      >
        <DialogTitle sx={{ fontWeight: 600, textAlign: "center" }}>
          Квартира {actionDialog.unit?.name}
        </DialogTitle>
        {!actionDialog.action && (
          <DialogContent
            sx={{ display: "flex", flexDirection: "column", gap: 2 }}
          >
            <Button
              variant="contained"
              color="secondary"
              fullWidth
              onClick={() => {
                const id = actionDialog.unit?.id;
                const search = createSearchParams({
                  project_id: String(projectId),
                  unit_id: String(id ?? ''),
                  responsible_lawyer_id: String(profileId ?? ''),
                  open_form: '1',
                }).toString();
                navigate(`/court-cases?${search}`);
                setActionDialog({ open: false, unit: null, action: '' });
              }}
              Добавить судебное дело
            </Button>
            <Button
              variant="contained"
              color="info"
              fullWidth
              onClick={() => {
                const id = actionDialog.unit?.id;
                const search = createSearchParams({
                  project_id: String(projectId),
                  unit_id: String(id ?? ''),
                  responsible_user_id: String(profileId ?? ''),
                  open_form: '1',
                }).toString();
                navigate(`/correspondence?${search}`);
                setActionDialog({ open: false, unit: null, action: '' });
              }}
            >
              Добавить письмо
            </Button>
            <Button
              variant="contained"
              color="inherit"
              fullWidth
              onClick={() =>
                setActionDialog((ad) => ({ ...ad, action: 'history' }))
              }
            >
              Показать историю
            </Button>
          </DialogContent>
        )}
      </Dialog>
      {/* Диалог со всеми замечаниями */}
      <HistoryDialog
        open={actionDialog.action === "history"}
        unit={actionDialog.unit}
        onClose={() => setActionDialog({ open: false, unit: null, action: "" })}
      />
    </>
  );
}
