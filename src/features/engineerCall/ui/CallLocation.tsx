import React from 'react';
import { Form, Select, Button, Row, Col } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import type { FormInstance } from 'antd';

const { Option } = Select;

interface Building {
  id: string;
  name: string;
  project_id: number;
}

interface Unit {
  id: number;
  name: string;
  building: string;
  project_id: number;
}

interface Claim {
  id: number;
  claim_no: string;
  project_id: number;
  unit_ids: number[];
}

interface CallLocationProps {
  form: FormInstance;
  selectedProject: number | null;
  selectedBuilding: string | null;
  buildings: Building[];
  filteredUnits: Unit[];
  filteredClaims: Claim[];
  selectedUnit: number | null;
  unitsLoading: boolean;
  claimsLoading: boolean;
  onBuildingChange: (building: string | null) => void;
  onUnitChange: (unitId: number | null) => void;
  onViewClaim: (claimId: number) => void;
}

/**
 * Location section - building, unit, and claim selection
 */
const CallLocation: React.FC<CallLocationProps> = ({
  form,
  selectedProject,
  selectedBuilding,
  buildings,
  filteredUnits,
  filteredClaims,
  selectedUnit,
  unitsLoading,
  claimsLoading,
  onBuildingChange,
  onUnitChange,
  onViewClaim,
}) => {
  const handleBuildingChange = (value: string | null) => {
    console.log('[EngineerCall] Building changed to:', value);
    const allValuesBefore = form.getFieldsValue();
    console.log('[EngineerCall] Form values BEFORE building change:', allValuesBefore);

    onBuildingChange(value);

    // Preserve current date/time/status values
    const currentValues = form.getFieldsValue([
      'date',
      'startTime',
      'endTime',
      'title',
      'description',
      'status',
      'engineer_id',
      'project_id',
    ]);
    console.log('[EngineerCall] Preserved values:', currentValues);

    form.setFieldsValue({
      ...currentValues,
      unit_id: null,
      claim_id: null,
    });

    const allValuesAfter = form.getFieldsValue();
    console.log('[EngineerCall] Form values AFTER building change:', allValuesAfter);
  };

  const handleUnitChange = (value: number | null) => {
    console.log('[EngineerCall] Unit changed to:', value);
    const allValuesBefore = form.getFieldsValue();
    console.log('[EngineerCall] Form values BEFORE unit change:', allValuesBefore);

    onUnitChange(value);

    // Preserve current date/time/status values
    const currentValues = form.getFieldsValue([
      'date',
      'startTime',
      'endTime',
      'title',
      'description',
      'status',
      'engineer_id',
      'project_id',
    ]);
    console.log('[EngineerCall] Preserved values:', currentValues);

    form.setFieldsValue({
      ...currentValues,
      claim_id: null,
    });

    const allValuesAfter = form.getFieldsValue();
    console.log('[EngineerCall] Form values AFTER unit change:', allValuesAfter);
  };

  return (
    <Row gutter={16}>
      <Col xs={24} md={8}>
        <Form.Item label="Корпус">
          <Select
            placeholder={!selectedProject ? 'Сначала проект' : 'Корпус'}
            showSearch
            optionFilterProp="children"
            allowClear
            disabled={!selectedProject || unitsLoading}
            loading={unitsLoading}
            value={selectedBuilding}
            onChange={handleBuildingChange}
          >
            {buildings.map((building) => (
              <Option key={building.id} value={building.id}>
                {building.name}
              </Option>
            ))}
          </Select>
        </Form.Item>
      </Col>
      <Col xs={24} md={8}>
        <Form.Item name="unit_id" label="Квартира">
          <Select
            placeholder={!selectedProject ? 'Сначала проект' : 'Квартира'}
            showSearch
            optionFilterProp="children"
            allowClear
            disabled={!selectedProject || unitsLoading}
            loading={unitsLoading}
            onChange={handleUnitChange}
          >
            {filteredUnits.map((unit) => (
              <Option key={unit.id} value={unit.id}>
                {unit.name}
              </Option>
            ))}
          </Select>
        </Form.Item>
      </Col>
      <Col xs={24} md={8}>
        <Form.Item label="Претензия">
          <div style={{ display: 'flex', gap: '8px', alignItems: 'start', flexDirection: 'column' }}>
            <Form.Item name="claim_id" noStyle style={{ width: '100%' }}>
              <Select
                style={{ width: '100%' }}
                placeholder={!selectedUnit ? 'Сначала квартиру' : 'Претензия'}
                showSearch
                optionFilterProp="children"
                allowClear
                disabled={!selectedUnit || claimsLoading}
                loading={claimsLoading}
              >
                {filteredClaims.map((claim) => (
                  <Option key={claim.id} value={claim.id}>
                    {claim.claim_no || `ID: ${claim.id}`}
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item
              shouldUpdate={(prevValues, currentValues) => prevValues.claim_id !== currentValues.claim_id}
              noStyle
            >
              {({ getFieldValue }) =>
                getFieldValue('claim_id') ? (
                  <Button
                    type="primary"
                    ghost
                    size="small"
                    icon={<EyeOutlined />}
                    onClick={() => {
                      const claimId = getFieldValue('claim_id');
                      if (claimId) {
                        onViewClaim(claimId);
                      }
                    }}
                    style={{
                      marginTop: '4px',
                      borderRadius: '6px',
                    }}
                  >
                    Открыть претензию
                  </Button>
                ) : null
              }
            </Form.Item>
          </div>
        </Form.Item>
      </Col>
    </Row>
  );
};

export default CallLocation;
