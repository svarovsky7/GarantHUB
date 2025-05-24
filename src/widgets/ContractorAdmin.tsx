// src/widgets/ContractorAdmin.tsx
import React, { useState, useEffect } from "react";
import { GridActionsCellItem } from "@mui/x-data-grid";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

import { useContractors, useDeleteContractor } from "@/entities/contractor";

import ContractorForm from "@/features/contractor/ContractorForm";
import AdminDataGrid from "@/shared/ui/AdminDataGrid";
import { useNotify } from "@/shared/hooks/useNotify";

// Интерфейс для пропсов (поддержка пагинации)
interface ContractorAdminProps {
  pageSize?: number;
  rowsPerPageOptions?: number[];
}

export default function ContractorAdmin({
  pageSize = 25,
  rowsPerPageOptions = [10, 25, 50, 100],
}: ContractorAdminProps) {
  const notify = useNotify();

  const { data: contractors = [], isPending, error } = useContractors();

  const remove = useDeleteContractor();

  const [modal, setModal] = useState<null | {
    mode: "add" | "edit";
    data?: any;
  }>(null);

  useEffect(() => {
    if (error) {
      // eslint-disable-next-line no-console
      console.error("[ContractorAdmin] load error:", error);
      notify.error(`Ошибка загрузки контрагентов: ${error.message}`);
    } else if (!isPending && contractors.length === 0) {
      notify.info("Записей не найдено");
    }
  }, [error, isPending, contractors, notify]);

  const columns = [
    { field: "id", headerName: "ID", width: 80 },
    { field: "name", headerName: "Название", flex: 1 },
    { field: "inn", headerName: "ИНН", width: 140 },
    {
      field: "phone",
      headerName: "Телефон",
      width: 160,
      renderCell: ({ value }) => value ?? "—",
    },
    {
      field: "email",
      headerName: "E-mail",
      flex: 1,
      renderCell: ({ value }) => value ?? "—",
    },
    {
      field: "actions",
      type: "actions",
      width: 110,
      getActions: ({ row }) => [
        <GridActionsCellItem
          key="edit"
          icon={<EditIcon data-oid="_4uuj75" />}
          label="Редактировать"
          onClick={() => setModal({ mode: "edit", data: row })}
          data-oid="xsg.nmo"
        />,

        <GridActionsCellItem
          key="del"
          icon={<DeleteIcon color="error" data-oid="2igrj6l" />}
          label="Удалить"
          onClick={() => {
            if (!window.confirm("Удалить контрагента?")) return;
            remove.mutate(row.id, {
              onSuccess: () => notify.success("Контрагент удалён"),
              onError: (e) => notify.error(e.message),
            });
          }}
          data-oid="681pexo"
        />,
      ],
    },
  ];

  const close = () => setModal(null);
  const ok = (msg: string) => {
    close();
    notify.success(msg);
  };

  return (
    <>
      {modal?.mode === "add" && (
        <ContractorForm
          onSuccess={() => ok("Компания создана")}
          onCancel={close}
          data-oid="g.y_kn5"
        />
      )}

      {modal?.mode === "edit" && (
        <ContractorForm
          initialData={modal.data}
          onSuccess={() => ok("Компания обновлена")}
          onCancel={close}
          data-oid="ei8-gqs"
        />
      )}

      <AdminDataGrid
        title="Контрагенты"
        rows={contractors}
        columns={columns}
        loading={isPending}
        onAdd={() => setModal({ mode: "add" })}
        pageSize={pageSize}
        rowsPerPageOptions={rowsPerPageOptions}
        data-oid="f-f2q33"
      />
    </>
  );
}
