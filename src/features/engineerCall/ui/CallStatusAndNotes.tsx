import React from 'react';
import { Form, Select, Input, Row, Col, Space } from 'antd';

const { TextArea } = Input;
const { Option } = Select;

interface StatusOption {
  value: string;
  label: string;
  color: string;
}

interface CallStatusAndNotesProps {
  statusOptions: StatusOption[];
}

/**
 * Status and notes section
 */
const CallStatusAndNotes: React.FC<CallStatusAndNotesProps> = ({ statusOptions }) => {
  return (
    <Row gutter={16}>
      <Col xs={24} md={12}>
        <Form.Item name="status" label="Статус">
          <Select placeholder="Выберите статус">
            {statusOptions.map((option) => (
              <Option key={option.value} value={option.value}>
                <Space>
                  <span
                    style={{
                      display: 'inline-block',
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      backgroundColor: option.color,
                    }}
                  />
                  {option.label}
                </Space>
              </Option>
            ))}
          </Select>
        </Form.Item>
      </Col>
      <Col xs={24} md={12}>
        <Form.Item name="notes" label="Примечания">
          <TextArea
            rows={3}
            placeholder="Дополнительные заметки..."
            autoSize={{ minRows: 3, maxRows: 6 }}
          />
        </Form.Item>
      </Col>
    </Row>
  );
};

export default CallStatusAndNotes;
