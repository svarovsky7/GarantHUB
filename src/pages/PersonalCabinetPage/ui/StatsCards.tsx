import React from 'react';
import { Card, Col, Row, Statistic } from 'antd';
import {
  FileTextOutlined,
  ExclamationCircleOutlined,
  MailOutlined,
  CalendarOutlined
} from '@ant-design/icons';

interface StatsCardsProps {
  stats: {
    activeClaims: number;
    totalClaims: number;
    activeDefects: number;
    totalDefects: number;
    unreadLetters: number;
    totalLetters: number;
    upcomingCalls: number;
    totalCalls: number;
  };
}

export default function StatsCards({ stats }: StatsCardsProps) {
  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} sm={12} lg={6}>
        <Card>
          <Statistic
            title="Активные претензии"
            value={stats.activeClaims}
            suffix={`/ ${stats.totalClaims}`}
            prefix={<FileTextOutlined />}
            valueStyle={{ color: stats.activeClaims > 0 ? '#cf1322' : '#3f8600' }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card>
          <Statistic
            title="Активные дефекты"
            value={stats.activeDefects}
            suffix={`/ ${stats.totalDefects}`}
            prefix={<ExclamationCircleOutlined />}
            valueStyle={{ color: stats.activeDefects > 0 ? '#fa8c16' : '#3f8600' }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card>
          <Statistic
            title="Непрочитанные письма"
            value={stats.unreadLetters}
            suffix={`/ ${stats.totalLetters}`}
            prefix={<MailOutlined />}
            valueStyle={{ color: stats.unreadLetters > 0 ? '#1890ff' : undefined }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card>
          <Statistic
            title="Предстоящие вызовы"
            value={stats.upcomingCalls}
            suffix={`/ ${stats.totalCalls}`}
            prefix={<CalendarOutlined />}
            valueStyle={{ color: stats.upcomingCalls > 0 ? '#52c41a' : undefined }}
          />
        </Card>
      </Col>
    </Row>
  );
}
