import React from "react";
import { Paper, Box, Tooltip, IconButton, Typography } from "@mui/material";
import MailIcon from "@mui/icons-material/Mail";
import type { UnitClaimInfo } from "@/shared/types/unitClaimInfo";
import EditOutlined from "@mui/icons-material/EditOutlined";
import DeleteOutline from "@mui/icons-material/DeleteOutline";

const CELL_SIZE = 54;

// Функция для hex → rgba
function getSemiTransparent(color, alpha = 0.3) {
  if (!color) return undefined;
  if (color.startsWith("#") && color.length === 7) {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }
  return color;
}

/**
 * Ячейка объекта на шахматке.
 * Подсвечивает наличие писем, претензий и судебных дел.
 * Используется в шахматке на странице структуры проекта.
 */
interface Props {
  unit: any;
  cases?: any[];
  hasLetter?: boolean;
  claimInfo?: UnitClaimInfo | null;
  onEditUnit?: (unit: any) => void;
  onDeleteUnit?: (unit: any) => void;
  onAction?: (unit: any) => void;
}

export default function UnitCell({
  unit,
  cases = [],
  hasLetter = false,
  claimInfo = null,
  onEditUnit,
  onDeleteUnit,
  onAction,
}: Props) {
  const bgColor = "#fff";
  const hasCases = Array.isArray(cases) && cases.length > 0;
  const hasOfficial = claimInfo?.official ?? false;
  const claimColor = claimInfo?.color ?? null;

  return (
    <Paper
      sx={{
        width: CELL_SIZE,
        height: CELL_SIZE,
        margin: 0.5,
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        justifyContent: "flex-start",
        border: `${hasCases ? 2 : 1.5}px solid ${
          hasCases || hasOfficial ? "#e53935" : "#dde2ee"
        }`,
        background: bgColor,
        borderRadius: "12px",
        boxShadow: hasCases ? "0 0 0 2px rgba(229,57,53,0.25)" : "0 1px 6px 0 #E3ECFB",
        px: 0,
        py: 0,
        overflow: "hidden",
        cursor: "pointer",
        transition: "box-shadow .15s, border-color .15s, background .15s",
        "&:hover": {
          boxShadow: hasCases
            ? "0 0 0 2px rgba(211,47,47,0.4)"
            : "0 4px 16px 0 #b5d2fa",
          borderColor: hasCases || hasOfficial ? "#d32f2f" : "#1976d2",
          background: "#f6faff",
        },
        position: "relative",
      }}
      elevation={0}
      onClick={(e) => {
        const target = e.target as HTMLElement;
        if (
          target.closest(".unit-action-icon") ||
          target.closest(".MuiTooltip-popper")
        )
          return;
        onAction?.(unit);
      }}
      data-oid="21x1tb3"
    >
      {claimColor && (
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 6,
            bgcolor: claimColor,
            borderTopLeftRadius: "12px",
            borderTopRightRadius: "12px",
          }}
        />
      )}
      {hasLetter && (
        <MailIcon
          fontSize="small"
          sx={{ position: "absolute", top: 2, right: 2, color: "#f0b400" }}
        />
      )}
      <Box
        sx={{
          flexGrow: 1,
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        data-oid="v.oy_pi"
      >
        <Typography
          sx={{
            fontWeight: 700,
            fontSize: 18,
            color: "#202746",
            textAlign: "center",
            width: "100%",
            wordBreak: "break-all",
            lineHeight: 1.05,
            userSelect: "none",
          }}
          title={unit.name}
          data-oid="jm.:qjs"
        >
          {unit.name}
        </Typography>
      </Box>
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          minHeight: 21,
          borderTop: "1px solid #f0f0f8",
          background: "#f9fafd",
        }}
        data-oid="f1-.akk"
      >
        <Tooltip title="Переименовать" data-oid="a9kbysn">
          <IconButton
            size="small"
            className="unit-action-icon"
            sx={{
              color: "#b0b6be",
              p: "2px",
              "&:hover": { color: "#1976d2", background: "transparent" },
            }}
            onClick={(e) => {
              e.stopPropagation();
              onEditUnit?.(unit);
            }}
            data-oid="d9h-8:5"
          >
            <EditOutlined fontSize="small" data-oid="jkghpj6" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Удалить" data-oid="jtua5h7">
          <IconButton
            size="small"
            className="unit-action-icon"
            sx={{
              color: "#b0b6be",
              p: "2px",
              "&:hover": { color: "#e53935", background: "transparent" },
            }}
            onClick={(e) => {
              e.stopPropagation();
              onDeleteUnit?.(unit);
            }}
            data-oid="2-y:84k"
          >
            <DeleteOutline fontSize="small" data-oid="f8dxba0" />
          </IconButton>
        </Tooltip>
      </Box>
    </Paper>
  );
}
