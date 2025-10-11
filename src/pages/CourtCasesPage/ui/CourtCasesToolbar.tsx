import React from "react";
import { Button } from "antd";
import { SettingOutlined } from "@ant-design/icons";

const ExportCourtCasesButton = React.lazy(
  () => import("@/features/courtCase/ExportCourtCasesButton")
);

interface CourtCasesToolbarProps {
  canEdit: boolean;
  showAddForm: boolean;
  showFilters: boolean;
  onToggleAddForm: () => void;
  onToggleFilters: () => void;
  onOpenColumnsDrawer: () => void;
  exportData: any[];
  stages: Record<number, string>;
  closedStageId?: number;
}

/**
 * Toolbar for court cases page
 * Contains action buttons for add, filter, export, and column settings
 */
export function CourtCasesToolbar({
  canEdit,
  showAddForm,
  showFilters,
  onToggleAddForm,
  onToggleFilters,
  onOpenColumnsDrawer,
  exportData,
  stages,
  closedStageId,
}: CourtCasesToolbarProps) {
  return (
    <>
      {canEdit && (
        <Button
          type="primary"
          onClick={onToggleAddForm}
          style={{ marginRight: 8 }}
        >
          {showAddForm ? "Скрыть форму" : "Добавить дело"}
        </Button>
      )}
      <Button onClick={onToggleFilters}>
        {showFilters ? "Скрыть фильтры" : "Показать фильтры"}
      </Button>
      <Button
        icon={<SettingOutlined />}
        style={{ marginLeft: 8 }}
        onClick={onOpenColumnsDrawer}
      />
      <span style={{ marginLeft: 8, display: "inline-block" }}>
        <React.Suspense fallback={<Button loading>Экспорт</Button>}>
          <ExportCourtCasesButton
            cases={exportData}
            stages={stages}
            closedStageId={closedStageId}
          />
        </React.Suspense>
      </span>
    </>
  );
}
