import React from 'react';
import { Row, Col, Typography, Alert } from 'antd';

const { Title, Text } = Typography;

interface PageHeaderProps {
  userName?: string;
  userEmail?: string;
  userRole?: string;
  projectsCount: number;
}

export default function PageHeader({ userName, userEmail, userRole, projectsCount }: PageHeaderProps) {
  return (
    <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
      <Col>
        <Title level={2} style={{ marginBottom: 0 }}>Личный кабинет</Title>
        <Text type="secondary">
          {userName || userEmail} • {userRole}
        </Text>
      </Col>
      <Col>
        <Alert
          message={`Показаны данные по ${projectsCount} проектам`}
          type="info"
          showIcon
        />
      </Col>
    </Row>
  );
}
