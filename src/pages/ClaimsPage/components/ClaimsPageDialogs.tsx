import React from 'react';
import { message } from 'antd';
import LinkClaimsDialog from '@/features/claim/LinkClaimsDialog';
import ClaimViewModal from '@/features/claim/ClaimViewModal';
import type { ClaimWithNames } from '@/shared/types/claimWithNames';
import type { TableColumnSetting } from '@/shared/types/tableColumnSetting';
import type { ColumnsType } from 'antd/es/table';

// Lazy loading для тяжелых компонентов
const TableColumnsDrawer = React.lazy(
  () => import("@/widgets/TableColumnsDrawer"),
);

interface ClaimsPageDialogsProps {
  // Link Claims Dialog
  linkFor: ClaimWithNames | null;
  claimsWithNames: ClaimWithNames[];
  isLinking: boolean;
  onCloseLinkDialog: () => void;
  onLinkClaims: (parentId: string, childIds: string[]) => void;

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

const ClaimsPageDialogs = React.memo<ClaimsPageDialogsProps>(({
  linkFor,
  claimsWithNames,
  isLinking,
  onCloseLinkDialog,
  onLinkClaims,
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
  const handleLinkSubmit = React.useCallback((ids: string[]) => {
    if (!linkFor) return;
    
    onLinkClaims(String(linkFor.id), ids);
  }, [linkFor, onLinkClaims]);

  return (
    <>
      <LinkClaimsDialog
        open={!!linkFor}
        parent={linkFor}
        claims={claimsWithNames}
        loading={isLinking}
        onClose={onCloseLinkDialog}
        onSubmit={handleLinkSubmit}
      />

      <ClaimViewModal
        open={viewId !== null}
        claimId={viewId}
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

ClaimsPageDialogs.displayName = 'ClaimsPageDialogs';

export default ClaimsPageDialogs;