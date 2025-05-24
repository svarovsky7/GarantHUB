import React from "react";
import { Box, Tooltip, IconButton } from "@mui/material";
import UnitCell from "@/entities/unit/UnitCell";
import EditOutlined from "@mui/icons-material/EditOutlined";
import DeleteOutline from "@mui/icons-material/DeleteOutline";
import AddIcon from "@mui/icons-material/Add";

const CELL_SIZE = 54;
const FLOOR_COLOR = "#1976d2";

export default function FloorCell({
  floor,
  units,
  ticketsByUnit, // Новый проп!
  onAddUnit,
  onEditFloor,
  onDeleteFloor,
  onEditUnit,
  onDeleteUnit,
  onUnitClick,
}) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        mb: 1,
      }}
      data-oid="3qk64g4"
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
        data-oid="mqutt-0"
      >
        <span data-oid="w:p0.bi">{floor}</span>
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
          data-oid=":f:m4-y"
        >
          <Tooltip title="Переименовать этаж" data-oid="6b0aqoa">
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
              data-oid="jfobjod"
            >
              <EditOutlined fontSize="small" data-oid="vxz3pfz" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Удалить этаж" data-oid="f.jdi33">
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
              data-oid="6hs5m8i"
            >
              <DeleteOutline fontSize="small" data-oid="r1aki2n" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      {units.map((unit) => (
        <UnitCell
          key={unit.id}
          unit={unit}
          tickets={ticketsByUnit ? ticketsByUnit[unit.id] : []} // <-- Вот тут!
          onEditUnit={() => onEditUnit?.(unit)}
          onDeleteUnit={() => onDeleteUnit?.(unit)}
          onAction={() => onUnitClick?.(unit)}
          data-oid="0c0357c"
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
        data-oid="hbg86t1"
      >
        <AddIcon
          fontSize="medium"
          sx={{ color: FLOOR_COLOR }}
          data-oid="d51n7hi"
        />
      </Box>
    </Box>
  );
}
