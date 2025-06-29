import type { ArchiveFile } from './archiveFile';

/**
 * Набор документов, связанных с объектом.
 */
export interface UnitArchive {
  /** Документы по объекту */
  objectDocs: ArchiveFile[];
  /** Документы по замечаниям */
  remarkDocs: ArchiveFile[];
  /** Документы по дефектам */
  defectDocs: ArchiveFile[];
  /** Документы по судебным делам */
  courtDocs: ArchiveFile[];
}
