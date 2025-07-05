import React from 'react';
import { Select, Skeleton } from 'antd';
import { useClaimsSimpleAll } from '@/entities/claim';
import { useCaseClaimLinks, useLinkCaseClaims, useUnlinkCaseClaim } from '@/entities/caseClaimLink';

interface Props {
  caseId: number;
  projectId: number;
  unitIds: number[];
}

export default function CaseClaimsLinkSelect({ caseId, projectId, unitIds }: Props) {
  const { data: allClaims = [], isPending: claimsLoading } = useClaimsSimpleAll();
  const { data: links = [] } = useCaseClaimLinks(caseId);
  const link = useLinkCaseClaims();
  const unlink = useUnlinkCaseClaim();

  const selected = React.useMemo(() => links.map((l) => l.claim_id), [links]);

  const options = React.useMemo(
    () =>
      allClaims
        .filter((c) => c.project_id === projectId)
        .filter((c) => c.unit_ids.some((id) => unitIds.includes(id)))
        .map((c) => ({ value: c.id, label: `${c.id}` })),
    [allClaims, projectId, unitIds],
  );

  if (claimsLoading) {
    return <Skeleton active paragraph={{ rows: 2 }} />;
  }

  return (
    <div style={{ maxWidth: 600 }}>
      <div style={{ fontWeight: 500, marginBottom: 8 }}>Связанные претензии</div>
      <Select
        mode="multiple"
        style={{ width: '100%' }}
        value={selected}
        options={options}
        onSelect={(id) => link.mutate({ caseId, claimIds: [Number(id)] })}
        onDeselect={(id) => unlink.mutate({ caseId, claimId: Number(id) })}
      />
    </div>
  );
}
