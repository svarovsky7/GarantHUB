import React from 'react';
import dayjs from 'dayjs';
import { Modal, Table, Tag, ConfigProvider, Button, Switch, Space } from 'antd';
import { useNavigate, createSearchParams } from 'react-router-dom';
import ruRU from 'antd/locale/ru_RU';
import type { ColumnsType } from 'antd/es/table';
import { useUnitHistory } from '@/entities/history';
import type { HistoryEventWithUser } from '@/shared/types/history';

interface HistoryDialogProps {
  open: boolean;
  unit: { id: number; name: string; project_id?: number } | null;
  onClose: () => void;
  /** Открыть модальное окно дела, если страница не обрабатывает case_id */
  onOpenCourtCase?: (caseId: number) => void;
}

/** Диалог отображения истории объекта */
export default function HistoryDialog({ open, unit, onClose, onOpenCourtCase }: HistoryDialogProps) {
  const { data = [], isLoading } = useUnitHistory(unit?.id);
  const navigate = useNavigate();
  const [primaryOnly, setPrimaryOnly] = React.useState(false);

  const caseIds = React.useMemo(
    () =>
      Array.from(
        new Set(
          data
            .filter((e) => e.entity_type === 'court_case')
            .map((e) => e.entity_id),
        ),
      ),
    [data],
  );
  const letterIds = React.useMemo(
    () =>
      Array.from(
        new Set(
          data.filter((e) => e.entity_type === 'letter').map((e) => e.entity_id),
        ),
      ),
    [data],
  );

  const displayedData = React.useMemo(() => {
    if (!primaryOnly) return data;
    const latest = new Map<string, HistoryEventWithUser>();
    for (const ev of data) {
      const key = `${ev.entity_type}:${ev.entity_id}`;
      if (!latest.has(key)) {
        latest.set(key, ev);
      }
    }
    return Array.from(latest.values()).filter((ev) => ev.action !== 'deleted');
  }, [data, primaryOnly]);

  const actionLabels: Record<string, string> = {
    created: 'Создан',
    updated: 'Обновлен',
    deleted: 'Удален',
  };

  const typeLabels: Record<string, string> = {
    letter: 'Письмо',
    court_case: 'Судебное дело',
  };

  const columns: ColumnsType<HistoryEventWithUser> = [
    {
      title: 'Дата',
      dataIndex: 'changed_at',
      render: (d: string) => dayjs(d).format('DD.MM.YYYY HH:mm'),
    },
    {
      title: 'Действие',
      dataIndex: 'action',
      render: (a: string) => <Tag>{actionLabels[a] ?? a}</Tag>,
    },
    {
      title: 'Тип',
      dataIndex: 'entity_type',
      render: (t: string) => typeLabels[t] ?? t,
    },
    {
      title: 'ID',
      dataIndex: 'entity_id',
    },
    {
      title: 'Пользователь',
      dataIndex: 'user_name',
      render: (n: string | null) => n || '—',
    },
    {
      title: 'Действие',
      key: 'open',
      render: (_: any, record) => (
          <Button
              type="link"
              onClick={() => {
                if (record.entity_type === 'letter') {
                  navigate(`/correspondence?letter_id=${record.entity_id}`);
                } else if (record.entity_type === 'court_case') {
                  /* FIX: передаём дело через query‑param, а не через location.state */
                  if (onOpenCourtCase) {
                    onOpenCourtCase(record.entity_id);
                  } else {
                    navigate(`/court-cases?case_id=${record.entity_id}`);
                  }
                }
                onClose();
              }}
          >
            Открыть
          </Button>
      ),
    },
  ];

  return (
      <ConfigProvider locale={ruRU}>
        <Modal
            open={open}
            onCancel={onClose}
            footer={null}
            title={unit ? `История объекта ${unit.name}` : 'История'}
            width={700}
            zIndex={1400}
            destroyOnHidden
        >
          <Space style={{ marginBottom: 12 }}>
            <Switch checked={primaryOnly} onChange={setPrimaryOnly} />
            Показать основные документы
          </Space>
          <Space style={{ marginBottom: 12 }}>
            <Button
              disabled={!caseIds.length}
              onClick={() => {
                if (unit) {
                  const search = createSearchParams({
                    project_id: String(unit.project_id ?? ''),
                    unit_id: String(unit.id),
                  }).toString();
                  navigate(`/court-cases?${search}`);
                } else {
                  navigate('/court-cases');
                }
                onClose();
              }}
            >
              Судебные дела
            </Button>
            <Button
              disabled={!letterIds.length}
              onClick={() => {
                if (unit) {
                  const search = createSearchParams({
                    project_id: String(unit.project_id ?? ''),
                    unit_id: String(unit.id),
                  }).toString();
                  navigate(`/correspondence?${search}`);
                } else {
                  navigate('/correspondence');
                }
                onClose();
              }}
            >
              Письма
            </Button>
          </Space>
          <Table
              rowKey="id"
              columns={columns}
              dataSource={displayedData}
              loading={isLoading}
              pagination={{ pageSize: 10 }}
              size="small"
          />
        </Modal>
      </ConfigProvider>
  );
}
