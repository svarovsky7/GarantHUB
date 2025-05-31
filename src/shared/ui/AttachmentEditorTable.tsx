import React from 'react';
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  IconButton,
  Tooltip,
  Select,
  MenuItem,
} from '@mui/material';
import FileIcon from '@mui/icons-material/InsertDriveFileOutlined';
import DeleteIcon from '@mui/icons-material/DeleteOutline';
import DownloadIcon from '@mui/icons-material/DownloadOutlined';

interface Option { id: number | string; name: string; }

interface RemoteFile {
  id: string;
  name: string;
  path: string;
  typeId: number | null;
  /** Имя типа из attachments_types */
  typeName?: string;
  /** MIME-тип файла */
  mime?: string;
}

interface NewFile {
  file: File;
  typeId: number | null;
  mime?: string;
}

interface Props {
  remoteFiles?: RemoteFile[];
  newFiles?: NewFile[];
  attachmentTypes: Option[];
  onRemoveRemote?: (id: string) => void;
  onRemoveNew?: (idx: number) => void;
  onChangeRemoteType?: (id: string, type: number | null) => void;
  onChangeNewType?: (idx: number, type: number | null) => void;
  getSignedUrl?: (path: string, name: string) => Promise<string>;
}

/**
 * Таблица редактирования вложений.
 */
export default function AttachmentEditorTable({
  remoteFiles = [],
  newFiles = [],
  attachmentTypes,
  onRemoveRemote,
  onRemoveNew,
  onChangeRemoteType,
  onChangeNewType,
  getSignedUrl,
}: Props) {
  const [cache, setCache] = React.useState<Record<string, string>>({});

  const signed = async (path: string, name: string, id: string) => {
    if (cache[id]) return cache[id];
    const url = await getSignedUrl?.(path, name);
    if (url) setCache((p) => ({ ...p, [id]: url }));
    return url;
  };

  const objUrls = React.useMemo(() => newFiles.map((f) => URL.createObjectURL(f.file)), [newFiles]);
  React.useEffect(() => () => objUrls.forEach(URL.revokeObjectURL), [objUrls]);

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

  if (!remoteFiles.length && !newFiles.length) return null;

  return (
    <Table size="small" sx={{ mt: 1 }}>
      <TableHead>
        <TableRow>
          <TableCell width={32}></TableCell>
          <TableCell>Название</TableCell>
          <TableCell>Тип</TableCell>
          <TableCell align="right">Действия</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {remoteFiles.map((f) => (
          <TableRow key={`r-${f.id}`}>
            <TableCell>
              <FileIcon />
            </TableCell>
            <TableCell>{f.name}</TableCell>
            <TableCell>
              <Select
                size="small"
                value={f.typeId ?? ''}
                onChange={(e) =>
                  onChangeRemoteType?.(
                    f.id,
                    e.target.value ? Number(e.target.value) : null,
                  )
                }
                displayEmpty
                sx={{ minWidth: 120 }}
              >
                <MenuItem value="">
                  <em>Тип не указан</em>
                </MenuItem>
                {attachmentTypes.map((t) => (
                  <MenuItem key={t.id} value={t.id}>
                    {t.name}
                  </MenuItem>
                ))}
              </Select>
              {!onChangeRemoteType && (
                f.typeName ? (
                  <span style={{ marginLeft: 8, fontSize: '0.8em' }}>{f.typeName}</span>
                ) : (
                  f.mime && (
                    <span style={{ marginLeft: 8, fontSize: '0.8em' }}>{f.mime}</span>
                  )
                )
              )}
            </TableCell>
            <TableCell align="right">
              <Tooltip title="Скачать">
                <IconButton onClick={() => forceDownload(f)}>
                  <DownloadIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Удалить">
                <IconButton onClick={() => onRemoveRemote?.(f.id)} sx={{ ml: 0.5 }}>
                  <DeleteIcon />
                </IconButton>
              </Tooltip>
            </TableCell>
          </TableRow>
        ))}
        {newFiles.map((f, i) => (
          <TableRow key={`n-${i}`}>
            <TableCell>
              <FileIcon />
            </TableCell>
            <TableCell>{f.file.name}</TableCell>
            <TableCell>
              <Select
                size="small"
                value={f.typeId ?? ''}
                onChange={(e) =>
                  onChangeNewType?.(
                    i,
                    e.target.value ? Number(e.target.value) : null,
                  )
                }
                displayEmpty
                sx={{ minWidth: 120 }}
              >
                <MenuItem value="">
                  <em>Тип не указан</em>
                </MenuItem>
                {attachmentTypes.map((t) => (
                  <MenuItem key={t.id} value={t.id}>
                    {t.name}
                  </MenuItem>
                ))}
              </Select>
              {!onChangeNewType &&
                f.mime && (
                  <span style={{ marginLeft: 8, fontSize: '0.8em' }}>{f.mime}</span>
                )}
            </TableCell>
            <TableCell align="right">
              <Tooltip title="Скачать">
                <IconButton component="a" href={objUrls[i]} download={f.file.name}>
                  <DownloadIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Удалить">
                <IconButton onClick={() => onRemoveNew?.(i)} sx={{ ml: 0.5 }}>
                  <DeleteIcon />
                </IconButton>
              </Tooltip>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
