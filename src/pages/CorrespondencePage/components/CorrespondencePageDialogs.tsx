import React from 'react';
import LinkLettersDialog from '@/features/correspondence/LinkLettersDialog';
import LetterViewModal from '@/features/correspondence/LetterViewModal';
import type { CorrespondenceLetter } from '@/shared/types/correspondence';
import type { TableColumnSetting } from '@/shared/types/tableColumnSetting';
import type { ColumnsType } from 'antd/es/table';

// Lazy loading для тяжелых компонентов
const TableColumnsDrawer = React.lazy(
  () => import("@/widgets/TableColumnsDrawer"),
);

interface CorrespondencePageDialogsProps {
  // Link Letters Dialog
  linkFor: CorrespondenceLetter | null;
  letters: CorrespondenceLetter[];
  onCloseLinkDialog: () => void;
  onLinkLetters: (ids: string[]) => void;

  // View Modal
  viewId: string | null;
  onCloseView: () => void;

  // Columns Drawer
  showColumnsDrawer: boolean;
  columnsState: TableColumnSetting[];
  columnWidths: Record<string, number>;
  baseColumns: Record<string, ColumnsType<any>[number]>;
  onCloseColumnsDrawer: () => void;
  onColumnsChange: (columns: TableColumnSetting[]) => void;
  onWidthsChange: (widths: Record<string, number>) => void;
  onResetColumns: () => void;
}

const CorrespondencePageDialogs = React.memo<CorrespondencePageDialogsProps>(({
  linkFor,
  letters,
  onCloseLinkDialog,
  onLinkLetters,
  viewId,
  onCloseView,
  showColumnsDrawer,
  columnsState,
  columnWidths,
  baseColumns,
  onCloseColumnsDrawer,
  onColumnsChange,
  onWidthsChange,
  onResetColumns,
}) => {
  return (
    <>
      <LinkLettersDialog
        open={!!linkFor}
        parent={linkFor}
        letters={letters}
        onClose={onCloseLinkDialog}
        onSubmit={onLinkLetters}
      />

      <LetterViewModal
        open={viewId !== null}
        letterId={viewId}
        onClose={onCloseView}
      />

      <React.Suspense fallback={null}>
        <TableColumnsDrawer
          open={showColumnsDrawer}
          columns={columnsState}
          widths={
            Object.fromEntries(
              Object.keys(baseColumns).map((k) => [
                k, 
                columnWidths[k] ?? baseColumns[k].width
              ])
            ) as Record<string, number>
          }
          onWidthsChange={onWidthsChange}
          onChange={onColumnsChange}
          onClose={onCloseColumnsDrawer}
          onReset={onResetColumns}
        />
      </React.Suspense>
    </>
  );
});

CorrespondencePageDialogs.displayName = 'CorrespondencePageDialogs';

export default CorrespondencePageDialogs;