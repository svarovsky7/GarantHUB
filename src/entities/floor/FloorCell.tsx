import React from "react";
import { Box, Tooltip, IconButton } from "@mui/material";
import UnitCell from "@/entities/unit/UnitCell";
import EditOutlined from "@mui/icons-material/EditOutlined";
import DeleteOutline from "@mui/icons-material/DeleteOutline";
import AddIcon from "@mui/icons-material/Add";
import SortIcon from "@mui/icons-material/Sort";
import { parseUnitNumber } from "@/shared/utils/parseUnitNumber";
import type { SortOrder } from "@/shared/types/sortOrder";

const CELL_SIZE = 54;
const FLOOR_COLOR = "#1976d2";

/**
 * Отображает один этаж в шахматке.
 */
export default function FloorCell({
  floor,
  units,
  sortOrder = 'asc',
  onToggleSort,
  casesByUnit,
  lettersByUnit,
  claimsByUnit,
  onAddUnit,
  onEditFloor,
  onDeleteFloor,
  onEditUnit,
  onDeleteUnit,
  onUnitClick,
}) {
  const sortedUnits = [...units].sort((a, b) => {
    const numA = parseUnitNumber(a.name);
    const numB = parseUnitNumber(b.name);
    if (!Number.isNaN(numA) && !Number.isNaN(numB) && numA !== numB) {
      return sortOrder === 'asc' ? numA - numB : numB - numA;
    }
    if (!Number.isNaN(numA) && Number.isNaN(numB)) {
      return sortOrder === 'asc' ? -1 : 1;
    }
    if (Number.isNaN(numA) && !Number.isNaN(numB)) {
      return sortOrder === 'asc' ? 1 : -1;
    }
    return sortOrder === 'asc'
      ? String(a.name).localeCompare(String(b.name))
      : String(b.name).localeCompare(String(a.name));
  });
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        mb: 1,
      }}
      data-oid="0y4bqhw"
    >
      <Box
        sx={{
          width: 80,
          minWidth: 80,
          height: CELL_SIZE,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderRight: "2.5px solid #1976d2",
          borderRadius: "12px 0 0 12px",
          background: "#fff",
          fontWeight: 600,
          fontSize: 20,
          position: "relative",
          color: FLOOR_COLOR,
          px: 2,
          boxShadow: "0 1px 6px 0 #E3ECFB",
          mr: 1,
        }}
        data-oid="b2o0a0s"
      >
        <span data-oid="79w3yn4">{floor}</span>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            position: "absolute",
            right: 8,
            top: 6,
            zIndex: 2,
          }}
          data-oid="ry3jcl1"
        >
          <Tooltip
            title={
              sortOrder === "asc"
                ? "Сортировать по убыванию"
                : "Сортировать по возрастанию"
            }
          >
            <IconButton
              size="small"
              sx={{
                color: "#b0b6be",
                opacity: 0.8,
                mb: 0.2,
                background: "#F8FAFF",
                "&:hover": { color: FLOOR_COLOR, background: "#e3ecfb" },
              }}
              onClick={() => onToggleSort?.(floor)}
            >
              <SortIcon
                fontSize="small"
                sx={{ transform: sortOrder === "asc" ? "rotate(180deg)" : "none" }}
              />
            </IconButton>
          </Tooltip>
          <Tooltip title="Переименовать этаж" data-oid="w.a3.uu">
            <IconButton
              size="small"
              sx={{
                color: "#b0b6be",
                opacity: 0.8,
                mb: 0.2,
                background: "#F8FAFF",
                "&:hover": { color: FLOOR_COLOR, background: "#e3ecfb" },
              }}
              onClick={() => onEditFloor?.(floor)}
              data-oid="71wt38n"
            >
              <EditOutlined fontSize="small" data-oid="8_:7xt7" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Удалить этаж" data-oid="o_1zkbh">
            <IconButton
              size="small"
              sx={{
                color: "#b0b6be",
                opacity: 0.8,
                mt: 0.2,
                background: "#F8FAFF",
                "&:hover": { color: "#e53935", background: "#fdeaea" },
              }}
              onClick={() => onDeleteFloor?.(floor)}
              data-oid="ha0rwke"
            >
              <DeleteOutline fontSize="small" data-oid="b.aximf" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      {sortedUnits.map((unit) => (
        <UnitCell
          key={unit.id}
          unit={unit}
          cases={casesByUnit ? casesByUnit[unit.id] : []}
          hasLetter={Boolean(lettersByUnit ? lettersByUnit[unit.id] : false)}
          claimInfo={claimsByUnit ? claimsByUnit[unit.id] : null}
          onEditUnit={() => onEditUnit?.(unit)}
          onDeleteUnit={() => onDeleteUnit?.(unit)}
          onAction={() => onUnitClick?.(unit)}
          data-oid="acj2jio"
        />
      ))}
      <Box
        sx={{
          width: CELL_SIZE,
          height: CELL_SIZE,
          ml: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "1.5px dashed #1976d2",
          borderRadius: "12px",
          bgcolor: "#F3F7FF",
          cursor: "pointer",
          transition: "background 0.2s",
          "&:hover": { bgcolor: "#e3ecfb" },
        }}
        onClick={onAddUnit}
        data-oid="kxqr4ho"
      >
        <AddIcon
          fontSize="medium"
          sx={{ color: FLOOR_COLOR }}
          data-oid="62-0u9e"
        />
      </Box>
    </Box>
  );
}
