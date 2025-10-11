import React from 'react';
import { Space, Button, Divider, Typography } from 'antd';
import { CalendarOutlined, PlusOutlined } from '@ant-design/icons';

const { Title } = Typography;

interface StatusInfo {
  name: string;
  color?: string;
}

interface CalendarHeaderProps {
  statistics: Record<string, number>;
  dbStatuses: StatusInfo[];
  onCreateNew: () => void;
}

/**
 * Calendar header with statistics and create button
 */
export const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  statistics,
  dbStatuses,
  onCreateNew,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
      }}
    >
      <Space>
        <CalendarOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
        <Title level={4} style={{ margin: 0 }}>
          Календарь вызовов
        </Title>
        <Divider type="vertical" />
        <Space>
          <span>
            Всего: <strong>{statistics.total}</strong>
          </span>
          {dbStatuses.length > 0 && (
            <>
              {dbStatuses.map((status) => (
                <React.Fragment key={status.name}>
                  <Divider type="vertical" />
                  <span>
                    {status.name}:{' '}
                    <strong
                      style={{
                        color: status.color || '#8c8c8c',
                        marginLeft: '4px',
                      }}
                    >
                      {statistics[status.name] || 0}
                    </strong>
                  </span>
                </React.Fragment>
              ))}
            </>
          )}
        </Space>
      </Space>
      <Button
        type="primary"
        icon={<PlusOutlined />}
        onClick={onCreateNew}
        size="large"
        style={{
          borderRadius: '8px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          border: 'none',
          boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
        }}
      >
        Добавить вызов
      </Button>
    </div>
  );
};
