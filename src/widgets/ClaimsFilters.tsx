import React, { useEffect, useState } from "react";
import {
  Form,
  DatePicker,
  Select,
  Input,
  Button,
  Switch,
  Card,
  Row,
  Col,
  Collapse,
  Badge,
  Skeleton,
} from "antd";
import type { ClaimFilters } from "@/shared/types/claimFilters";

const { RangePicker } = DatePicker;

interface Props {
  options: any;
  loading?: boolean;
  initialValues?: Partial<ClaimFilters>;
  onSubmit: (v: ClaimFilters) => void;
  onReset: () => void;
}

export default function ClaimsFilters({
  options,
  loading,
  initialValues = {},
  onSubmit,
  onReset,
}: Props) {
  const LS_HIDE_CLOSED = "claimsHideClosed";
  const [form] = Form.useForm();
  const [extraCount, setExtraCount] = useState(0);


  useEffect(() => {
    form.setFieldsValue(initialValues);
    calcExtra();
  }, [initialValues, form]);

  useEffect(() => {
    try {
      const hideClosed = JSON.parse(
        localStorage.getItem(LS_HIDE_CLOSED) || "false",
      );
      form.setFieldValue("hideClosed", hideClosed);
    } catch {}
  }, [form]);

  const extraKeys: (keyof ClaimFilters)[] = [
    "id",
    "claim_no",
    "author",
    "building",
    "units",
    "period",
    "claimedPeriod",
    "acceptedPeriod",
    "resolvedPeriod",
    "description",
  ];

  const calcExtra = () => {
    const vals = form.getFieldsValue();
    const count = extraKeys.reduce((acc, key) => {
      const v = vals[key];
      if (Array.isArray(v)) return acc + (v.length ? 1 : 0);
      if (v === undefined || v === null || v === "" || v === false) return acc;
      return acc + 1;
    }, 0);
    setExtraCount(count);
  };

  const handleValuesChange = (
    changed: Partial<ClaimFilters>,
    all: ClaimFilters,
  ) => {
    calcExtra();
    // Автоматически применяем фильтры при изменении
    handleFinish(all);
    if (Object.prototype.hasOwnProperty.call(changed, "hideClosed")) {
      try {
        localStorage.setItem(LS_HIDE_CLOSED, JSON.stringify(all.hideClosed));
      } catch {}
    }
  };

  const handleFinish = (values: ClaimFilters) => {
    onSubmit(values);
  };

  const handleReset = () => {
    form.resetFields();
    setExtraCount(0);
    try {
      localStorage.setItem(LS_HIDE_CLOSED, "false");
    } catch {}
    onReset();
  };

  const badge = <Badge count={extraCount} size="small" />;

  return (
    <Card variant="outlined" size="small" style={{ maxWidth: 1040, border: 'none' }}>
      {loading ? (
        <Skeleton active paragraph={{ rows: 4 }} />
      ) : (
        <Form
          form={form}
          layout="vertical"
          onValuesChange={handleValuesChange}
          onFinish={handleFinish}
        >
          <Row gutter={12}>
            <Col span={5}>
              <Form.Item
                name="responsible"
                label="Закрепленный инженер"
              >
                <Select
                  allowClear
                  options={options.responsibleEngineers}
                />
              </Form.Item>
            </Col>
            <Col span={5}>
              <Form.Item name="project" label="Проект">
                <Select 
                  mode="multiple"
                  allowClear 
                  options={options.projects}
                  showSearch
                  optionFilterProp="label"
                  onChange={(value) => {
                    // При изменении проекта очищаем только корпус, но не объекты
                    if (!value || value.length === 0) {
                      form.setFieldsValue({ 
                        building: undefined 
                      });
                    }
                  }}
                />
              </Form.Item>
            </Col>
            <Col span={5}>
              <Form.Item name="units" label="Объекты">
                <Select
                  mode="multiple"
                  allowClear
                  options={options.units}
                  showSearch
                  optionFilterProp="label"
                  placeholder="Выберите объекты"
                  onChange={(value) => {
                  }}
                />
              </Form.Item>
            </Col>
            <Col span={5}>
              <Form.Item name="status" label="Статус">
                <Select allowClear options={options.statuses} />
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item
                name="hideClosed"
                label="СКРЫТЬ ЗАКРЫТЫЕ И НЕ ГАРАНТИЯ"
                valuePropName="checked"
              >
                <Switch size="small" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col flex="auto">
              <Collapse ghost>
                <Collapse.Panel header="Доп. фильтры" key="more" extra={badge}>
                  <Row gutter={12}>
                    <Col span={6}>
                      <Form.Item name="id" label="ID претензии">
                        <Select
                          mode="multiple"
                          allowClear
                          options={options.ids}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={6}>
                      <Form.Item name="claim_no" label="№ претензии">
                        <Input />
                      </Form.Item>
                    </Col>
                    <Col span={6}>
                      <Form.Item name="author" label="Автор">
                        <Select allowClear options={options.authors} />
                      </Form.Item>
                    </Col>
                    <Col span={6}>
                      <Form.Item name="building" label="Корпус">
                        <Select 
                          mode="multiple"
                          allowClear 
                          options={options.buildings}
                          showSearch
                          optionFilterProp="label"
                          placeholder="Выберите корпус"
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={12}>
                    <Col span={6}>
                      <Form.Item name="period" label="Дата регистрации">
                        <RangePicker
                          size="small"
                          format="DD.MM.YYYY"
                          style={{ width: "100%" }}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={6}>
                      <Form.Item name="claimedPeriod" label="Дата претензии">
                        <RangePicker
                          size="small"
                          format="DD.MM.YYYY"
                          style={{ width: "100%" }}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={6}>
                      <Form.Item
                        name="acceptedPeriod"
                        label="Дата получения Застройщиком"
                      >
                        <RangePicker
                          size="small"
                          format="DD.MM.YYYY"
                          style={{ width: "100%" }}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={6}>
                      <Form.Item name="resolvedPeriod" label="Дата устранения">
                        <RangePicker
                          size="small"
                          format="DD.MM.YYYY"
                          style={{ width: "100%" }}
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={12} align="middle">
                    <Col span={12}>
                      <Form.Item
                        name="description"
                        label="Дополнительная информация"
                      >
                        <Input />
                      </Form.Item>
                    </Col>
                  </Row>
                </Collapse.Panel>
              </Collapse>
            </Col>
          </Row>

          <Row justify="end" gutter={12}>
            <Col>
              <Button onClick={handleReset}>Сброс</Button>
            </Col>
          </Row>
        </Form>
      )}
    </Card>
  );
}
