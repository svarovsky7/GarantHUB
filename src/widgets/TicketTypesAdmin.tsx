// src/widgets/TicketTypesAdmin.js
import React from "react";
import {
  useTicketTypes,
  useAddTicketType,
  useUpdateTicketType,
  useDeleteTicketType,
} from "@/entities/ticketType";
import { DataGrid } from "@mui/x-data-grid";
import {
  Button,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import TicketTypeForm from "@/features/ticketType/TicketTypeForm"; // без ProjectForm!

interface TicketTypesAdminProps {
  pageSize?: number;
  rowsPerPageOptions?: number[];
}
export default function TicketTypesAdmin({
  pageSize = 25,
  rowsPerPageOptions = [10, 25, 50, 100],
}: TicketTypesAdminProps) {
  const { data = [], isLoading } = useTicketTypes();
  const addMutation = useAddTicketType();
  const updateMutation = useUpdateTicketType();
  const deleteMutation = useDeleteTicketType();

  const [open, setOpen] = React.useState(false);
  const [editRow, setEditRow] = React.useState(null);

  const handleAdd = () => {
    setEditRow(null);
    setOpen(true);
  };

  const handleEdit = (row) => {
    setEditRow(row);
    setOpen(true);
  };

  const handleDelete = (id) => {
    if (window.confirm("Удалить тип замечания?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleSubmit = async (values) => {
    if (editRow) {
      await updateMutation.mutateAsync({ id: editRow.id, name: values.name });
    } else {
      await addMutation.mutateAsync(values.name);
    }
    setOpen(false);
  };

  return (
    <Stack spacing={2} data-oid="4m3wufp">
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        data-oid="acz_td5"
      >
        <span style={{ fontWeight: 600, fontSize: 18 }} data-oid="fww9:hn">
          Типы замечаний
        </span>
        <Button onClick={handleAdd} variant="contained" data-oid="5ubbu4o">
          Добавить
        </Button>
      </Stack>
      <div style={{ width: "100%" }} data-oid="wh2g4on">
        <DataGrid
          rows={data}
          columns={[
            { field: "id", headerName: "ID", width: 80 },
            { field: "name", headerName: "Название типа", flex: 1 },
            {
              field: "actions",
              headerName: "",
              width: 100,
              sortable: false,
              renderCell: (params) => (
                <Stack direction="row" spacing={0} data-oid="boq0lf9">
                  <IconButton
                    size="small"
                    onClick={() => handleEdit(params.row)}
                    color="primary"
                    data-oid="hk6oyco"
                  >
                    <EditIcon fontSize="small" data-oid="pa9a98a" />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleDelete(params.row.id)}
                    data-oid="2yk8myg"
                  >
                    <DeleteIcon fontSize="small" data-oid="4:ec-tg" />
                  </IconButton>
                </Stack>
              ),
            },
          ]}
          autoHeight
          loading={isLoading}
          disableRowSelectionOnClick
          initialState={{ pagination: { paginationModel: { pageSize } } }}
          pageSizeOptions={rowsPerPageOptions}
          data-oid="kah7x7m"
        />
      </div>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="xs"
        fullWidth
        data-oid="_7wdw1_"
      >
        <DialogTitle data-oid="dogf.hd">
          {editRow ? "Редактировать тип" : "Добавить тип"}
        </DialogTitle>
        <DialogContent data-oid="4.cnmev">
          <TicketTypeForm
            initialData={editRow}
            onSubmit={(values) => handleSubmit(values)}
            onCancel={() => setOpen(false)}
            data-oid="6rb7da2"
          />
        </DialogContent>
      </Dialog>
    </Stack>
  );
}
