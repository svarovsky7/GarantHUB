import React from "react";
import dayjs from "dayjs";
import { Table, Typography, Button } from "antd";
import type { ColumnsType } from "antd/es/table";
import { DownOutlined, EyeOutlined, LinkOutlined } from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/shared/api/supabaseClient";
import { useDefectsWithNames } from "@/entities/defect";
import { useUnitsByIds } from "@/entities/unit";
import formatUnitShortName from "@/shared/utils/formatUnitShortName";
import ClaimViewModal from "@/features/claim/ClaimViewModal";
import DefectsCompactTable from "@/widgets/DefectsCompactTable";

interface ClaimRow {
  id: number;
  claim_no: string;
  claimed_on: string | null;
  statusName: string | null;
  unit_ids: number[];
  defect_ids: number[];
}

interface Props {
  projectId: number | null;
  unitIds: number[];
  value: number[];
  onChange: (ids: number[]) => void;
}

function ClaimDefects({ ids }: { ids: number[] }) {
  const { data = [], isPending } = useDefectsWithNames(ids);
  if (!ids.length) {
    return <Typography.Text type="secondary">Нет дефектов</Typography.Text>;
  }
  if (isPending) {
    return <Typography.Text>Загрузка...</Typography.Text>;
  }
  return <DefectsCompactTable defects={data} />;
}

export default function RelatedClaimsList({
  projectId,
  unitIds,
  value,
  onChange,
}: Props) {
  const { data: claims = [], isPending } = useQuery<ClaimRow[]>({
    queryKey: ["claims-for-case-list", projectId],
    enabled: !!projectId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("claims")
        .select(
          `id, claim_no, claimed_on, claim_status_id, statuses(name), claim_units(unit_id), claim_defects(defect_id)`,
        )
        .eq("project_id", projectId as number)
        .eq("pre_trial_claim", true);
      if (error) throw error;
      return (data ?? []).map((r: any) => ({
        id: r.id,
        claim_no: r.claim_no,
        claimed_on: r.claimed_on,
        statusName: r.statuses?.name ?? null,
        unit_ids: (r.claim_units ?? []).map((u: any) => u.unit_id),
        defect_ids: (r.claim_defects ?? []).map((d: any) => d.defect_id),
      }));
    },
  });

  const [viewId, setViewId] = React.useState<number | null>(null);

  const unitIdList = React.useMemo(
    () => Array.from(new Set(claims.flatMap((c) => c.unit_ids))),
    [claims],
  );
  const { data: units = [] } = useUnitsByIds(unitIdList);
  const unitMap = React.useMemo(() => {
    const map: Record<number, string> = {};
    units.forEach((u) => {
      map[u.id] = formatUnitShortName(u);
    });
    return map;
  }, [units]);

  const filtered = React.useMemo(
    () =>
      claims.filter(
        (c) =>
          unitIds.length === 0 || c.unit_ids.some((id) => unitIds.includes(id)),
      ),
    [claims, unitIds],
  );

  const dataWithUnits = React.useMemo(
    () =>
      filtered.map((c) => ({
        ...c,
        unitNames: c.unit_ids
          .map((id) => unitMap[id])
          .filter(Boolean)
          .join(", "),
      })),
    [filtered, unitMap],
  );

  const columns: ColumnsType<ClaimRow & { unitNames: string }> = [
    { title: "№ претензии", dataIndex: "claim_no", width: 120 },
    { title: "Объект", dataIndex: "unitNames", width: 160 },
    {
      title: "Дата претензии",
      dataIndex: "claimed_on",
      width: 120,
      render: (v: string | null) => (v ? dayjs(v).format("DD.MM.YYYY") : "—"),
    },
    {
      title: "Статус",
      dataIndex: "statusName",
      width: 160,
      render: (v: string | null) => v || "—",
    },
    {
      title: "Действия",
      dataIndex: "actions",
      width: 80,
      render: (_: unknown, row) => {
        const linked = value.includes(row.id);
        const toggle = () => {
          const ids = linked
            ? value.filter((id) => id !== row.id)
            : [...value, row.id];
          onChange(ids);
        };
        return (
          <>
            <Button
              size="small"
              type="text"
              disabled={!unitIds.length}
              icon={
                <LinkOutlined
                  style={
                    linked ? { color: "#52c41a", fontWeight: 700 } : undefined
                  }
                />
              }
              onClick={toggle}
            />
            <Button
              size="small"
              type="text"
              icon={<EyeOutlined />}
              onClick={() => setViewId(row.id)}
            />
          </>
        );
      },
    },
  ];

  return (
    <>
      <Table<ClaimRow & { unitNames: string }>
        rowKey="id"
        columns={columns}
        dataSource={dataWithUnits}
        loading={isPending}
        pagination={false}
        size="small"
        expandable={{
          columnWidth: 40,
          expandIcon: ({ expanded, onExpand, record }) => (
            <DownOutlined
              rotate={expanded ? 180 : 0}
              onClick={(e) => onExpand(record, e)}
              style={{ cursor: "pointer" }}
            />
          ),
          expandedRowRender: (row) => <ClaimDefects ids={row.defect_ids} />,
          rowExpandable: (row) => row.defect_ids.length > 0,
        }}
      />
      <ClaimViewModal
        open={viewId !== null}
        claimId={viewId}
        onClose={() => setViewId(null)}
      />
    </>
  );
}
