// CHANGE: переезд из ticket → shared/ui; API без изменений
// -----------------------------------------------------------------------------
import React from 'react';
import {
    List, ListItem, ListItemIcon, ListItemText,
    IconButton, Tooltip,
} from '@mui/material';
import FileIcon from '@mui/icons-material/InsertDriveFileOutlined';
import DeleteIcon from '@mui/icons-material/DeleteOutline';
import DownloadIcon from '@mui/icons-material/DownloadOutlined';

export default function AttachmentPreviewList({
                                                  remoteFiles = [], newFiles = [],
                                                  onRemoveRemote, onRemoveNew, getSignedUrl,
                                              }) {
    const [cache, setCache] = React.useState({});

    const signed = async (id, path, name) => {
        if (cache[id]) return cache[id];
        const url = await getSignedUrl?.(path, name);
        if (url) setCache((p) => ({ ...p, [id]: url }));
        return url;
    };

    const objUrls = React.useMemo(
        () => newFiles.map((f) => URL.createObjectURL(f)),
        [newFiles],
    );
    React.useEffect(() => () => objUrls.forEach(URL.revokeObjectURL), [objUrls]);

    const forceDownload = async (id, path, name) => {
        const url = await signed(id, path, name);
        if (!url) return;
        const a = document.createElement('a');
        a.href = url;
        a.download = name;
        document.body.appendChild(a);
        a.click();
        a.remove();
    };

    if (!remoteFiles.length && !newFiles.length) return null;

    return (
        <List dense sx={{ mt: 1 }}>
            {remoteFiles.map((f) => (
                <ListItem
                    key={`r-${f.id}`}
                    secondaryAction={(
                        <>
                            <Tooltip title="Скачать">
                                <IconButton onClick={() => forceDownload(f.id, f.path, f.name)}>
                                    <DownloadIcon />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Удалить">
                                <IconButton onClick={() => onRemoveRemote?.(f.id)} sx={{ ml: 0.5 }}>
                                    <DeleteIcon />
                                </IconButton>
                            </Tooltip>
                        </>
                    )}
                >
                    <ListItemIcon><FileIcon /></ListItemIcon>
                    <ListItemText primary={f.name} />
                </ListItem>
            ))}

            {newFiles.map((f, i) => (
                <ListItem
                    key={`n-${i}`}
                    secondaryAction={(
                        <>
                            <Tooltip title="Скачать">
                                <IconButton component="a" href={objUrls[i]} download={f.name}>
                                    <DownloadIcon />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Удалить">
                                <IconButton onClick={() => onRemoveNew?.(i)} sx={{ ml: 0.5 }}>
                                    <DeleteIcon />
                                </IconButton>
                            </Tooltip>
                        </>
                    )}
                >
                    <ListItemIcon><FileIcon /></ListItemIcon>
                    <ListItemText
                        primary={f.name}
                        secondary={`${(f.size / 1024).toFixed(1)} KB`}
                    />
                </ListItem>
            ))}
        </List>
    );
}
