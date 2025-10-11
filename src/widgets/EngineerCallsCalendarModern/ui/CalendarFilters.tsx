import React from 'react';
import { Card, Row, Col, Space, Select, DatePicker, Switch, ConfigProvider } from 'antd';
import locale from 'antd/es/locale/ru_RU';
import {
  ProjectOutlined,
  UserOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import type { Dayjs } from 'dayjs';

const { RangePicker } = DatePicker;

interface CalendarFiltersProps {
  // Projects
  projects: Array<{ id: string; name: string }>;
  selectedProjectId: string | null;
  onProjectChange: (value: string | null) => void;
  projectsLoading: boolean;

  // Engineers
  engineers: Array<{ id: string; name: string }>;
  selectedEngineerIds: string[];
  onEngineersChange: (value: string[]) => void;
  engineersLoading: boolean;

  // Date range
  dateRange: [Dayjs | null, Dayjs | null];
  onDateRangeChange: (dates: [Dayjs | null, Dayjs | null]) => void;

  // Only my meetings toggle
  onlyMyMeetings: boolean;
  onOnlyMyMeetingsChange: (checked: boolean) => void;
}

/**
 * Calendar filters component
 * Provides project, engineer, date range filters and "only my meetings" toggle
 */
export const CalendarFilters: React.FC<CalendarFiltersProps> = ({
  projects,
  selectedProjectId,
  onProjectChange,
  projectsLoading,
  engineers,
  selectedEngineerIds,
  onEngineersChange,
  engineersLoading,
  dateRange,
  onDateRangeChange,
  onlyMyMeetings,
  onOnlyMyMeetingsChange,
}) => {
  return (
    <Card
      style={{
        marginBottom: '24px',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      }}
      styles={{
        body: { padding: '16px 24px' },
      }}
    >
      <Row gutter={[16, 16]}>
        {/* Project filter */}
        <Col xs={24} sm={12} md={6}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '4px',
              }}
            >
              <ProjectOutlined style={{ color: '#1890ff', fontSize: '16px' }} />
              <span style={{ fontWeight: 500 }}>Проект</span>
            </div>
            <Select
              placeholder="Все проекты"
              style={{ width: '100%' }}
              allowClear
              showSearch
              optionFilterProp="children"
              value={selectedProjectId}
              onChange={onProjectChange}
              loading={projectsLoading}
              size="large"
            >
              {projects.map((project) => (
                <Select.Option key={project.id} value={project.id}>
                  {project.name}
                </Select.Option>
              ))}
            </Select>
          </Space>
        </Col>

        {/* Engineers filter */}
        <Col xs={24} sm={12} md={8}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '4px',
              }}
            >
              <UserOutlined style={{ color: '#1890ff', fontSize: '16px' }} />
              <span style={{ fontWeight: 500 }}>Инженеры</span>
            </div>
            <Select
              mode="multiple"
              placeholder="Все инженеры"
              style={{ width: '100%' }}
              allowClear
              showSearch
              optionFilterProp="children"
              value={selectedEngineerIds}
              onChange={onEngineersChange}
              loading={engineersLoading}
              size="large"
              maxTagCount={2}
              disabled={onlyMyMeetings}
            >
              {engineers.map((engineer) => (
                <Select.Option key={engineer.id} value={engineer.id}>
                  {engineer.name}
                </Select.Option>
              ))}
            </Select>
          </Space>
        </Col>

        {/* Date range filter */}
        <Col xs={24} sm={12} md={8}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '4px',
              }}
            >
              <CalendarOutlined style={{ color: '#1890ff', fontSize: '16px' }} />
              <span style={{ fontWeight: 500 }}>Период</span>
            </div>
            <ConfigProvider locale={locale}>
              <RangePicker
                style={{ width: '100%' }}
                size="large"
                value={dateRange}
                onChange={(dates) => onDateRangeChange(dates || [null, null])}
                format="DD.MM.YYYY"
                placeholder={['Начало', 'Конец']}
                allowClear
              />
            </ConfigProvider>
          </Space>
        </Col>
      </Row>

      {/* Only my meetings toggle */}
      <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
        <Col xs={24}>
          <Space>
            <Switch
              checked={onlyMyMeetings}
              onChange={onOnlyMyMeetingsChange}
              checkedChildren="Мои встречи"
              unCheckedChildren="Все встречи"
            />
            <span
              style={{
                color: onlyMyMeetings ? '#1890ff' : '#8c8c8c',
                fontWeight: onlyMyMeetings ? 500 : 400,
              }}
            >
              {onlyMyMeetings
                ? 'Показаны только встречи, где вы назначены инженером'
                : 'Показаны все доступные встречи'}
            </span>
          </Space>
        </Col>
      </Row>
    </Card>
  );
};
