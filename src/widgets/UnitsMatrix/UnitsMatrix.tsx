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
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import FloorCell from "@/entities/floor/FloorCell";
import useUnitsMatrix from "@/shared/hooks/useUnitsMatrix";
import { supabase } from "@/shared/api/supabaseClient";
import TicketForm from "@/features/ticket/TicketForm";
import TicketListDialog from "@/features/ticket/TicketListDialog";

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
    ticketsByUnit,
    units,
  } = useUnitsMatrix(projectId, building, section);

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
        data-oid="k8ndm0."
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
          data-oid="sg:z3he"
        >
          <AddIcon fontSize="inherit" data-oid="quzkjkp" />
        </IconButton>
        <Box
          sx={{ color: "#888", mt: 1, fontSize: 15, fontWeight: 500 }}
          data-oid="c9koqbt"
        >
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
        data-oid="s5p9kjq"
      >
        {floors.map((floor) => (
          <FloorCell
            key={floor}
            floor={floor}
            units={unitsByFloor[floor] || []}
            ticketsByUnit={ticketsByUnit}
            onAddUnit={() => handleAddUnit(floor)}
            onEditFloor={handleEditFloor}
            onDeleteFloor={handleDeleteFloor}
            onEditUnit={handleEditUnit}
            onDeleteUnit={handleDeleteUnit}
            onUnitClick={handleUnitAction}
            data-oid="n7-y_3p"
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
          data-oid="hmsfq-d"
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
            data-oid="otdyeas"
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
              data-oid="ef352ce"
            >
              <AddIcon fontSize="large" data-oid="3oghgj2" />
            </IconButton>
          </Box>
        </Box>

        {/* Диалоги */}
        <Dialog
          open={editDialog.open}
          onClose={() =>
            setEditDialog({ open: false, type: "", target: null, value: "" })
          }
          data-oid=".h855ie"
        >
          <DialogTitle data-oid="mt9s9:b">
            {editDialog.type === "floor"
              ? "Переименовать этаж"
              : "Переименовать квартиру"}
          </DialogTitle>
          <DialogContent data-oid="8nyeqry">
            <TextField
              fullWidth
              autoFocus
              value={editDialog.value}
              onChange={(e) =>
                setEditDialog({ ...editDialog, value: e.target.value })
              }
              sx={{ mt: 2 }}
              data-oid="lanoa-8"
            />
          </DialogContent>
          <DialogActions data-oid="io2k0g.">
            <Button
              onClick={() =>
                setEditDialog({
                  open: false,
                  type: "",
                  target: null,
                  value: "",
                })
              }
              data-oid="t96ako2"
            >
              Отмена
            </Button>
            <Button
              variant="contained"
              onClick={handleSaveEdit}
              data-oid="y_g_x06"
            >
              Сохранить
            </Button>
          </DialogActions>
        </Dialog>
        <Dialog
          open={confirmDialog.open}
          onClose={() =>
            setConfirmDialog({ open: false, type: "", target: null })
          }
          data-oid="3sq9ku-"
        >
          <DialogTitle data-oid="u-:kpzq">
            {confirmDialog.type === "floor"
              ? `Удалить этаж "${confirmDialog.target}" со всеми квартирами?`
              : `Удалить квартиру "${confirmDialog.target?.name}"?`}
          </DialogTitle>
          <DialogContent data-oid="s7_iaw2">
            {confirmDialog.type === "floor"
              ? "Все квартиры на этом этаже будут удалены безвозвратно."
              : "Квартира будет удалена безвозвратно."}
          </DialogContent>
          <DialogActions data-oid="0.61eq6">
            <Button
              onClick={() =>
                setConfirmDialog({ open: false, type: "", target: null })
              }
              data-oid="wt8eebn"
            >
              Отмена
            </Button>
            <Button
              color="error"
              variant="contained"
              onClick={handleConfirmDelete}
              data-oid="tbemt_c"
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
        data-oid="juyi6_7"
      >
        <DialogTitle
          sx={{ fontWeight: 600, textAlign: "center" }}
          data-oid="wcse6es"
        >
          Квартира {actionDialog.unit?.name}
        </DialogTitle>
        {!actionDialog.action && (
          <DialogContent
            sx={{ display: "flex", flexDirection: "column", gap: 2 }}
            data-oid="p1hvufk"
          >
            <Button
              variant="contained"
              color="primary"
              fullWidth
              onClick={() =>
                setActionDialog((ad) => ({ ...ad, action: "ticket" }))
              }
              data-oid="ihmf4ul"
            >
              Добавить замечание
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              fullWidth
              disabled
              data-oid="zus4j72"
            >
              Добавить судебное дело
            </Button>
            <Button
              variant="text"
              color="info"
              fullWidth
              onClick={() =>
                setActionDialog((ad) => ({ ...ad, action: "tickets" }))
              }
              data-oid="qsm51wq"
            >
              Посмотреть все замечания
            </Button>
            <Button
              variant="text"
              color="info"
              fullWidth
              disabled
              data-oid="a51l3wg"
            >
              Показать историю
            </Button>
          </DialogContent>
        )}
        {actionDialog.action === "ticket" && (
          <DialogContent sx={{ p: 0, pt: 2 }} data-oid="bdm-zfq">
            <Typography
              sx={{ fontWeight: 500, textAlign: "center", mb: 2 }}
              data-oid="4p161bz"
            >
              Добавление замечания для квартиры {actionDialog.unit?.name}
            </Typography>
            <Box sx={{ px: 2, pb: 2 }} data-oid="i165.zl">
              <TicketForm
                embedded
                initialUnitId={actionDialog.unit?.id}
                onCreated={() => {
                  setActionDialog({ open: false, unit: null, action: "" });
                  fetchUnits();
                }}
                onCancel={() =>
                  setActionDialog({ open: false, unit: null, action: "" })
                }
                ticketId={undefined}
                data-oid="h5e_0am"
              />
            </Box>
          </DialogContent>
        )}
      </Dialog>
      {/* Диалог со всеми замечаниями */}
      <TicketListDialog
        open={actionDialog.action === "tickets"}
        unit={actionDialog.unit}
        onClose={() => setActionDialog({ open: false, unit: null, action: "" })}
        onTicketsChanged={fetchUnits}
        data-oid="j88yt1h"
      />
    </>
  );
}
