import React from 'react';
import { Form, Input, Row, Col } from 'antd';
import { FileTextOutlined } from '@ant-design/icons';

/**
 * Basic information section - title input
 */
const CallBasicInfo: React.FC = () => {
  return (
    <Row gutter={16}>
      <Col span={24}>
        <Form.Item
          name="title"
          label="Название вызова"
          rules={[{ required: true, message: 'Введите название' }]}
        >
          <Input
            placeholder="Например: Проверка протечки в квартире 123"
            prefix={<FileTextOutlined />}
          />
        </Form.Item>
      </Col>
    </Row>
  );
};

export default CallBasicInfo;
