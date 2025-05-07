// src/features/ticket/AttachmentPreviewList.js
// --------------------------------------------
import React from 'react';
import {
    List,
    ListItem,
    ListItemAvatar,
    Avatar,
    ListItemText,
    IconButton,
} from '@mui/material';
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined';
import DeleteForeverOutlinedIcon from '@mui/icons-material/DeleteForeverOutlined';

/**
 * Создаёт object-URL-ы для превью и очищает их.
 * @param {File[]} files
 * @returns {{url:string,name:string,type:string}[]}
 */
function useObjectURLs(files) {
    const [items, setItems] = React.useState([]);
    React.useEffect(() => {
        if (!files?.length) return setItems([]);

        const list = files.map((f) => ({
            url: f.type.startsWith('image/')
                ? URL.createObjectURL(f)
                : '', // preview только для изображений
            name: f.name,
            type: f.type,
        }));
        setItems(list);

        return () => list.forEach(({ url }) => url && URL.revokeObjectURL(url));
    }, [files]);

    return items;
}

/**
 * Список прикреплённых файлов.
 *
 * @param {{
 *   files: File[],
 *   onRemove: (idx:number)=>void
 * }} props
 */
export default function AttachmentPreviewList({ files, onRemove }) {
    const items = useObjectURLs(files);

    if (!items.length) return null;

    return (
        <List dense sx={{ mt: 1 }}>
            {items.map(({ url, name, type }, idx) => (
                <ListItem
                    key={`${name}-${idx}`}
                    secondaryAction={
                        <IconButton
                            edge="end"
                            aria-label="Удалить"
                            onClick={() => onRemove(idx)}
                        >
                            <DeleteForeverOutlinedIcon />
                        </IconButton>
                    }
                >
                    <ListItemAvatar>
                        {type.startsWith('image/') && url ? (
                            <Avatar
                                variant="rounded"
                                src={url}
                                alt={name}
                                sx={{ width: 48, height: 48 }}
                            />
                        ) : (
                            <Avatar variant="rounded" sx={{ width: 48, height: 48 }}>
                                <InsertDriveFileOutlinedIcon />
                            </Avatar>
                        )}
                    </ListItemAvatar>
                    <ListItemText primary={name} />
                </ListItem>
            ))}
        </List>
    );
}
