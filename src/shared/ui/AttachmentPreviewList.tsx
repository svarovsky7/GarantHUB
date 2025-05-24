// CHANGE: переезд из ticket → shared/ui; API без изменений
// -----------------------------------------------------------------------------
import React from "react";
import {
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Tooltip,
} from "@mui/material";
import FileIcon from "@mui/icons-material/InsertDriveFileOutlined";
import DeleteIcon from "@mui/icons-material/DeleteOutline";
import DownloadIcon from "@mui/icons-material/DownloadOutlined";

export default function AttachmentPreviewList({
  remoteFiles = [],
  newFiles = [],
  onRemoveRemote,
  onRemoveNew,
  getSignedUrl,
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
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  if (!remoteFiles.length && !newFiles.length) return null;

  return (
    <List dense sx={{ mt: 1 }} data-oid="5yeycr1">
      {remoteFiles.map((f) => (
        <ListItem
          key={`r-${f.id}`}
          secondaryAction={
            <>
              <Tooltip title="Скачать" data-oid="vvnt2ay">
                <IconButton
                  onClick={() => forceDownload(f.id, f.path, f.name)}
                  data-oid="-8ai_kz"
                >
                  <DownloadIcon data-oid="wl6e25f" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Удалить" data-oid="-tda5wj">
                <IconButton
                  onClick={() => onRemoveRemote?.(f.id)}
                  sx={{ ml: 0.5 }}
                  data-oid="h8oneg7"
                >
                  <DeleteIcon data-oid="z5rxqkq" />
                </IconButton>
              </Tooltip>
            </>
          }
          data-oid="-.46box"
        >
          <ListItemIcon data-oid="58s8a50">
            <FileIcon data-oid=".wt3r2f" />
          </ListItemIcon>
          <ListItemText primary={f.name} data-oid="bv46sa-" />
        </ListItem>
      ))}

      {newFiles.map((f, i) => (
        <ListItem
          key={`n-${i}`}
          secondaryAction={
            <>
              <Tooltip title="Скачать" data-oid="rf56.jc">
                <IconButton
                  component="a"
                  href={objUrls[i]}
                  download={f.name}
                  data-oid="gd0:fu8"
                >
                  <DownloadIcon data-oid="zfdysu:" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Удалить" data-oid="a8lmx.b">
                <IconButton
                  onClick={() => onRemoveNew?.(i)}
                  sx={{ ml: 0.5 }}
                  data-oid="w8af_ht"
                >
                  <DeleteIcon data-oid="-wxz3mb" />
                </IconButton>
              </Tooltip>
            </>
          }
          data-oid="43c6i5j"
        >
          <ListItemIcon data-oid="z_ucfbd">
            <FileIcon data-oid="z_68thv" />
          </ListItemIcon>
          <ListItemText
            primary={f.name}
            secondary={`${(f.size / 1024).toFixed(1)} KB`}
            data-oid="0v2xkma"
          />
        </ListItem>
      ))}
    </List>
  );
}
