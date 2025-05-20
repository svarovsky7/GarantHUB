// -----------------------------------------------------------------------------
// Блок фильтров – Ant Design Form (без .subscribe, только onValuesChange)
// -----------------------------------------------------------------------------
import React, { useEffect } from 'react';
import {
    Form, DatePicker, Select, Input, Row, Col, Button,
} from 'antd';

const { RangePicker } = DatePicker;
const { Option } = Select;

export default function TicketsFilters({ options, onChange }) {
    const [form] = Form.useForm();

    /* передаём значения наверх при первом рендере */
    useEffect(() => {
        onChange(form.getFieldsValue());
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    /* вызов при каждом изменении формы */
    const handleValuesChange = (_, values) => {
        onChange(values);
    };

    const reset = () => {
        form.resetFields();
        onChange({});
    };

    return (
        <Form
            form={form}
            layout="vertical"
            onValuesChange={handleValuesChange}
            style={{ marginBottom: 24 }}
        >
            <Row gutter={16}>
                <Col xs={24} md={6}>
                    <Form.Item name="period" label="Период">
                        <RangePicker format="DD.MM.YYYY" style={{ width: '100%' }} />
                    </Form.Item>
                </Col>

                <Col xs={24} md={3}>
                    <Form.Item name="project" label="Проект">
                        <Select allowClear options={options.projects} />
                    </Form.Item>
                </Col>

                <Col xs={24} md={3}>
                    <Form.Item name="unit" label="Объект">
                        <Select allowClear options={options.units} />
                    </Form.Item>
                </Col>

                <Col xs={24} md={3}>
                    <Form.Item name="warranty" label="Гарантия">
                        <Select allowClear>
                            <Option value="yes">Да</Option>
                            <Option value="no">Нет</Option>
                        </Select>
                    </Form.Item>
                </Col>

                <Col xs={24} md={3}>
                    <Form.Item name="status" label="Статусы">
                        <Select allowClear options={options.statuses} />
                    </Form.Item>
                </Col>

                <Col xs={24} md={3}>
                    <Form.Item name="type" label="Тип замечания">
                        <Select allowClear options={options.types} />
                    </Form.Item>
                </Col>

                <Col xs={24} md={3}>
                    <Form.Item name="author" label="Кем добавлено">
                        <Select allowClear options={options.authors} />
                    </Form.Item>
                </Col>

                <Col xs={24} md={3}>
                    <Form.Item name="ticketId" label="Номер замечания">
                        <Input placeholder="ID" />
                    </Form.Item>
                </Col>

                <Col xs={24} md={3} style={{ display: 'flex', alignItems: 'flex-end' }}>
                    <Button onClick={reset} block>
                        Сброс
                    </Button>
                </Col>
            </Row>

            <Row gutter={16}>
                <Col xs={24} md={3}>
                    <Form.Item name="requestNo" label="№ заявки от Заказчика">
                        <Input />
                    </Form.Item>
                </Col>

                <Col xs={24} md={4}>
                    <Form.Item name="requestPeriod" label="Дата регистрации заявки">
                        <RangePicker format="DD.MM.YYYY" style={{ width: '100%' }} />
                    </Form.Item>
                </Col>

                <Col xs={24} md={3}>
                    <Form.Item name="days" label="Прошло дней с Даты получения">
                        <Input />
                    </Form.Item>
                </Col>

                <Col xs={24} md={4}>
                    <Form.Item name="responsible" label="Ответственный инженер">
                        <Select allowClear options={options.responsibleEngineers} />
                    </Form.Item>
                </Col>
            </Row>
        </Form>
    );
}
