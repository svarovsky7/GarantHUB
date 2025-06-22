import { Document, Packer, Paragraph, TextRun } from 'docx';
import dayjs from 'dayjs';
import { saveAs } from 'file-saver';
import type { DefectWithFiles } from '@/shared/types/defectWithFiles';

/**
 * Сформировать DOCX-файл типовой формы устранения замечания
 * и скачать его.
 * @param defect данные дефекта
 */
export async function createDefectDocx(defect: DefectWithFiles) {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            children: [
              new TextRun({ text: 'Форма устранения замечания', bold: true }),
            ],
          }),
          new Paragraph(`ID дефекта: ${defect.id}`),
          new Paragraph(`Описание: ${defect.description}`),
          new Paragraph(`Тип дефекта: ${defect.defect_type?.name ?? '-'}`),
          new Paragraph(
            `Дата получения: ${
              defect.received_at ? dayjs(defect.received_at).format('DD.MM.YYYY') : '-' }
            `,
          ),
          new Paragraph(
            `Дата устранения: ${
              defect.fixed_at ? dayjs(defect.fixed_at).format('DD.MM.YYYY') : '-' }
            `,
          ),
        ],
      },
    ],
  });
  const blob = await Packer.toBlob(doc);
  saveAs(blob, `defect_${defect.id}.docx`);
}
