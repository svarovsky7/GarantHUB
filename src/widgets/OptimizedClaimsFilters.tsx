import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useDebounce } from "@/shared/hooks/useDebounce";
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

// Мемоизируем опции селектов для предотвращения лишних ререндеров
const MemoizedSelect = React.memo<{ options: any; [key: string]: any }>(({ options, ...props }) => (
  <Select 
    allowClear 
    showSearch 
    filterOption={(input, option) =>
      String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())
    } 
    {...props} 
    options={options} 
  />
));

const MemoizedMultiSelect = React.memo<{ options: any; [key: string]: any }>(({ options, ...props }) => (
  <Select 
    mode="multiple" 
    allowClear 
    showSearch 
    maxTagCount="responsive" 
    filterOption={(input, option) =>
      String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())
    } 
    {...props} 
    options={options} 
  />
));

export default function OptimizedClaimsFilters({
  options,
  loading,
  initialValues = {},
  onSubmit,
  onReset,
}: Props) {
  const LS_HIDE_CLOSED = "claimsHideClosed";
  const [form] = Form.useForm();
  const [extraCount, setExtraCount] = useState(0);

  // Мемоизируем опции для предотвращения ререндеров селектов
  const memoizedOptions = useMemo(() => ({
    responsibleEngineers: options.responsibleEngineers || [],
    buildings: options.buildings || [],
    units: options.units || [],
    statuses: options.statuses || [],
    ids: options.ids || [],
    authors: options.authors || [],
    projects: options.projects || [],
  }), [options]);

  useEffect(() => {
    form.setFieldsValue(initialValues);
    calcExtra();
  }, [initialValues]);

  useEffect(() => {
    // Небольшая задержка для инициализации формы
    const timer = setTimeout(() => {
      try {
        const hideClosed = JSON.parse(
          localStorage.getItem(LS_HIDE_CLOSED) || "false",
        );
        form.setFieldValue("hideClosed", hideClosed);
      } catch {}
    }, 0);
    
    return () => clearTimeout(timer);
  }, [form]);

  const extraKeys: (keyof ClaimFilters)[] = useMemo(() => [
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
  ], []);

  const calcExtra = useCallback(() => {
    const vals = form.getFieldsValue();
    const count = extraKeys.reduce((acc, key) => {
      const v = vals[key];
      if (Array.isArray(v)) return acc + (v.length ? 1 : 0);
      if (v === undefined || v === null || v === "" || v === false) return acc;
      return acc + 1;
    }, 0);
    setExtraCount(count);
  }, [form, extraKeys]);

  // Дебаунсим изменения формы для снижения количества обновлений
  const [formValues, setFormValues] = useState<ClaimFilters>({});
  const debouncedFormValues = useDebounce(formValues, 500);
  
  // Автоматически применяем фильтры после дебаунса
  useEffect(() => {
    if (Object.keys(debouncedFormValues).length > 0) {
      onSubmit(debouncedFormValues);
    }
  }, [debouncedFormValues, onSubmit]);

  const handleFinish = useCallback((values: ClaimFilters) => {
    onSubmit(values);
    if (Object.prototype.hasOwnProperty.call(values, "hideClosed")) {
      try {
        localStorage.setItem(LS_HIDE_CLOSED, JSON.stringify(values.hideClosed));
      } catch {}
    }
  }, [onSubmit]);

  const handleValuesChange = useCallback((
    changed: Partial<ClaimFilters>,
    all: ClaimFilters,
  ) => {
    calcExtra();
    setFormValues(all);
    
    // Мгновенно применяем изменение hideClosed
    if (Object.prototype.hasOwnProperty.call(changed, "hideClosed")) {
      handleFinish(all);
    }
  }, [calcExtra, handleFinish]);

  const handleReset = useCallback(() => {
    form.resetFields();
    setExtraCount(0);
    try {
      localStorage.setItem(LS_HIDE_CLOSED, "false");
    } catch {}
    onReset();
  }, [form, onReset]);

  const badge = useMemo(() => <Badge count={extraCount} size="small" />, [extraCount]);

  if (loading) {
    return (
      <Card variant="borderless" size="small" style={{ maxWidth: 1040 }}>
        <Skeleton active paragraph={{ rows: 4 }} />
      </Card>
    );
  }

  return (
    <Card variant="borderless" size="small" style={{ maxWidth: 1040 }}>
      <Form
        form={form}
        layout="vertical"
        onValuesChange={handleValuesChange}
        onFinish={handleFinish}
        preserve={false}
      >
        <Row gutter={12}>
          <Col span={5}>
            <Form.Item
              name="responsible"
              label="Закрепленный инженер"
            >
              <MemoizedSelect
                options={memoizedOptions.responsibleEngineers}
              />
            </Form.Item>
          </Col>
          <Col span={5}>
            <Form.Item name="project" label="Проект">
              <MemoizedSelect 
                options={memoizedOptions.projects}
              />
            </Form.Item>
          </Col>
          <Col span={5}>
            <Form.Item name="units" label="Объекты">
              <MemoizedMultiSelect
                options={memoizedOptions.units}
              />
            </Form.Item>
          </Col>
          <Col span={5}>
            <Form.Item name="status" label="Статус">
              <MemoizedSelect 
                options={memoizedOptions.statuses}
              />
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
            <Collapse 
              ghost
              items={[{
                key: 'more',
                label: 'Доп. фильтры',
                extra: badge,
                children: (
                  <>
                    <Row gutter={12}>
                  <Col span={6}>
                    <Form.Item name="id" label="ID претензии">
                      <MemoizedMultiSelect
                        options={memoizedOptions.ids}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={6}>
                    <Form.Item name="claim_no" label="№ претензии">
                      <Input placeholder="Поиск по номеру..." />
                    </Form.Item>
                  </Col>
                  <Col span={6}>
                    <Form.Item name="author" label="Автор">
                      <MemoizedSelect 
                        options={memoizedOptions.authors}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={6}>
                    <Form.Item name="building" label="Корпус">
                      <MemoizedSelect 
                        options={memoizedOptions.buildings}
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
                        placeholder={["От", "До"]}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={6}>
                    <Form.Item name="claimedPeriod" label="Дата претензии">
                      <RangePicker
                        size="small"
                        format="DD.MM.YYYY"
                        style={{ width: "100%" }}
                        placeholder={["От", "До"]}
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
                        placeholder={["От", "До"]}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={6}>
                    <Form.Item name="resolvedPeriod" label="Дата устранения">
                      <RangePicker
                        size="small"
                        format="DD.MM.YYYY"
                        style={{ width: "100%" }}
                        placeholder={["От", "До"]}
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
                      <Input placeholder="Поиск в описании..." />
                    </Form.Item>
                  </Col>
                    </Row>
                  </>
                )
              }]}
            />
          </Col>
        </Row>

        <Row justify="end" gutter={12}>
          <Col>
            <Button onClick={handleReset}>Сброс</Button>
          </Col>
        </Row>
      </Form>
    </Card>
  );
}