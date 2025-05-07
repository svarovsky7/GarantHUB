// src/features/ticket/AttachmentPreviewList.js
// --------------------------------------------
import React from 'react';
import {
    ImageList,
    ImageListItem,
    Box,
    Typography,
    IconButton,
} from '@mui/material';
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined';
import DeleteForeverOutlinedIcon from '@mui/icons-material/DeleteForeverOutlined';

/**
 * Создаёт временные object-URL-ы для превью файлов.
 */
function useObjectURLs(files) {
    const [urls, setUrls] = React.useState([]);
    React.useEffect(() => {
        if (!files?.length) return setUrls([]);

        const list = files.map((f) => ({
            url: URL.createObjectURL(f),
            name: f.name,
            type: f.type,
        }));
        setUrls(list);

        return () => list.forEach(({ url }) => URL.revokeObjectURL(url));
    }, [files]);

    return urls;
}

/**
 * Статичный список превью + кнопка удалить.
 *
 * @param {{files:File[], onRemove:(idx:number)=>void}} props
 */
export default function AttachmentPreviewList({ files, onRemove }) {
    const items = useObjectURLs(files);

    if (!items.length) return null;

    return (
        <ImageList cols={3} gap={12} sx={{ mt: 2 }}>
            {items.map(({ url, name, type }, idx) => (
                <ImageListItem key={url} sx={{ position: 'relative' }}>
                    {type.startsWith('image/') ? (
                        <img
                            src={url}
                            alt={name}
                            loading="lazy"
                            style={{ borderRadius: 8 }}
                        />
                    ) : (
                        <Box
                            sx={{
                                height: 120,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: '1px dashed',
                                borderRadius: 2,
                            }}
                        >
                            <InsertDriveFileOutlinedIcon fontSize="large" />
                        </Box>
                    )}

                    {/* --- delete button --- */}
                    <IconButton
                        size="small"
                        aria-label="Удалить"
                        onClick={() => onRemove(idx)}
                        sx={{
                            position: 'absolute',
                            top: 4,
                            right: 4,
                            bgcolor: 'rgba(255,255,255,0.7)',
                        }}
                    >
                        <DeleteForeverOutlinedIcon fontSize="small" />
                    </IconButton>

                    <Typography variant="caption" noWrap>
                        {name}
                    </Typography>
                </ImageListItem>
            ))}
        </ImageList>
    );
}
