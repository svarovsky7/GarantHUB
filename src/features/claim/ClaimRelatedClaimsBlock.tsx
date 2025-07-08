import React from "react";
import { Table, Typography, Button } from "antd";
import type { ColumnsType } from "antd/es/table";
import { EyeOutlined } from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/shared/api/supabaseClient";
import { useClaimLinks } from "@/entities/claim";
import ClaimViewModal from "./ClaimViewModal";

interface Props {
  claimId: number;
}

interface Row {
  id: number;
  claim_no: string;
}

/**
 * Таблица связанных претензий для просмотра претензии.
 */
export default function ClaimRelatedClaimsBlock({ claimId }: Props) {
  const { data: links = [] } = useClaimLinks();
  const relatedIds = React.useMemo(() => {
    const child = links
      .filter((l) => l.parent_id === String(claimId))
      .map((l) => l.child_id);
    const parent = links.find((l) => l.child_id === String(claimId))?.parent_id;
    return Array.from(new Set([...(parent ? [parent] : []), ...child]));
  }, [links, claimId]);

  const { data = [] } = useQuery<Row[]>({
    queryKey: ["claim-related", relatedIds.join(",")],
    enabled: relatedIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("claims")
        .select("id, claim_no")
        .in("id", relatedIds.map(Number));
      if (error) throw error;
      return (data ?? []) as Row[];
    },
  });

  const [viewId, setViewId] = React.useState<number | null>(null);

  if (!relatedIds.length) {
    return <Typography.Text>Нет связанных претензий</Typography.Text>;
  }

  const columns: ColumnsType<Row> = [
    { title: "ID", dataIndex: "id", width: 80 },
    { title: "№ претензии", dataIndex: "claim_no", width: 160 },
    {
      title: "Действия",
      dataIndex: "actions",
      width: 80,
      render: (_: unknown, row) => (
        <Button
          size="small"
          type="text"
          icon={<EyeOutlined />}
          onClick={() => setViewId(row.id)}
        />
      ),
    },
  ];

  return (
    <>
      <Table<Row>
        rowKey="id"
        columns={columns}
        dataSource={data}
        pagination={false}
        size="small"
      />
      <ClaimViewModal
        open={viewId !== null}
        claimId={viewId}
        onClose={() => setViewId(null)}
      />
    </>
  );
}
