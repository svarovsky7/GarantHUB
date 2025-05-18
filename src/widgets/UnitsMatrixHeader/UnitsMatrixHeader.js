import React from 'react';
import {
    Box, Typography, FormControl, Select, MenuItem, IconButton
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutline from '@mui/icons-material/DeleteOutline';

export default function UnitsMatrixHeader({
                                              projects, projectId, setProjectId,
                                              buildings, building, setBuilding,
                                              sections, section, setSection,
                                              onAddBuilding, onAddSection, onDeleteBuilding, onDeleteSection
                                          }) {
    return (
        <Box
            sx={{
                background: 'linear-gradient(93deg, #2852E7 0%, #4368DF 100%)',
                borderRadius: '16px',
                padding: '24px 32px 20px 32px',
                color: '#fff',
                mb: 2,
                boxShadow: '0 4px 24px 0 rgba(40,82,231,0.10)'
            }}
        >
            <Typography
                variant="h5"
                sx={{
                    color: '#fff',
                    mb: 2,
                    fontWeight: 700,
                    letterSpacing: '-0.5px'
                }}
            >
                Шахматка квартир
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 3 }}>
                {/* Проект */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography sx={{ fontWeight: 400 }}>Проект:</Typography>
                    <FormControl size="small" sx={{
                        minWidth: 220,
                        '& .MuiInputBase-root, & .MuiInputBase-input': { color: '#fff' },
                        '& .MuiSelect-icon': { color: '#fff' },
                    }}>
                        <Select
                            value={projectId}
                            onChange={e => setProjectId(e.target.value)}
                            displayEmpty
                            sx={{
                                bgcolor: 'rgba(255,255,255,0.06)',
                                borderRadius: '8px',
                                color: '#fff',
                                fontWeight: 500,
                            }}
                        >
                            <MenuItem value="">Не выбран</MenuItem>
                            {projects.map(prj => (
                                <MenuItem key={prj.id} value={prj.id}>{prj.name}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Box>
                {/* Корпус */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography sx={{ fontWeight: 400 }}>Корпус:</Typography>
                    <FormControl size="small" sx={{
                        minWidth: 120,
                        '& .MuiInputBase-root, & .MuiInputBase-input': { color: '#fff' },
                        '& .MuiSelect-icon': { color: '#fff' },
                    }}>
                        <Select
                            value={building}
                            onChange={e => setBuilding(e.target.value)}
                            displayEmpty
                            sx={{
                                bgcolor: 'rgba(255,255,255,0.06)',
                                borderRadius: '8px',
                                color: '#fff',
                                fontWeight: 500,
                            }}
                            disabled={!buildings.length}
                        >
                            <MenuItem value="">Не выбран</MenuItem>
                            {buildings.map(bld => (
                                <MenuItem key={bld} value={bld}>{bld}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <IconButton size="small" onClick={onAddBuilding} sx={{ color: "#fff", opacity: .85, ml: .5 }}>
                        <AddIcon fontSize="small" />
                    </IconButton>
                    {Boolean(building) && (
                        <IconButton size="small" onClick={onDeleteBuilding} sx={{ color: "#fff", opacity: .85 }}>
                            <DeleteOutline fontSize="small" />
                        </IconButton>
                    )}
                </Box>
            </Box>

            {/* Секция ниже с небольшим отступом */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
                <Typography sx={{ fontWeight: 400 }}>Секция:</Typography>
                <FormControl size="small" sx={{
                    minWidth: 120,
                    '& .MuiInputBase-root, & .MuiInputBase-input': { color: '#fff' },
                    '& .MuiSelect-icon': { color: '#fff' },
                }}>
                    <Select
                        value={section}
                        onChange={e => setSection(e.target.value)}
                        displayEmpty
                        sx={{
                            bgcolor: 'rgba(255,255,255,0.06)',
                            borderRadius: '8px',
                            color: '#fff',
                            fontWeight: 500,
                        }}
                        disabled={!sections.length}
                    >
                        <MenuItem value="">Не выбрана</MenuItem>
                        {sections.map(sec => (
                            <MenuItem key={sec} value={sec}>{sec}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <IconButton size="small" onClick={onAddSection} sx={{ color: "#fff", opacity: .85, ml: .5 }}>
                    <AddIcon fontSize="small" />
                </IconButton>
                {Boolean(section) && (
                    <IconButton size="small" onClick={onDeleteSection} sx={{ color: "#fff", opacity: .85 }}>
                        <DeleteOutline fontSize="small" />
                    </IconButton>
                )}
            </Box>
        </Box>
    );
}
