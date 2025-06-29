import React from 'react';
import dayjs from 'dayjs';
import { Table, Button, Space, Tooltip, Input } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
    FileOutlined,
    DeleteOutlined,
    DownloadOutlined,
} from '@ant-design/icons';

// Типы лучше хранить в "@/shared/types", но оставляю здесь
// для цельного примера. Можно вынести при рефакторинге.
interface RemoteFile {
    id: string;
    name: string;
    path: string;
    /** MIME‑тип файла */
    mime?: string;
    description?: string;
    /** Размер файла в байтах */
    size?: number | null;
    /** Идентификатор связанной сущности */
    entityId?: number;
    /** Дата создания файла */
    createdAt?: string | null;
    /** Имя автора создания */
    createdByName?: string | null;
}

interface NewFile {
    file: File;
    mime?: string;
    description?: string;
    /** Размер файла в байтах */
    size?: number;
}

interface Props {
    remoteFiles?: RemoteFile[];
    newFiles?: NewFile[];
    onRemoveRemote?: (id: string) => void;
    onRemoveNew?: (idx: number) => void;
    onDescRemote?: (id: string, d: string) => void;
    onDescNew?: (idx: number, d: string) => void;
    getSignedUrl?: (path: string, name: string) => Promise<string>;
    /** Показывать колонку MIME */
    showMime?: boolean;
    /** Показывать поле подробностей */
    showDetails?: boolean;
    /** Показывать колонку ссылки */
    showLink?: boolean;
    /** Получить ссылку для просмотра сущности */
    getLink?: (file: RemoteFile) => string | undefined;
    /** Текст ссылки */
    getLinkLabel?: (file: RemoteFile) => React.ReactNode;
    /** Обработчик клика по ссылке. Если указан, getLink не используется */
    onOpenLink?: (file: RemoteFile) => void;
    /** Показывать размер файла */
    showSize?: boolean;
    /** Карта изменённых описаний по id */
    changedMap?: Record<string, boolean>;
    /** Показывать заголовок таблицы */
    showHeader?: boolean;
    /** Показывать дату создания */
    showCreatedAt?: boolean;
    /** Показывать автора создания */
    showCreatedBy?: boolean;
}

/**
 * Таблица редактирования вложений.
 * Исправлено выпадание строки за пределы формы.
 */
export default function AttachmentEditorTable({
  remoteFiles = [],
  newFiles = [],
  onRemoveRemote,
  onRemoveNew,
  onDescRemote,
  onDescNew,
  getSignedUrl,
  showMime = true,
  showDetails = false,
  showLink = false,
  getLink,
  getLinkLabel,
  onOpenLink,
  showSize = false,
  changedMap,
  showHeader = false,
  showCreatedAt = false,
  showCreatedBy = false,
}: Props) {
    const [cache, setCache] = React.useState<Record<string, string>>({});

    /** Вернуть подписанную ссылку и закэшировать по id */
    const signed = async (path: string, name: string, id: string) => {
        if (cache[id]) return cache[id];
        const url = await getSignedUrl?.(path, name);
        if (url) setCache((p) => ({ ...p, [id]: url }));
        return url;
    };

    /** ObjectURL'ы для локально выбранных файлов */
    const objUrls = React.useMemo(() => newFiles.map((f) => URL.createObjectURL(f.file)), [newFiles]);
    React.useEffect(() => () => objUrls.forEach(URL.revokeObjectURL), [objUrls]);

    /** Принудительная загрузка удалённого файла */
    const forceDownload = async (f: RemoteFile) => {
        const url = await signed(f.path, f.name, f.id);
        if (!url) return;
        const a = document.createElement('a');
        a.href = url;
        a.download = f.name;
        document.body.appendChild(a);
        a.click();
        a.remove();
    };

    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 Б';
        const units = ['Б', 'КБ', 'МБ', 'ГБ'];
        let i = 0;
        let b = bytes;
        while (b >= 1024 && i < units.length - 1) {
            b /= 1024;
            i++;
        }
        return `${b.toFixed(1)} ${units[i]}`;
    };

    if (!remoteFiles.length && !newFiles.length) return null;

    /** Унифицированная строка таблицы */
    interface Row {
        key: string;
        id?: string;
        name: string;
        mime?: string;
        file?: File;
        path?: string;
        description?: string;
        size?: number | null;
        entityId?: number;
        createdAt?: string | null;
        createdByName?: string | null;
        isRemote: boolean;
    }

    const data: Row[] = [
        ...remoteFiles.map<Row>((f) => ({
            key: `r-${f.id}`,
            id: f.id,
            name: f.name,
            mime: f.mime,
            path: f.path,
            description: f.description,
            size: f.size ?? null,
            entityId: f.entityId,
            createdAt: f.createdAt ?? null,
            createdByName: f.createdByName ?? null,
            isRemote: true,
        })),
        ...newFiles.map<Row>((f, i) => ({
            key: `n-${i}`,
            name: f.file.name,
            mime: f.mime,
            file: f.file,
            description: f.description,
            size: f.size ?? f.file.size,
            isRemote: false,
        })),
    ];

    const columns: ColumnsType<Row> = [
        {
            dataIndex: 'icon',
            width: 32,
            render: () => <FileOutlined />,
        },
        {
            title: 'Название',
            dataIndex: 'name',
            width: 200,
            ellipsis: true,
        },
        ...(showSize
            ? [
                {
                    title: 'Размер',
                    dataIndex: 'size',
                    width: 100,
                    render: (v: number | null) =>
                        v != null ? formatSize(v) : '',
                } as ColumnsType<Row>[number]
            ]
            : []),
        ...(showMime
            ? [
                {
                    title: 'MIME',
                    dataIndex: 'mime',
                    width: 160,
                    ellipsis: true,
                } as ColumnsType<Row>[number],
            ]
            : []),
        ...(showDetails
            ? [
                {
                    title: 'Подробности',
                    dataIndex: 'details',
                    width: 200,
                    render: (_: unknown, row) => (
                        <Input
                            placeholder="Описание"
                            size="small"
                            value={row.description}
                            style={{ width: '100%' }}
                            className={row.isRemote && row.id && changedMap?.[row.id] ? 'changed-field' : undefined}
                            onChange={(e) => {
                                const val = e.target.value;
                                if (row.isRemote && row.id) onDescRemote?.(row.id, val);
                                else if (!row.isRemote) onDescNew?.(Number(row.key.split('-')[1]), val);
                            }}
                        />
                    ),
                } as ColumnsType<Row>[number],
            ]
            : []),
        ...(showCreatedAt
            ? [
                {
                    title: 'Создан',
                    dataIndex: 'createdAt',
                    width: 160,
                    render: (v: string | null) =>
                        v ? dayjs(v).format('DD.MM.YYYY HH:mm') : '—',
                } as ColumnsType<Row>[number]
            ]
            : []),
        ...(showCreatedBy
            ? [
                {
                    title: 'Автор',
                    dataIndex: 'createdByName',
                    width: 160,
                    render: (v: string | null) => v || '—',
                } as ColumnsType<Row>[number]
            ]
            : []),
        ...(showLink
            ? [
                {
                    title: 'Ссылка',
                    dataIndex: 'link',
                    width: 120,
                    render: (_: unknown, row) => {
                        if (!row.isRemote || !row.id) return null;
                        const file = {
                            id: row.id,
                            name: row.name,
                            path: row.path ?? '',
                            mime: row.mime,
                            entityId: row.entityId,
                        } as RemoteFile;
                        const label = getLinkLabel ? getLinkLabel(file) : 'Открыть';
                        if (onOpenLink) {
                            return (
                                <a
                                    href="#"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        onOpenLink(file);
                                    }}
                                >
                                    {label}
                                </a>
                            );
                        }
                        if (getLink) {
                            const url = getLink(file);
                            return url ? (
                                <a href={url} target="_blank" rel="noopener noreferrer">
                                    {label}
                                </a>
                            ) : null;
                        }
                        return null;
                        return null;
                    },
                } as ColumnsType<Row>[number],
            ]
            : []),
        {
            title: 'Действия',
            dataIndex: 'actions',
            width: 100,
            render: (_: unknown, row) => {
                const idx = row.isRemote ? null : Number(row.key.split('-')[1]);
                return (
                    <Space>
                        <Tooltip title="Скачать">
                            {row.isRemote ? (
                                <Button
                                    type="text"
                                    size="small"
                                    icon={<DownloadOutlined />}
                                    onClick={() =>
                                        row.id &&
                                        row.path &&
                                        forceDownload({
                                            id: row.id,
                                            name: row.name,
                                            path: row.path,
                                            mime: row.mime,
                                        })
                                    }
                                />
                            ) : (
                                <Button
                                    type="text"
                                    size="small"
                                    icon={<DownloadOutlined />}
                                    href={objUrls[idx as number]}
                                    download={row.name}
                                />
                            )}
                        </Tooltip>
                        <Tooltip title="Удалить">
                            <Button
                                type="text"
                                size="small"
                                danger
                                icon={<DeleteOutlined />}
                                onClick={() => {
                                    if (row.isRemote && row.id) onRemoveRemote?.(row.id);
                                    else onRemoveNew?.(idx as number);
                                }}
                            />
                        </Tooltip>
                    </Space>
                );
            },
        },
    ];

    return (
        <Table
            rowKey="key"
            size="small"
            pagination={false}
            columns={columns}
            dataSource={data}
            rowClassName={(row) => (!row.isRemote ? 'new-row' : '')}
            showHeader={showHeader}
            tableLayout="fixed"
            style={{ width: '100%', overflowX: 'hidden' }}
        />
    );
}
