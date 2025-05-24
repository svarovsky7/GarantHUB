// src/widgets/TicketStatusesAdmin.js
import React from "react";
import {
  useTicketStatuses,
  useAddTicketStatus,
  useUpdateTicketStatus,
  useDeleteTicketStatus,
} from "@/entities/ticketStatus";
import { DataGrid } from "@mui/x-data-grid";
import {
  Button,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Box,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import TicketStatusForm from "@/features/ticketStatus/TicketStatusForm";

interface TicketStatusesAdminProps {
  pageSize?: number;
  rowsPerPageOptions?: number[];
}
export default function TicketStatusesAdmin({
  pageSize = 25,
  rowsPerPageOptions = [10, 25, 50, 100],
}: TicketStatusesAdminProps) {
  const { data = [], isLoading } = useTicketStatuses();
  const addMutation = useAddTicketStatus();
  const updateMutation = useUpdateTicketStatus();
  const deleteMutation = useDeleteTicketStatus();

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
    if (window.confirm("Удалить статус?")) deleteMutation.mutate(id);
  };
  const handleSubmit = async (values) => {
    if (editRow) {
      await updateMutation.mutateAsync({ id: editRow.id, updates: values });
    } else {
      await addMutation.mutateAsync(values);
    }
    setOpen(false);
  };

  return (
    <Stack spacing={2} data-oid="77sb1ax">
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        data-oid="d7kf8d2"
      >
        <span style={{ fontWeight: 600, fontSize: 18 }} data-oid="dpoy7zl">
          Статусы замечаний
        </span>
        <Button onClick={handleAdd} variant="contained" data-oid="7qy.s0_">
          Добавить
        </Button>
      </Stack>
      <div style={{ width: "100%" }} data-oid="mj3g6fj">
        <DataGrid
          rows={data}
          columns={[
            { field: "id", headerName: "ID", width: 80 },
            { field: "name", headerName: "Название статуса", flex: 1 },
            { field: "description", headerName: "Описание", flex: 1 },
            {
              field: "color",
              headerName: "Цвет",
              width: 90,
              renderCell: (params) => (
                <Box
                  sx={{
                    width: 32,
                    height: 24,
                    bgcolor: params.value,
                    border: "1px solid #bbb",
                    borderRadius: 0.5,
                  }}
                  data-oid="_1i7m_x"
                />
              ),
            },
            {
              field: "actions",
              headerName: "",
              width: 100,
              sortable: false,
              renderCell: (params) => (
                <Stack direction="row" spacing={0} data-oid="ki-46_w">
                  <IconButton
                    size="small"
                    onClick={() => handleEdit(params.row)}
                    color="primary"
                    data-oid="qxrzgm_"
                  >
                    <EditIcon fontSize="small" data-oid="kr5f_1v" />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleDelete(params.row.id)}
                    data-oid="0.x-750"
                  >
                    <DeleteIcon fontSize="small" data-oid="724npt:" />
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
          data-oid="v0my.z9"
        />
      </div>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="sm"
        fullWidth
        data-oid="hq6xfba"
      >
        <DialogTitle data-oid="00r16d:">
          {editRow ? "Редактировать статус" : "Добавить статус"}
        </DialogTitle>
        <DialogContent data-oid="35vy3qw">
          <TicketStatusForm
            initialData={editRow}
            onSubmit={handleSubmit}
            onCancel={() => setOpen(false)}
            data-oid="qz8j0km"
          />
        </DialogContent>
      </Dialog>
    </Stack>
  );
}
