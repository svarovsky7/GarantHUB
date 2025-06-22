import type { DefectRecord } from './defect';
import type { Attachment } from './attachment';

/** Дефект с вложениями и связными названиями типов и статусов */
export interface DefectWithFiles extends DefectRecord {
  attachments: Attachment[];
  /** Тип дефекта */
  defect_type?: { id: number; name: string } | null;
  /** Статус дефекта */
  defect_status?: { id: number; name: string; color: string | null } | null;
}
