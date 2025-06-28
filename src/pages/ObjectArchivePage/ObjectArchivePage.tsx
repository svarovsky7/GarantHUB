import React from 'react';
import { ConfigProvider, Typography, Divider, Skeleton } from 'antd';
import ruRU from 'antd/locale/ru_RU';
import { useSearchParams } from 'react-router-dom';
import AttachmentEditorTable from '@/shared/ui/AttachmentEditorTable';
import { useUnitArchive } from '@/entities/unitArchive';

export default function ObjectArchivePage() {
  const [params] = useSearchParams();
  const unitId = Number(params.get('unit_id'));
  const { data, isLoading } = useUnitArchive(Number.isNaN(unitId) ? undefined : unitId);

  return (
    <ConfigProvider locale={ruRU}>
      <Typography.Title level={3}>Архив документации</Typography.Title>
      {isLoading && <Skeleton active />} 
      {!isLoading && (
        <>
          <Typography.Title level={4}>Документы по объекту</Typography.Title>
          <AttachmentEditorTable remoteFiles={data?.officialDocs} showMime={false} />
          <Divider />
          <Typography.Title level={4}>Документы по дефектам</Typography.Title>
          <AttachmentEditorTable remoteFiles={data?.defectDocs} showMime={false} />
          <Divider />
          <Typography.Title level={4}>Судебные материалы</Typography.Title>
          <AttachmentEditorTable remoteFiles={data?.courtDocs} showMime={false} />
          <Divider />
          <Typography.Title level={4}>Чертежи и исполнительная документация</Typography.Title>
          <AttachmentEditorTable remoteFiles={data?.drawings} showMime={false} />
        </>
      )}
    </ConfigProvider>
  );
}
