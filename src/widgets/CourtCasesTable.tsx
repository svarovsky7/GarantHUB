import React, { useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  Skeleton,
  Tooltip,
  Stack,
} from "@mui/material";
import { Delete, Visibility } from "@mui/icons-material";

// Статус Chip
const getStatusChip = (status) => {
  switch (status) {
    case "active":
      return (
        <Chip
          label="В процессе"
          color="warning"
          size="small"
          data-oid="1yvt2gc"
        />
      );

    case "won":
      return (
        <Chip
          label="Выиграно"
          color="success"
          size="small"
          data-oid="e8234ce"
        />
      );

    case "lost":
      return (
        <Chip label="Проиграно" color="error" size="small" data-oid="yv::ube" />
      );

    case "closed":
      return (
        <Chip
          label="Закрыто"
          color="secondary"
          size="small"
          data-oid="pbpbyo7"
        />
      );

    default:
      return <Chip label={status || "—"} size="small" data-oid="riz5del" />;
  }
};
const formatDate = (dateStr) =>
  dateStr ? new Date(dateStr).toLocaleDateString("ru-RU") : "";
const formatSum = (val) =>
  val ? `${Number(val).toLocaleString("ru-RU")} ₽` : "-";

// Фильтрация/сортировка через dataSource, если нужно
export default function CourtCasesTable({ rows, loading, onView, onDelete }) {
  if (loading)
    return (
      <Skeleton
        variant="rectangular"
        height={350}
        sx={{ my: 3 }}
        data-oid="xgnt605"
      />
    );

  return (
    <TableContainer data-oid="cfw--0g">
      <Table size="medium" data-oid="f8bl4bm">
        <TableHead data-oid="u4cka-n">
          <TableRow data-oid="3.pcy_g">
            <TableCell data-oid="0eeldn-">№ дела</TableCell>
            <TableCell data-oid="pus0tmp">Дата</TableCell>
            <TableCell data-oid="024zkqp">Объект</TableCell>
            <TableCell data-oid="oq.7y6g">Истец</TableCell>
            <TableCell data-oid="v-.wbaz">Ответчик</TableCell>
            <TableCell data-oid="hl2s8br">Юрист</TableCell>
            <TableCell data-oid="r42qkns">Статус</TableCell>
            <TableCell data-oid="a1r9q3r">Сумма иска</TableCell>
            <TableCell align="right" data-oid="zs-91ny">
              Действия
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody data-oid="bukjgt6">
          {rows.length === 0 ? (
            <TableRow data-oid="qx0zl_n">
              <TableCell
                colSpan={9}
                align="center"
                sx={{ color: "#888" }}
                data-oid=".q480e2"
              >
                Нет данных для отображения
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow key={row.id} hover data-oid="drgk9w_">
                <TableCell data-oid="bd5l6pk">
                  {row.internal_no || row.number}
                </TableCell>
                <TableCell data-oid="l:ngatl">{formatDate(row.date)}</TableCell>
                <TableCell data-oid="emjmhol">
                  {row.unit_name || row.projectObject}
                </TableCell>
                <TableCell data-oid="ufnso8b">{row.plaintiff}</TableCell>
                <TableCell data-oid="18c_-nl">{row.defendant}</TableCell>
                <TableCell data-oid="wiqyz:h">
                  {row.lawyer_name || row.responsibleLawyer}
                </TableCell>
                <TableCell data-oid="uues21x">
                  {getStatusChip(row.status)}
                </TableCell>
                <TableCell data-oid="4qf1wbt">
                  {formatSum(row.claimAmount)}
                </TableCell>
                <TableCell align="right" data-oid="t:ycwdo">
                  <Stack
                    direction="row"
                    spacing={1}
                    justifyContent="flex-end"
                    data-oid=".vxq6g7"
                  >
                    <Tooltip title="Просмотр" data-oid="lpw9yg7">
                      <Button
                        onClick={() => onView(row)}
                        size="small"
                        variant="contained"
                        color="primary"
                        sx={{ minWidth: 36, borderRadius: 6 }}
                        data-oid="h:rb4nx"
                      >
                        <Visibility data-oid="9m5cqce" />
                      </Button>
                    </Tooltip>
                    <Tooltip title="Удалить" data-oid="k8pufdi">
                      <Button
                        onClick={() => onDelete(row.id)}
                        size="small"
                        variant="contained"
                        color="error"
                        sx={{ minWidth: 36, borderRadius: 6 }}
                        data-oid="04payak"
                      >
                        <Delete data-oid="7duu1e6" />
                      </Button>
                    </Tooltip>
                  </Stack>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
