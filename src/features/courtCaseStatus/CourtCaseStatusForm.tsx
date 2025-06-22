// src/features/courtCaseStatus/CourtCaseStatusForm.tsx
// -----------------------------------------------------------------------------
// Модальная форма добавления / редактирования стадии судебного дела
// -----------------------------------------------------------------------------

import React, { useState } from 'react';
import { Form, Input, Button, Space } from 'antd';

/**
 * Свойства формы стадии судебного дела.
 */
interface CourtCaseStatusFormProps {
    /** Начальные данные для редактирования */
    initialData?: { id?: number; name?: string; color?: string | null };
    /** Обработчик отправки формы */
    onSubmit: (values: { name: string; color: string }) => void;
    /** Закрытие формы без сохранения */
    onCancel: () => void;
}

/**
 * Форма создания или редактирования стадии судебного дела.
 */
export default function CourtCaseStatusForm({ initialData, onSubmit, onCancel }: CourtCaseStatusFormProps) {
    const [name, setName] = useState(initialData?.name ?? '');
    const [color, setColor] = useState(initialData?.color ?? '#1976d2');

    const handleSave = (e) => {
        e.preventDefault();
        if (!name.trim()) return;
        onSubmit({ name: name.trim(), color });
    };

    return (
        <Form onSubmitCapture={handleSave} layout="vertical" style={{ minWidth: 320 }}>
            <Form.Item label="Название" required>
                <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoFocus
                />
            </Form.Item>
            <Form.Item label="Цвет" required>
                <Input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    style={{ height: 48 }}
                />
            </Form.Item>
            <Form.Item>
                <Space>
                    <Button onClick={onCancel}>Отмена</Button>
                    <Button type="primary" htmlType="submit">
                        Сохранить
                    </Button>
                </Space>
            </Form.Item>
        </Form>
    );
}
