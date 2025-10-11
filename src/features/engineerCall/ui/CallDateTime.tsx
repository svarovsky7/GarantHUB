import React from 'react';
import { Form, DatePicker, TimePicker, Row, Col, Space, Tag, Typography, message } from 'antd';
import { ClockCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import type { FormInstance } from 'antd';

const { Text } = Typography;

interface CallDateTimeProps {
  form: FormInstance;
}

const quickDurations = [
  { label: '30 мин', value: 30 },
  { label: '1 час', value: 60 },
  { label: '2 часа', value: 120 },
];

/**
 * Date and time selection section with quick duration buttons
 */
const CallDateTime: React.FC<CallDateTimeProps> = ({ form }) => {
  const setQuickDuration = (minutes: number) => {
    const startTime = form.getFieldValue('startTime');

    if (!startTime) {
      message.warning('Сначала выберите время начала');
      return;
    }

    const startTimeDayjs = dayjs.isDayjs(startTime) ? startTime : dayjs(startTime);
    const endTime = startTimeDayjs.add(minutes, 'minute');

    form.setFieldsValue({ endTime });
    message.success(`Время окончания установлено: ${endTime.format('HH:mm')}`);
  };

  return (
    <>
      <Row gutter={16}>
        <Col xs={24} md={8}>
          <Form.Item
            name="date"
            label="Дата"
            rules={[{ required: true, message: 'Выберите дату' }]}
          >
            <DatePicker
              format="DD.MM.YYYY"
              style={{ width: '100%' }}
              placeholder="Выберите дату"
              onChange={(value) => {
                console.log('[EngineerCall] Date changed to:', value?.format('DD.MM.YYYY'));
              }}
            />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item
            name="startTime"
            label="Время начала"
            rules={[{ required: true, message: 'Укажите время' }]}
          >
            <TimePicker
              format="HH:mm"
              use12Hours={false}
              style={{ width: '100%' }}
              placeholder="08:00"
              minuteStep={15}
              showNow={false}
              needConfirm={false}
              onChange={(value) => {
                console.log('[EngineerCall] Start time changed to:', value?.format('HH:mm'));
              }}
            />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item
            name="endTime"
            label="Время окончания"
            rules={[
              { required: true, message: 'Укажите время' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  const startTime = getFieldValue('startTime');
                  if (!value || !startTime) return Promise.resolve();

                  const start = dayjs.isDayjs(startTime) ? startTime : dayjs(startTime);
                  const end = dayjs.isDayjs(value) ? value : dayjs(value);

                  if (end.isAfter(start)) return Promise.resolve();
                  return Promise.reject(new Error('Должно быть позже начала'));
                },
              }),
            ]}
          >
            <TimePicker
              format="HH:mm"
              use12Hours={false}
              style={{ width: '100%' }}
              placeholder="09:00"
              minuteStep={15}
              showNow={false}
              needConfirm={false}
              onChange={(value) => {
                console.log('[EngineerCall] End time changed to:', value?.format('HH:mm'));
              }}
            />
          </Form.Item>
        </Col>
      </Row>

      {/* Quick duration buttons */}
      <Row style={{ marginTop: -8, marginBottom: 16 }}>
        <Col span={24}>
          <Space size="small">
            <Text type="secondary" style={{ fontSize: '12px' }}>
              Быстро:
            </Text>
            {quickDurations.map((duration) => (
              <Tag
                key={duration.value}
                style={{
                  cursor: 'pointer',
                  padding: '4px 12px',
                  borderRadius: '16px',
                  fontSize: '13px',
                }}
                color="blue"
                onClick={() => setQuickDuration(duration.value)}
              >
                <ClockCircleOutlined style={{ marginRight: 4 }} />
                {duration.label}
              </Tag>
            ))}
          </Space>
        </Col>
      </Row>
    </>
  );
};

export default CallDateTime;
