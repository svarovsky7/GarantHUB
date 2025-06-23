import React, { useState, useEffect } from "react";
import {
  Box,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button as MuiButton,
  TextField,
  Typography,
  Tooltip,
} from "@mui/material";
import { Modal, Button as AntButton, ConfigProvider } from 'antd';
import ruRU from 'antd/locale/ru_RU';
import AddIcon from "@mui/icons-material/Add";
import FloorCell from "@/entities/floor/FloorCell";
import useUnitsMatrix from "@/shared/hooks/useUnitsMatrix";
import { supabase } from "@/shared/api/supabaseClient";
import { useNavigate, createSearchParams } from 'react-router-dom';
import { useAuthStore } from '@/shared/store/authStore';
import { getUnitNameComparator } from '@/shared/utils/unitNumberSort';
import type { SortDirection } from '@/shared/types/sortDirection';
import { useUnitSortOrders, useUpsertUnitSortOrder } from '@/entities/unitSortOrder';

/**
 * Компонент выводит шахматку квартир для выбранного корпуса проекта.
 *
 * @param projectId       идентификатор проекта
 * @param building        корпус/секция
 * @param onUnitsChanged  callback при изменении списка квартир
 */
export default function UnitsMatrix({
  projectId,
  building,
  onUnitsChanged,
}: {
  projectId: number | string;
  building?: string | null;
  onUnitsChanged?: (units: any[]) => void;
}) {
  const {
    floors,
    unitsByFloor,
    handleAddUnit,
    handleAddFloor,
    fetchUnits,
    casesByUnit,
    lettersByUnit,
    claimsByUnit,
    units,
  } = useUnitsMatrix(projectId, building);
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

  const { data: sortOrders } = useUnitSortOrders(projectId, building);
  const upsertSort = useUpsertUnitSortOrder();
  const [sortDirections, setSortDirections] = useState<Record<string, SortDirection | null>>({});

  useEffect(() => {
    if (sortOrders) {
      setSortDirections(sortOrders);
    }
  }, [sortOrders]);

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

  const handleSortFloor = (floor: string | number) => {
    setSortDirections((prev) => {
      const current = prev[floor] ?? null;
      const next = current === 'asc' ? 'desc' : 'asc';
      upsertSort.mutate({
        project_id: projectId,
        building: building ?? null,
        floor: String(floor),
        sort_direction: next,
      });
      return { ...prev, [floor]: next };
    });
  };

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

  const sortedUnitsByFloor = React.useMemo(() => {
    const map: Record<string, any[]> = {};
    for (const [fl, units] of Object.entries(unitsByFloor)) {
      const dir = sortDirections[fl];
      if (dir) {
        map[fl] = [...units].sort(getUnitNameComparator(dir));
      } else {
        map[fl] = units;
      }
    }
    return map;
  }, [unitsByFloor, sortDirections]);

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
            units={sortedUnitsByFloor[floor] || []}
            casesByUnit={casesByUnit}
            lettersByUnit={lettersByUnit}
            claimsByUnit={claimsByUnit}
            onAddUnit={() => handleAddUnit(floor)}
            onEditFloor={handleEditFloor}
            onDeleteFloor={handleDeleteFloor}
            onEditUnit={handleEditUnit}
            onDeleteUnit={handleDeleteUnit}
            onUnitClick={handleUnitAction}
            onSortUnits={handleSortFloor}
            sortDirection={sortDirections[floor] ?? null}
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
            <MuiButton
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
            </MuiButton>
            <MuiButton variant="contained" onClick={handleSaveEdit}>
              Сохранить
            </MuiButton>
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
            <MuiButton
              onClick={() =>
                setConfirmDialog({ open: false, type: "", target: null })
              }
            >
              Отмена
            </MuiButton>
            <MuiButton
              color="error"
              variant="contained"
              onClick={handleConfirmDelete}
            >
              Удалить
            </MuiButton>
          </DialogActions>
        </Dialog>
      </Box>

      {/* Модальное меню по ячейке квартиры */}
      <ConfigProvider locale={ruRU}>
        <Modal
          open={actionDialog.open}
          onCancel={() =>
            setActionDialog({ open: false, unit: null, action: "" })
          }
          footer={null}
          title={`Квартира ${actionDialog.unit?.name}`}
          width={600}
        >
          {!actionDialog.action && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <AntButton
                type="primary"
                onClick={() => {
                  const id = actionDialog.unit?.id;
                  const search = createSearchParams({
                    project_id: String(projectId),
                    unit_id: String(id ?? ''),
                    engineer_id: String(profileId ?? ''),
                    open_form: '1',
                  }).toString();
                  navigate(`/claims?${search}`);
                  setActionDialog({ open: false, unit: null, action: '' });
                }}
              >
                Добавить претензию
              </AntButton>
              <AntButton
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
              >
                Добавить судебное дело
              </AntButton>
              <AntButton
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
              </AntButton>
            </div>
          )}
        </Modal>
      </ConfigProvider>
    </>
  );
}
