import React from "react";
import {
  DataGrid,
  GridActionsCellItem,
  GridColDef,
  GridActionsColDef,
} from "@mui/x-data-grid";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { useDeleteLetter } from "@/entities/letter";

export default function LettersTable({ rows, onEdit }) {
  const remove = useDeleteLetter();

  const columns: GridColDef[] = [
    { field: "id", headerName: "ID", width: 80 },
    { field: "number", headerName: "Номер", flex: 1 },
    { field: "letter_date", headerName: "Дата", width: 120 },
    { field: "letter_type", headerName: "Тип", width: 140 },
    { field: "subject", headerName: "Тема", flex: 1 },
    {
      field: "actions",
      type: "actions",
      width: 80,
      getActions: ({ row }) => [
        <GridActionsCellItem
          key="edit"
          icon={<EditIcon data-oid="f6eg6ke" />}
          label="Edit"
          onClick={() => onEdit(row)}
          data-oid="8o2:n_y"
        />,

        <GridActionsCellItem
          key="del"
          icon={<DeleteIcon color="error" data-oid="jjvl85i" />}
          label="Delete"
          onClick={() => {
            if (window.confirm("Удалить письмо?")) {
              remove.mutate({ id: row.id, case_id: row.case_id });
            }
          }}
          data-oid="i0id_11"
        />,
      ],
    } as GridActionsColDef,
  ];

  return (
    <DataGrid
      autoHeight
      rows={rows}
      columns={columns}
      getRowId={(r) => r.id}
      density="compact"
      hideFooterSelectedRowCount
      disableRowSelectionOnClick
      data-oid="xs6ts1p"
    />
  );
}
