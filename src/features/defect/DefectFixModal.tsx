import React, { useState, useEffect } from "react";
import dayjs from "dayjs";
import { Modal, Form, DatePicker, Button, Select } from "antd";
import FileDropZone from "@/shared/ui/FileDropZone";
import AttachmentEditorTable from "@/shared/ui/AttachmentEditorTable";
import { useBrigades } from "@/entities/brigade";
import { useContractors } from "@/entities/contractor";
import { useFixDefect, useDefect, signedUrl } from "@/entities/defect";
import { useLockedUnitIds } from "@/entities/unit";
import { useUsers } from "@/entities/user";
import { useNotify } from "@/shared/hooks/useNotify";
import type {
  NewDefectFile,
  RemoteDefectFile,
} from "@/shared/types/defectFile";
import FixBySelector, { FixByValue } from "@/shared/ui/FixBySelector";

interface Props {
  defectId: number | null;
  open: boolean;
  onClose: () => void;
}

/** Модальное окно внесения данных об устранении дефекта */
export default function DefectFixModal({ defectId, open, onClose }: Props) {
  const { data: brigades = [] } = useBrigades();
  const { data: contractors = [] } = useContractors();
  const { data: users = [] } = useUsers();
  const { data: defect } = useDefect(defectId ?? undefined);
  const { data: lockedUnitIds = [] } = useLockedUnitIds();
  const fix = useFixDefect();
  const notify = useNotify();

  const [fixBy, setFixBy] = useState<FixByValue>({
    brigade_id: null,
    contractor_id: null,
  });
  const [fixedAt, setFixedAt] = useState<dayjs.Dayjs | null>(null);
  const [files, setFiles] = useState<NewDefectFile[]>([]);
  const [remoteFiles, setRemoteFiles] = useState<RemoteDefectFile[]>([]);
  const [removedIds, setRemovedIds] = useState<string[]>([]);
  const [engineer, setEngineer] = useState<string | null>(null);

  useEffect(() => {
    if (defect && open) {
      setFixBy({
        brigade_id: defect.brigade_id,
        contractor_id: defect.contractor_id,
      });
      setEngineer(defect.engineer_id ?? null);
      const baseDate = defect.fixed_at ? dayjs(defect.fixed_at) : dayjs();
      setFixedAt(baseDate.isBefore(dayjs(), "day") ? dayjs() : baseDate);
      const atts =
        defect.attachments?.map((f: any) => ({
          id: String(f.id),
          name: f.original_name ?? f.storage_path.split("/").pop(),
          path: f.storage_path,
          url: f.file_url,
          mime_type: f.file_type,
        })) ?? [];
      setRemoteFiles(atts);
      setRemovedIds([]);
    }
  }, [defect, open]);

  const handleFiles = (f: File[]) => {
    setFiles((p) => [...p, ...f.map((file) => ({ file }))]);
  };

  const changeType = (_idx: number, _type: number | null) => {};
  const changeRemoteType = (_id: string, _type: number | null) => {};

  const removeFile = (idx: number) => {
    setFiles((p) => p.filter((_, i) => i !== idx));
  };

  const removeRemote = (id: string) => {
    setRemoteFiles((p) => p.filter((f) => f.id !== id));
    setRemovedIds((p) => [...p, id]);
  };

  /**
   * Подтверждение устранения дефекта.
   * Проверяет заполненность обязательных полей и наличие хотя бы одного файла.
   */
  const handleOk = async () => {
    if (!defectId) return;
    if (
      defect &&
      defect.unit_id != null &&
      lockedUnitIds.includes(defect.unit_id)
    ) {
      Modal.warning({
        title: "Объект заблокирован",
        content: "Работы по устранению замечаний запрещено выполнять.",
      });
      return;
    }
    if (!fixBy.brigade_id && !fixBy.contractor_id) {
      notify.error("Укажите исполнителя");
      return;
    }
    if (!fixedAt) {
      notify.error("Укажите дату устранения");
      return;
    }
    if (remoteFiles.length + files.length === 0) {
      notify.error("Загрузите хотя бы один файл");
      return;
    }

    const updated: any[] = [];
    await fix.mutateAsync({
      id: defectId,
      brigade_id: fixBy.brigade_id,
      contractor_id: fixBy.contractor_id,
      fixed_at: fixedAt ? fixedAt.format("YYYY-MM-DD") : null,
      engineer_id: engineer,
      attachments: files.map((f) => ({ file: f.file, type_id: null })),
      removedAttachmentIds: removedIds.map(Number),
      updatedAttachments: updated,
    });
    setFiles([]);
    setFixBy({ brigade_id: null, contractor_id: null });
    setFixedAt(null);
    setEngineer(null);
    onClose();
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      width={700}
      footer={
        <Button
          type="primary"
          size="large"
          onClick={handleOk}
          loading={fix.isPending}
          block
        >
          Подтвердить, что дефект устранен
        </Button>
      }
      title={
        defect
          ? `Устранение дефекта с ID №${defect.id} от ${
              defect.received_at
                ? dayjs(defect.received_at).format("DD.MM.YYYY")
                : dayjs(defect.created_at).format("DD.MM.YYYY")
            }`
          : "Устранение дефекта"
      }
    >
      <Form layout="vertical">
        <Form.Item label="Исполнитель">
          <FixBySelector
            value={fixBy}
            onChange={setFixBy}
            brigades={brigades}
            contractors={contractors}
          />
        </Form.Item>
        <Form.Item label="Инженер, устранивший замечание">
          <Select
            allowClear
            options={users.map((u) => ({ value: u.id, label: u.name }))}
            value={engineer ?? undefined}
            onChange={(v) => setEngineer(v ?? null)}
          />
        </Form.Item>
        <Form.Item label="Дата устранения">
          <DatePicker
            format="DD.MM.YYYY"
            value={fixedAt ?? undefined}
            onChange={(d) => setFixedAt(d)}
            style={{ width: "100%" }}
          />
        </Form.Item>
        <Form.Item label="Файлы">
          <FileDropZone onFiles={handleFiles} />
          <AttachmentEditorTable
            remoteFiles={remoteFiles.map((f) => ({
              id: String(f.id),
              name: f.name,
              path: f.path,
              mime: f.mime_type,
              description: f.description,
            }))}
            newFiles={files.map((f) => ({
              file: f.file,
              mime: f.file.type,
              description: f.description,
            }))}
            onRemoveRemote={removeRemote}
            onRemoveNew={removeFile}
            onDescNew={(idx, d) =>
              setFiles(
                files.map((ff, i) =>
                  i === idx ? { ...ff, description: d } : ff,
                ),
              )
            }
            showDetails
            getSignedUrl={(p, n) => signedUrl(p, n)}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
