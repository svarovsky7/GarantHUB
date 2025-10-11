import React from 'react';
import { Form, Select, Row, Col } from 'antd';
import type { FormInstance } from 'antd';

const { Option } = Select;

interface Project {
  id: number;
  name: string;
}

interface Engineer {
  id: string;
  name: string;
}

interface CallAssignmentProps {
  form: FormInstance;
  projects: Project[];
  engineers: Engineer[];
  onProjectChange: (projectId: number) => void;
}

/**
 * Assignment section - project and engineer selection
 */
const CallAssignment: React.FC<CallAssignmentProps> = ({
  form,
  projects,
  engineers,
  onProjectChange,
}) => {
  const handleProjectChange = (value: number) => {
    console.log('[EngineerCall] Project changed to:', value);
    const allValuesBefore = form.getFieldsValue();
    console.log('[EngineerCall] Form values BEFORE project change:', allValuesBefore);

    onProjectChange(value);

    // Preserve current date/time/status values
    const currentValues = form.getFieldsValue([
      'date',
      'startTime',
      'endTime',
      'title',
      'description',
      'status',
      'engineer_id',
    ]);
    console.log('[EngineerCall] Preserved values:', currentValues);

    form.setFieldsValue({
      ...currentValues,
      unit_id: null,
      claim_id: null,
    });

    const allValuesAfter = form.getFieldsValue();
    console.log('[EngineerCall] Form values AFTER project change:', allValuesAfter);
  };

  return (
    <Row gutter={16}>
      <Col xs={24} md={12}>
        <Form.Item
          name="project_id"
          label="Проект"
          rules={[{ required: true, message: 'Выберите проект' }]}
        >
          <Select
            placeholder="Выберите проект"
            onChange={handleProjectChange}
            showSearch
            optionFilterProp="children"
          >
            {projects.map((project) => (
              <Option key={project.id} value={project.id}>
                {project.name}
              </Option>
            ))}
          </Select>
        </Form.Item>
      </Col>
      <Col xs={24} md={12}>
        <Form.Item name="engineer_id" label="Инженер">
          <Select
            placeholder="Выберите инженера"
            showSearch
            optionFilterProp="children"
            allowClear
          >
            {engineers.map((engineer) => (
              <Option key={engineer.id} value={engineer.id}>
                {engineer.name}
              </Option>
            ))}
          </Select>
        </Form.Item>
      </Col>
    </Row>
  );
};

export default CallAssignment;
