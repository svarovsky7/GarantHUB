// CHANGE: переезд из ticket → shared/ui; без изменений API
// -----------------------------------------------------------------------------
import React from "react";
import { useDropzone } from "react-dropzone";
import { Box, Typography } from "@mui/material";
import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";

/**
 * Drag-and-Drop зона без лимита размера
 *
 * @param {{onFiles:(File[])=>void}} props
 */
export default function FileDropZone({ onFiles }) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    multiple: true,
    onDrop: onFiles,
  });

  return (
    <Box
      {...getRootProps()}
      sx={{
        border: "2px dashed",
        borderColor: isDragActive ? "primary.main" : "grey.400",
        borderRadius: 2,
        p: 4,
        textAlign: "center",
        color: "text.secondary",
        cursor: "pointer",
        transition: ".2s",
        "&:hover": { borderColor: "primary.main" },
      }}
    >
      <input {...getInputProps()} />
      <CloudUploadOutlinedIcon sx={{ fontSize: 42, mb: 1 }} />

      <Typography fontWeight={600}>
        Нажмите для загрузки или перетащите файлы
      </Typography>
    </Box>
  );
}
