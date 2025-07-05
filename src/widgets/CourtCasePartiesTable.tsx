import React from "react";
import {
  Table,
  Form,
  Select,
  Button,
  Tooltip,
  Skeleton,
  Space,
  Popconfirm,
} from "antd";
import { PlusOutlined, DeleteOutlined, EditOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { usePersons } from "@/entities/person";
import { useContractors } from "@/entities/contractor";
import { useDeletePerson } from "@/entities/person";
import { useDeleteContractor } from "@/entities/contractor";
import PersonModalId from "@/features/person/PersonModalId";
import ContractorModalId from "@/features/contractor/ContractorModalId";
import type { CasePartyRole } from "@/shared/types/courtCaseParty";

interface Props {
  fields: { key: React.Key; name: number }[];
  add: (defaultValue?: any) => void;
  remove: (index: number) => void;
}

const ROLE_OPTIONS = [
  { value: "plaintiff", label: "Истец" },
  { value: "defendant", label: "Ответчик" },
];

export default function CourtCasePartiesTable({ fields, add, remove }: Props) {
  const { data: persons = [], isPending: loadingPersons } = usePersons();
  const { data: contractors = [], isPending: loadingContractors } =
    useContractors();
  const deletePerson = useDeletePerson();
  const deleteContractor = useDeleteContractor();
  const form = Form.useFormInstance();
  const [personModal, setPersonModal] = React.useState<{
    index: number;
    data?: any;
  } | null>(null);
  const [contractorModal, setContractorModal] = React.useState<{
    index: number;
    data?: any;
  } | null>(null);

  if (loadingPersons || loadingContractors) {
    return <Skeleton active paragraph={{ rows: 3 }} />;
  }

  const columns: ColumnsType<(typeof fields)[number]> = [
    {
      title: "Роль",
      dataIndex: "role",
      width: 120,
      render: (_: unknown, field) => (
        <Form.Item
          name={[field.name, "role"]}
          rules={[{ required: true }]}
          noStyle
        >
          <Select
            options={ROLE_OPTIONS}
            style={{ width: "100%" }}
            onChange={(val: CasePartyRole) => {
              form.setFieldValue(
                ["parties", field.name, "type"],
                val === "plaintiff" ? "person" : "contractor",
              );
              form.setFieldValue(["parties", field.name, "entityId"], null);
            }}
          />
        </Form.Item>
      ),
    },
    {
      title: "Тип",
      dataIndex: "type",
      width: 120,
      render: (_: unknown, field) => (
        <Form.Item
          name={[field.name, "type"]}
          rules={[{ required: true }]}
          noStyle
        >
          <Select
            options={[
              { value: "person", label: "Физлицо" },
              { value: "contractor", label: "Контрагент" },
            ]}
            style={{ width: "100%" }}
            onChange={() =>
              form.setFieldValue(["parties", field.name, "entityId"], null)
            }
          />
        </Form.Item>
      ),
    },
    {
      title: "Сторона",
      dataIndex: "entity",
      render: (_: unknown, field) => (
        <Form.Item
          noStyle
          shouldUpdate={(prev, curr) =>
            prev.parties?.[field.name]?.type !==
              curr.parties?.[field.name]?.type ||
            prev.parties?.[field.name]?.entityId !==
              curr.parties?.[field.name]?.entityId
          }
        >
          {() => {
            const type: "person" | "contractor" = form.getFieldValue([
              "parties",
              field.name,
              "type",
            ]);
            const entityId = form.getFieldValue([
              "parties",
              field.name,
              "entityId",
            ]);
            const options =
              type === "contractor"
                ? contractors.map((c) => ({ value: c.id, label: c.name }))
                : persons.map((p) => ({ value: p.id, label: p.full_name }));
            const selectedPerson =
              type === "person" && entityId
                ? persons.find((p) => p.id === entityId)
                : null;
            const selectedContractor =
              type === "contractor" && entityId
                ? contractors.find((c) => c.id === entityId)
                : null;
            return (
              <>
                <Space.Compact style={{ width: "100%" }}>
                  <Form.Item
                    name={[field.name, "entityId"]}
                    rules={[{ required: true }]}
                    noStyle
                  >
                  <Select
                    allowClear
                    showSearch
                    style={{ width: "100%" }}
                    options={options}
                    filterOption={(input, option) =>
                      String(option?.label ?? "")
                        .toLowerCase()
                        .includes(input.toLowerCase())
                    }
                  />
                </Form.Item>
                <Button
                  icon={<PlusOutlined />}
                  onClick={() =>
                    type === "person"
                      ? setPersonModal({ index: field.name })
                      : setContractorModal({ index: field.name })
                  }
                />
                <Button
                  icon={<EditOutlined />}
                  disabled={!entityId}
                  onClick={() => {
                    const data =
                      type === "person"
                        ? persons.find((p) => p.id === entityId)
                        : contractors.find((c) => c.id === entityId);
                    if (data) {
                      type === "person"
                        ? setPersonModal({ index: field.name, data })
                        : setContractorModal({ index: field.name, data });
                    }
                  }}
                />
                <Popconfirm
                  title="Удалить?"
                  okText="Да"
                  cancelText="Нет"
                  onConfirm={() => {
                    if (!entityId) return;
                    if (type === "person") {
                      deletePerson.mutate(entityId);
                    } else {
                      deleteContractor.mutate(entityId);
                    }
                    form.setFieldValue(
                      ["parties", field.name, "entityId"],
                      null,
                    );
                  }}
                >
                  <Button
                    danger
                    icon={<DeleteOutlined />}
                    disabled={!entityId}
                  />
                </Popconfirm>
                </Space.Compact>
                {selectedPerson && (
                  <div style={{ fontSize: 12, color: "#888" }}>
                    {selectedPerson.passport_series} {selectedPerson.passport_number}
                    {selectedPerson.phone ? `, ${selectedPerson.phone}` : ""}
                    {selectedPerson.email ? `, ${selectedPerson.email}` : ""}
                  </div>
                )}
                {selectedContractor?.inn && (
                  <div style={{ fontSize: 12, color: "#888" }}>ИНН {selectedContractor.inn}</div>
                )}
              </>
            );
          }}
        </Form.Item>
      ),
    },
    {
      title: "",
      dataIndex: "actions",
      width: 60,
      render: (_: unknown, field) => (
        <Tooltip title="Удалить запись">
          <Button
            size="small"
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => remove(field.name)}
          />
        </Tooltip>
      ),
    },
  ];

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 8,
        }}
      >
        <span style={{ fontWeight: 500 }}>Стороны дела</span>
        <Button type="dashed" icon={<PlusOutlined />} onClick={() => add({})}>
          Добавить сторону
        </Button>
      </div>
      <Table
        size="small"
        pagination={false}
        rowKey="key"
        columns={columns}
        dataSource={fields}
      />
      {personModal && (
        <PersonModalId
          open
          onClose={() => setPersonModal(null)}
          onSelect={(id) =>
            form.setFieldValue(["parties", personModal.index, "entityId"], id)
          }
          initialData={personModal.data}
        />
      )}
      {contractorModal && (
        <ContractorModalId
          open
          onClose={() => setContractorModal(null)}
          onSelect={(id) =>
            form.setFieldValue(
              ["parties", contractorModal.index, "entityId"],
              id,
            )
          }
          initialData={contractorModal.data}
        />
      )}
    </div>
  );
}
