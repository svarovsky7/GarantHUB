import React, { useState } from 'react';
import { Card, Typography, Switch, List, Divider, Space, Tag, Alert, Row, Col } from 'antd';
import { 
  EyeOutlined, 
  TeamOutlined, 
  CalendarOutlined,
  FileTextOutlined,
  HomeOutlined,
  SettingOutlined,
  GlobalOutlined,
  UserOutlined,
  ToolOutlined
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

interface RoleFeature {
  key: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  roles: {
    admin: boolean;
    engineer: boolean;
    user: boolean;
  };
}

const RoleBasedFeatures: React.FC = () => {
  // Конфигурация особых функций для каждой роли
  const [features] = useState<RoleFeature[]>([
    {
      key: 'view_all_engineer_calls',
      title: 'Просмотр всех вызовов инженеров',
      description: 'Видеть вызовы инженеров из всех проектов в календаре',
      icon: <CalendarOutlined style={{ color: '#1890ff' }} />,
      roles: {
        admin: true,
        engineer: false,
        user: false
      }
    },
    {
      key: 'view_all_projects',
      title: 'Доступ ко всем проектам',
      description: 'Работа с любым проектом без ограничений',
      icon: <GlobalOutlined style={{ color: '#52c41a' }} />,
      roles: {
        admin: true,
        engineer: false,
        user: false
      }
    },
    {
      key: 'manage_users',
      title: 'Управление пользователями',
      description: 'Создание, редактирование и удаление пользователей',
      icon: <TeamOutlined style={{ color: '#fa8c16' }} />,
      roles: {
        admin: true,
        engineer: false,
        user: false
      }
    },
    {
      key: 'edit_statuses',
      title: 'Редактирование статусов',
      description: 'Изменение статусов претензий, дефектов и судебных дел',
      icon: <SettingOutlined style={{ color: '#722ed1' }} />,
      roles: {
        admin: true,
        engineer: false,
        user: false
      }
    },
    {
      key: 'view_defects',
      title: 'Просмотр дефектов',
      description: 'Доступ к списку дефектов и их деталям',
      icon: <ToolOutlined style={{ color: '#eb2f96' }} />,
      roles: {
        admin: true,
        engineer: true,
        user: true
      }
    },
    {
      key: 'edit_defects',
      title: 'Редактирование дефектов',
      description: 'Создание и изменение дефектов',
      icon: <ToolOutlined style={{ color: '#fa541c' }} />,
      roles: {
        admin: true,
        engineer: true,
        user: false
      }
    },
    {
      key: 'view_claims',
      title: 'Просмотр претензий',
      description: 'Доступ к списку претензий',
      icon: <FileTextOutlined style={{ color: '#13c2c2' }} />,
      roles: {
        admin: true,
        engineer: true,
        user: true
      }
    },
    {
      key: 'edit_claims',
      title: 'Редактирование претензий',
      description: 'Создание и изменение претензий',
      icon: <FileTextOutlined style={{ color: '#2f54eb' }} />,
      roles: {
        admin: true,
        engineer: false,
        user: true
      }
    },
    {
      key: 'view_units',
      title: 'Просмотр структуры проекта',
      description: 'Доступ к структуре проекта и квартирам',
      icon: <HomeOutlined style={{ color: '#52c41a' }} />,
      roles: {
        admin: true,
        engineer: true,
        user: true
      }
    }
  ]);

  const roleColors = {
    admin: '#f50',
    engineer: '#2db7f5',
    user: '#87d068'
  };

  const roleNames = {
    admin: 'Администратор',
    engineer: 'Инженер',
    user: 'Пользователь'
  };

  return (
    <Card
      title={
        <Space>
          <EyeOutlined style={{ fontSize: '20px', color: '#1890ff' }} />
          <span>Особые функции и права доступа</span>
        </Space>
      }
      style={{
        borderRadius: '12px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
      }}
    >
      <Alert
        message="Настройки прав доступа"
        description="Здесь отображаются текущие права доступа для каждой роли. Администраторы имеют полный доступ ко всем функциям системы, включая просмотр всех вызовов инженеров из всех проектов."
        type="info"
        showIcon
        style={{ marginBottom: '24px' }}
      />

      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col span={8}>
          <Card size="small" style={{ textAlign: 'center', background: '#fff1f0' }}>
            <UserOutlined style={{ fontSize: '24px', color: roleColors.admin }} />
            <Title level={5} style={{ margin: '8px 0 0 0' }}>Администратор</Title>
            <Text type="secondary">Полный доступ</Text>
          </Card>
        </Col>
        <Col span={8}>
          <Card size="small" style={{ textAlign: 'center', background: '#e6f7ff' }}>
            <UserOutlined style={{ fontSize: '24px', color: roleColors.engineer }} />
            <Title level={5} style={{ margin: '8px 0 0 0' }}>Инженер</Title>
            <Text type="secondary">Технический доступ</Text>
          </Card>
        </Col>
        <Col span={8}>
          <Card size="small" style={{ textAlign: 'center', background: '#f6ffed' }}>
            <UserOutlined style={{ fontSize: '24px', color: roleColors.user }} />
            <Title level={5} style={{ margin: '8px 0 0 0' }}>Пользователь</Title>
            <Text type="secondary">Базовый доступ</Text>
          </Card>
        </Col>
      </Row>

      <List
        itemLayout="horizontal"
        dataSource={features}
        renderItem={(feature) => (
          <List.Item>
            <List.Item.Meta
              avatar={feature.icon}
              title={
                <Space>
                  <Text strong>{feature.title}</Text>
                  {feature.key === 'view_all_engineer_calls' && (
                    <Tag color="red">Новое</Tag>
                  )}
                </Space>
              }
              description={
                <div>
                  <Paragraph style={{ margin: '4px 0' }}>
                    {feature.description}
                  </Paragraph>
                  <Space size="middle" style={{ marginTop: '8px' }}>
                    {Object.entries(feature.roles).map(([role, hasAccess]) => (
                      <Space key={role} size="small">
                        <Tag color={roleColors[role as keyof typeof roleColors]}>
                          {roleNames[role as keyof typeof roleNames]}
                        </Tag>
                        <Switch 
                          checked={hasAccess} 
                          disabled 
                          size="small"
                          checkedChildren="✓"
                          unCheckedChildren="✗"
                        />
                      </Space>
                    ))}
                  </Space>
                </div>
              }
            />
          </List.Item>
        )}
      />

      <Divider />

      <Alert
        message="Важная информация"
        description={
          <ul style={{ marginBottom: 0, paddingLeft: '20px' }}>
            <li>Администраторы видят все вызовы инженеров из всех проектов в календаре</li>
            <li>Инженеры и пользователи видят только вызовы из назначенных им проектов</li>
            <li>Для изменения прав доступа обратитесь к системному администратору</li>
          </ul>
        }
        type="warning"
        showIcon
      />
    </Card>
  );
};

export default RoleBasedFeatures;