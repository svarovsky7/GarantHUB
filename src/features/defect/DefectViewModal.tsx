import React from "react";
import dayjs from "dayjs";
import { Modal, Typography, Skeleton } from "antd";
import { useDefect, signedUrl } from "@/entities/defect";
import { useBrigades } from "@/entities/brigade";
import { useContractors } from "@/entities/contractor";

interface Props {
  open: boolean;
  defectId: number | null;
  onClose: () => void;
}

/** Модальное окно просмотра дефекта */
export default function DefectViewModal({ open, defectId, onClose }: Props) {
  const { data: defect, isLoading } = useDefect(defectId ?? undefined);
  const { data: brigades = [] } = useBrigades();
  const { data: contractors = [] } = useContractors();
  const fixByName = React.useMemo(() => {
    if (!defect) return "—";
    if (defect.brigade_id)
      return (
        brigades.find((b) => b.id === defect.brigade_id)?.name ?? "Бригада"
      );
    if (defect.contractor_id)
      return (
        contractors.find((c) => c.id === defect.contractor_id)?.name ||
        "Подрядчик"
      );
    return "—";
  }, [defect, brigades, contractors]);
  if (!defectId) return null;
  const title = defect
    ? `Дефект с ID №${defect.id} от ${dayjs(
        defect.received_at ?? defect.created_at,
      ).format("DD.MM.YYYY")}`
    : "Дефект";
  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width="60%"
      title={
        <Typography.Title level={4} style={{ margin: 0 }}>
          {title}
        </Typography.Title>
      }
    >
      {isLoading || !defect ? (
        <Skeleton active />
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          <Typography.Text>
            <b>Описание:</b> {defect.description}
          </Typography.Text>
          <Typography.Text>
            <b>Тип дефекта:</b> {defect.defect_type?.name ?? "—"}
          </Typography.Text>
          <Typography.Text>
            <b>Статус:</b> {defect.defect_status?.name ?? "—"}
          </Typography.Text>
          <Typography.Text>
            <b>Кем устраняется:</b> {fixByName}
          </Typography.Text>
          <Typography.Text>
            <b>Дата получения:</b>{" "}
            {defect.received_at
              ? dayjs(defect.received_at).format("DD.MM.YYYY")
              : "—"}
          </Typography.Text>
          <Typography.Text>
            <b>Дата создания:</b>{" "}
            {defect.created_at
              ? dayjs(defect.created_at).format("DD.MM.YYYY")
              : "—"}
          </Typography.Text>
          {defect.attachments?.length ? (
            <div>
              <b>Файлы:</b>
              <ul style={{ paddingLeft: 20 }}>
                {defect.attachments.map((f: any) => (
                  <li key={f.id}>
                    <a
                      onClick={async (e) => {
                        e.preventDefault();
                        const url = await signedUrl(
                          f.storage_path,
                          f.original_name ?? "file",
                        );
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = f.original_name ?? "file";
                        document.body.appendChild(a);
                        a.click();
                        a.remove();
                      }}
                      href="#"
                    >
                      {f.original_name ?? f.storage_path.split("/").pop()}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      )}
    </Modal>
  );
}
