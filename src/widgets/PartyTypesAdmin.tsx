import React from "react";
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
import {
  usePartyTypes,
  useAddPartyType,
  useUpdatePartyType,
  useDeletePartyType,
} from "@/entities/partyType";
import PartyTypeForm from "@/features/partyType/PartyTypeForm";

interface PartyTypesAdminProps {
  pageSize?: number;
  rowsPerPageOptions?: number[];
}
export default function PartyTypesAdmin({
  pageSize = 25,
  rowsPerPageOptions = [10, 25, 50, 100],
}: PartyTypesAdminProps) {
  const { data = [], isLoading } = usePartyTypes();
  const add = useAddPartyType();
  const update = useUpdatePartyType();
  const remove = useDeletePartyType();
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
    if (window.confirm("Удалить тип?")) remove.mutate(id);
  };
  const handleSubmit = async (values) => {
    if (editRow) {
      await update.mutateAsync({ id: editRow.id, name: values.name });
    } else {
      await add.mutateAsync(values.name);
    }
    setOpen(false);
  };

  return (
    <Stack spacing={2} data-oid="uuyu4-p">
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        data-oid="0gkv1pk"
      >
        <span style={{ fontWeight: 600, fontSize: 18 }} data-oid="usei69v">
          Типы участников
        </span>
        <Button onClick={handleAdd} variant="contained" data-oid="0i:dved">
          Добавить
        </Button>
      </Stack>
      <div style={{ width: "100%" }} data-oid="blq8sqf">
        <DataGrid
          rows={data}
          columns={[
            { field: "id", headerName: "ID", width: 80 },
            { field: "name", headerName: "Название", flex: 1 },
            {
              field: "actions",
              headerName: "",
              width: 100,
              sortable: false,
              renderCell: (params) => (
                <Stack direction="row" spacing={0} data-oid="j:y2scm">
                  <IconButton
                    size="small"
                    onClick={() => handleEdit(params.row)}
                    color="primary"
                    data-oid="54o33r9"
                  >
                    <EditIcon fontSize="small" data-oid="iwicj89" />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleDelete(params.row.id)}
                    data-oid="ehk12na"
                  >
                    <DeleteIcon fontSize="small" data-oid="e1_rgzk" />
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
          data-oid="q6km142"
        />
      </div>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="xs"
        fullWidth
        data-oid="c1zhbor"
      >
        <DialogTitle data-oid="wjg4f4n">
          {editRow ? "Редактировать тип" : "Добавить тип"}
        </DialogTitle>
        <DialogContent data-oid="9uypqtk">
          <PartyTypeForm
            initialData={editRow}
            onSubmit={handleSubmit}
            onCancel={() => setOpen(false)}
            data-oid="gbel30n"
          />
        </DialogContent>
      </Dialog>
    </Stack>
  );
}
