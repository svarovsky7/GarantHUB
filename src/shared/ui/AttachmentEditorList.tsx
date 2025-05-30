import React from 'react';
import {
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
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
}

interface NewFile {
  file: File;
  typeId: number | null;
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

export default function AttachmentEditorList({
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

  const objUrls = React.useMemo(
    () => newFiles.map((f) => URL.createObjectURL(f.file)),
    [newFiles],
  );
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
    <List dense sx={{ mt: 1 }}>
      {remoteFiles.map((f) => (
        <ListItem key={`r-${f.id}`}>
          <ListItemIcon>
            <FileIcon />
          </ListItemIcon>
          <ListItemText primary={f.name} />
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
            sx={{ mr: 1, minWidth: 120 }}
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
        </ListItem>
      ))}
      {newFiles.map((f, i) => (
        <ListItem key={`n-${i}`}>
          <ListItemIcon>
            <FileIcon />
          </ListItemIcon>
          <ListItemText
            primary={f.file.name}
            secondary={`${(f.file.size / 1024).toFixed(1)} KB`}
          />
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
            sx={{ mr: 1, minWidth: 120 }}
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
        </ListItem>
      ))}
    </List>
  );
}
