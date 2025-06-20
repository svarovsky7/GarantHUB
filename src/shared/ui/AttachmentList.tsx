import React from 'react';
import { Typography } from 'antd';
import type { RemoteClaimFile } from '@/shared/types/claimFile';

interface Props {
  files: RemoteClaimFile[];
}

/** Список вложений с ссылками на скачивание */
export default function AttachmentList({ files }: Props) {
  if (!files.length) return null;
  return (
    <ul style={{ paddingLeft: 20 }}>
      {files.map((f) => {
        const name = f.original_name ?? f.path.split('/').pop() ?? 'file';
        return (
          <li key={f.id}>
            <Typography.Link href={f.url} target="_blank" rel="noopener noreferrer">
              {name}
            </Typography.Link>
          </li>
        );
      })}
    </ul>
  );
}
