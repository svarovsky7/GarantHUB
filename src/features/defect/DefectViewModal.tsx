import React, { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { Modal, Typography, Skeleton, Tooltip, Button } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import {
  useDefect,
  signedUrl,
  useAddDefectAttachments,
  useRemoveDefectAttachment,
} from '@/entities/defect';
import { useBrigades } from '@/entities/brigade';
import { useContractors } from '@/entities/contractor';
import DefectAttachmentsBlock from './DefectAttachmentsBlock';
import { createDefectDocx } from '@/shared/utils/createDefectDocx';
import type { RemoteDefectFile } from '@/shared/types/defectFile';

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
  const addAtt = useAddDefectAttachments();
  const removeAtt = useRemoveDefectAttachment();

  const [files, setFiles] = useState<RemoteDefectFile[]>([]);

  useEffect(() => {
    if (defect) {
      setFiles(
        (defect.attachments ?? []).map((f: any) => ({
          id: String(f.id),
          name: f.original_name ?? f.storage_path.split('/').pop(),
          path: f.storage_path,
          mime_type: f.file_type,
          original_name: f.original_name,
          url: f.file_url,
        })) as RemoteDefectFile[],
      );
    }
  }, [defect]);

  const fixByName = useMemo(() => {
    if (!defect) return '—';
    if (defect.brigade_id) {
      return brigades.find((b) => b.id === defect.brigade_id)?.name ?? 'Бригада';
    }
    if (defect.contractor_id) {
      return contractors.find((c) => c.id === defect.contractor_id)?.name ?? 'Подрядчик';
    }
    return '—';
  }, [defect, brigades, contractors]);

  if (!defectId) return null;

  const title = defect
    ? `Дефект с ID №${defect.id} от ${dayjs(defect.received_at ?? defect.created_at).format('DD.MM.YYYY')}`
    : 'Дефект';

  const handleFiles = async (f: File[]) => {
    if (!defectId) return;
    const uploaded = await addAtt.mutateAsync({ defectId, files: f });
    setFiles((p) => [
      ...p,
      ...uploaded.map((u: any) => ({
        id: String(u.id),
        name: u.original_name ?? u.storage_path.split('/').pop(),
        path: u.storage_path,
        mime_type: u.file_type,
        original_name: u.original_name,
        url: u.file_url,
      })),
    ]);
  };

  const handleRemove = async (id: string) => {
    if (!defectId) return;
    await removeAtt.mutateAsync({ defectId, attachmentId: Number(id) });
    setFiles((p) => p.filter((f) => String(f.id) !== id));
  };

  const downloadDocx = () => {
    if (defect) createDefectDocx(defect as any);
  };

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
        <div style={{ display: 'grid', gap: 8 }}>
          <Typography.Text>
            <b>Описание:</b> {defect.description}
          </Typography.Text>
          <Typography.Text>
            <b>Тип дефекта:</b> {defect.defect_type?.name ?? '—'}
          </Typography.Text>
          <Typography.Text>
            <b>Статус:</b> {defect.defect_status?.name ?? '—'}
          </Typography.Text>
          <Typography.Text>
            <b>Кем устраняется:</b> {fixByName}
          </Typography.Text>
          <Typography.Text>
            <b>Дата получения:</b>{' '}
            {defect.received_at ? dayjs(defect.received_at).format('DD.MM.YYYY') : '—'}
          </Typography.Text>
          <Typography.Text>
            <b>Дата создания:</b>{' '}
            {defect.created_at ? dayjs(defect.created_at).format('DD.MM.YYYY') : '—'}
          </Typography.Text>
          <DefectAttachmentsBlock
            remoteFiles={files}
            onFiles={handleFiles}
            onRemove={handleRemove}
            getSignedUrl={(p, n) => signedUrl(p, n)}
          />
          <div style={{ textAlign: 'right' }}>
            <Tooltip title="Скачать форму устранения">
              <Button type="text" icon={<DownloadOutlined />} onClick={downloadDocx} />
            </Tooltip>
          </div>
        </div>
      )}
    </Modal>
  );
}
