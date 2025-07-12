import React, { useEffect, useState } from 'react';
import {
  Form,
  Input,
  Select,
  DatePicker,
  Space,
  Typography,
  Row,
  Col,
  Card,
  Switch,
  Divider,
} from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import { useDefectTypes } from '@/entities/defectType';
import { useDefectStatuses } from '@/entities/defectStatus';
import { useBrigades } from '@/entities/brigade';
import { useContractors } from '@/entities/contractor';
import { useUsers } from '@/entities/user';
import type { Defect } from '@/shared/types/defect';

const { TextArea } = Input;

interface DefectEditFormProps {
  defect: Defect;
  onFieldChange: (field: string, value: any) => void;
  embedded?: boolean;
}

export const DefectEditForm = React.forwardRef<any, DefectEditFormProps>(
  ({ defect, onFieldChange, embedded = false }, ref) => {
    const [form] = Form.useForm();
    const { data: defectTypes = [] } = useDefectTypes();
    const { data: defectStatuses = [] } = useDefectStatuses();
    const { data: brigades = [] } = useBrigades();
    const { data: contractors = [] } = useContractors();
    const { data: users = [] } = useUsers();
    const [fixType, setFixType] = useState<'brigade' | 'contractor' | null>(null);

    useEffect(() => {
      if (defect) {
        const formValues = {
          ...defect,
          received_at: defect.received_at ? dayjs(defect.received_at) : null,
          fixed_at: defect.fixed_at ? dayjs(defect.fixed_at) : null,
        };
        form.setFieldsValue(formValues);
        
        if (defect.brigade_id) {
          setFixType('brigade');
        } else if (defect.contractor_id) {
          setFixType('contractor');
        }
      }
    }, [defect, form]);

    const handleValuesChange = (changedValues: any) => {
      Object.entries(changedValues).forEach(([key, value]) => {
        if (key === 'received_at' || key === 'fixed_at') {
          onFieldChange(key, value ? value.toISOString() : null);
        } else {
          onFieldChange(key, value);
        }
      });
    };

    const handleFixTypeChange = (type: 'brigade' | 'contractor' | null) => {
      setFixType(type);
      if (type === 'brigade') {
        form.setFieldValue('contractor_id', null);
        onFieldChange('contractor_id', null);
      } else if (type === 'contractor') {
        form.setFieldValue('brigade_id', null);
        onFieldChange('brigade_id', null);
      } else {
        form.setFieldValue('brigade_id', null);
        form.setFieldValue('contractor_id', null);
        onFieldChange('brigade_id', null);
        onFieldChange('contractor_id', null);
      }
    };

    React.useImperativeHandle(ref, () => ({
      form,
    }));

    const cardStyle = embedded ? {} : { marginBottom: 16 };

    return (
      <Form
        form={form}
        layout="vertical"
        onValuesChange={handleValuesChange}
      >
        <Card title="Основная информация" size="small" style={cardStyle}>
          <Row gutter={16}>
            <Col xs={24} sm={24} md={16}>
              <Form.Item
                name="description"
                label="Описание дефекта"
                rules={[{ required: true, message: 'Укажите описание дефекта' }]}
              >
                <TextArea
                  rows={4}
                  placeholder="Подробное описание дефекта..."
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                name="type_id"
                label="Тип дефекта"
                rules={[{ required: true, message: 'Выберите тип дефекта' }]}
              >
                <Select
                  placeholder="Выберите тип"
                  options={defectTypes.map((t) => ({
                    value: t.id,
                    label: t.name,
                  }))}
                />
              </Form.Item>
              <Form.Item
                name="status_id"
                label="Статус"
                rules={[{ required: true, message: 'Выберите статус' }]}
              >
                <Select
                  placeholder="Выберите статус"
                  options={defectStatuses.map((s) => ({
                    value: s.id,
                    label: s.name,
                  }))}
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                name="received_at"
                label="Дата получения"
              >
                <DatePicker
                  style={{ width: '100%' }}
                  format="DD.MM.YYYY"
                  placeholder="Выберите дату"
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                name="fixed_at"
                label="Дата устранения"
              >
                <DatePicker
                  style={{ width: '100%' }}
                  format="DD.MM.YYYY"
                  placeholder="Выберите дату"
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                name="is_warranty"
                label="Гарантийный"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        <Card title="Исполнители" size="small" style={cardStyle}>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="engineer_id"
                label="Ответственный инженер"
              >
                <Select
                  placeholder="Выберите инженера"
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  options={users.map((u) => ({
                    value: u.id,
                    label: u.name || u.email,
                  }))}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item label="Кем устраняется">
                <Select
                  placeholder="Выберите тип исполнителя"
                  value={fixType}
                  onChange={handleFixTypeChange}
                  allowClear
                >
                  <Select.Option value="brigade">Бригада</Select.Option>
                  <Select.Option value="contractor">Подрядчик</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            {fixType === 'brigade' && (
              <Col xs={24} sm={12}>
                <Form.Item
                  name="brigade_id"
                  label="Бригада"
                >
                  <Select
                    placeholder="Выберите бригаду"
                    allowClear
                    options={brigades.map((b) => ({
                      value: b.id,
                      label: b.name,
                    }))}
                  />
                </Form.Item>
              </Col>
            )}
            {fixType === 'contractor' && (
              <Col xs={24} sm={12}>
                <Form.Item
                  name="contractor_id"
                  label="Подрядчик"
                >
                  <Select
                    placeholder="Выберите подрядчика"
                    allowClear
                    showSearch
                    optionFilterProp="label"
                    options={contractors.map((c) => ({
                      value: c.id,
                      label: c.name,
                    }))}
                  />
                </Form.Item>
              </Col>
            )}
            <Col xs={24} sm={12}>
              <Form.Item
                name="fixed_by"
                label="Кем устранено"
              >
                <Input placeholder="ФИО исполнителя" />
              </Form.Item>
            </Col>
          </Row>
        </Card>
      </Form>
    );
  }
);

DefectEditForm.displayName = 'DefectEditForm';