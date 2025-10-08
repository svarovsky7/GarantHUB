import React from "react";
import { Box, Tooltip, IconButton } from "@mui/material";
import UnitCell from "@/entities/unit/UnitCell";
import EditOutlined from "@mui/icons-material/EditOutlined";
import DeleteOutline from "@mui/icons-material/DeleteOutline";
import SwapVertIcon from "@mui/icons-material/SwapVert";
import AddIcon from "@mui/icons-material/Add";

const CELL_SIZE = 54;
const FLOOR_COLOR = "#1976d2";
const UNITS_PER_ROW = 20; // Максимум объектов в одной строке

/**
 * Отображает один этаж в шахматке.
 * Если объектов больше 20, они разбиваются на несколько строк.
 */
export default function FloorCell({
  floor,
  units,
  casesByUnit,
  lettersByUnit,
  claimsByUnit,
  onAddUnit,
  onEditFloor,
  onDeleteFloor,
  onEditUnit,
  onDeleteUnit,
  onUnitClick,
  onSortUnits,
  sortDirection,
}) {
  // Разбиваем квартиры на строки по UNITS_PER_ROW штук
  const unitRows = [];
  for (let i = 0; i < units.length; i += UNITS_PER_ROW) {
    unitRows.push(units.slice(i, i + UNITS_PER_ROW));
  }
  
  // Если квартир нет, создаем одну пустую строку для кнопки добавления
  if (unitRows.length === 0) {
    unitRows.push([]);
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "row",
        alignItems: "flex-start",
        mb: 2,
        position: "relative",
      }}
      data-oid="0y4bqhw"
    >
      {/* Ячейка этажа отображается один раз для всех строк */}
      <Box
        sx={{
          width: 80,
          minWidth: 80,
          minHeight: CELL_SIZE,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderRight: "2.5px solid #1976d2",
          borderRadius: "12px 0 0 12px",
          background: "#fff",
          fontWeight: 600,
          fontSize: 20,
          position: "sticky",
          left: 0,
          color: FLOOR_COLOR,
          px: 2,
          py: 1,
          boxShadow: "0 1px 6px 0 #E3ECFB",
          mr: 1,
        }}
        data-oid="b2o0a0s"
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <span data-oid="79w3yn4">{floor}</span>
          <Tooltip title="Сортировать номера" data-oid="sortfloor">
            <IconButton
              size="small"
              sx={{
                color: sortDirection ? FLOOR_COLOR : "#b0b6be",
                background: "#F8FAFF",
                "&:hover": { color: FLOOR_COLOR, background: "#e3ecfb" },
                p: 0.5,
              }}
              onClick={() => onSortUnits?.(floor)}
            >
              <SwapVertIcon
                fontSize="small"
                sx={{ transform: sortDirection === 'desc' ? 'rotate(180deg)' : 'none' }}
              />
            </IconButton>
          </Tooltip>
        </Box>
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <Tooltip title="Переименовать этаж" data-oid="w.a3.uu">
            <IconButton
              size="small"
              sx={{
                color: "#b0b6be",
                background: "#F8FAFF",
                mb: 0.2,
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
                background: "#F8FAFF",
                mt: 0.2,
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
      
      {/* Контейнер для всех строк квартир */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 1,
          flex: 1,
        }}
      >
        {unitRows.map((rowUnits, rowIndex) => (
          <Box
            key={rowIndex}
            sx={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 1,
            }}
          >
            {/* Отображаем квартиры текущей строки */}
            {rowUnits.map((unit) => (
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
          
          {/* Кнопка добавления показывается только на последней строке */}
          {rowIndex === unitRows.length - 1 && (
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
          )}
          
          {/* Добавляем индикатор продолжения строки, если это не последняя строка */}
          {rowIndex < unitRows.length - 1 && rowUnits.length === UNITS_PER_ROW && (
            <Box
              sx={{
                ml: 1,
                px: 1,
                py: 0.5,
                bgcolor: "#f5f5f5",
                borderRadius: "8px",
                fontSize: 12,
                color: "#666",
                fontWeight: 500,
              }}
            >
              ↓ продолжение
            </Box>
          )}
        </Box>
      ))}
      </Box>
    </Box>
  );
}
