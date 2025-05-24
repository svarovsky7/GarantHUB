import React, { useState, useEffect } from 'react';
import {
    Box, Stack, Typography, FormControl, Select, MenuItem, IconButton, Dialog, DialogTitle,
    DialogContent, DialogActions, Button
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutline from '@mui/icons-material/DeleteOutline';
import AddBuildingOrSectionDialog from '@/features/addBuildingOrSection/AddBuildingOrSectionDialog';
import UnitsMatrix from '@/widgets/UnitsMatrix/UnitsMatrix';
import useProjectStructure from '@/shared/hooks/useProjectStructure';

// Функция получения профиля пользователя
function getCurrentProfile() {
    try {
        return JSON.parse(localStorage.getItem('profile')) || {};
    } catch {
        return {};
    }
}

const LS_KEY = 'structurePageSelection';

// Функция склонения слова "объект"
function pluralObj(n) {
    n = Number(n);
    if (n % 10 === 1 && n % 100 !== 11) return 'объект';
    if ([2,3,4].includes(n % 10) && ![12,13,14].includes(n % 100)) return 'объекта';
    return 'объектов';
}

export default function ProjectStructurePage() {
    const {
        projects, projectId, setProjectId,
        buildings, building, setBuilding,
        sections, section, setSection,
        refreshAll,
    } = useProjectStructure();

    // Для добавления корпуса и секции
    const [addDialog, setAddDialog] = useState({ open: false, type: '', value: '' });
    const [confirmDialog, setConfirmDialog] = useState({ open: false, type: '', value: '' });

    // Массив всех объектов (units) в проекте — всегда актуальный
    const [units, setUnits] = useState([]);

    // --- Автоматический выбор проекта из профиля, если ни один не выбран
    useEffect(() => {
        const profile = getCurrentProfile();
        const saved = JSON.parse(localStorage.getItem(LS_KEY) || '{}');
        if (!projectId) {
            if (saved.projectId && projects.find(p => String(p.id) === String(saved.projectId))) {
                setProjectId(saved.projectId);
            } else if (profile.project_id && projects.find(p => String(p.id) === String(profile.project_id))) {
                setProjectId(profile.project_id);
            } else if (projects.length > 0) {
                setProjectId(projects[0].id);
            }
        }
    }, [projectId, projects, setProjectId]);

    useEffect(() => {
        const saved = JSON.parse(localStorage.getItem(LS_KEY) || '{}');
        if (!building && buildings.length > 0) {
            if (saved.building && buildings.includes(saved.building)) {
                setBuilding(saved.building);
            } else {
                setBuilding(buildings[0]);
            }
        }
    }, [buildings, building, setBuilding]);

    useEffect(() => {
        const saved = JSON.parse(localStorage.getItem(LS_KEY) || '{}');
        if (!section && sections.length > 0) {
            if (saved.section && sections.includes(saved.section)) {
                setSection(saved.section);
            }
        }
    }, [sections, section, setSection]);

    useEffect(() => {
        localStorage.setItem(
            LS_KEY,
            JSON.stringify({ projectId, building, section })
        );
    }, [projectId, building, section]);

    // --- Диалоги ---
    const handleOpenAddDialog = (type) => setAddDialog({ open: true, type, value: '' });
    const handleCloseAddDialog = () => setAddDialog({ open: false, type: '', value: '' });

    const handleDeleteBuilding = () => {
        if (!building) return;
        setConfirmDialog({ open: true, type: 'building', value: building });
    };
    const handleDeleteSection = () => {
        if (!section) return;
        setConfirmDialog({ open: true, type: 'section', value: section });
    };
    const handleConfirmDelete = async () => {
        setConfirmDialog({ open: false, type: '', value: '' });
        refreshAll();
    };
    const handleCancelDelete = () => setConfirmDialog({ open: false, type: '', value: '' });

    // Счетчики — фильтруем по units
    const countProject = units.length;
    const countBuilding = units.filter(u => String(u.building) === String(building)).length;
    const countSection = units.filter(
        u => String(u.building) === String(building) && String(u.section) === String(section)
    ).length;

    return (
        <Stack spacing={4} alignItems="flex-start">
            {/* Шапка */}
            <Box
                sx={{
                    background: 'linear-gradient(92.6deg, #1976D2 8%, #2196F3 92%)',
                    borderRadius: '24px',
                    padding: { xs: '20px 16px 14px 16px', sm: '28px 36px 24px 36px' },
                    color: '#fff',
                    boxShadow: '0 6px 32px 0 rgba(25, 118, 210, 0.13)',
                    maxWidth: 630,
                    width: '100%',
                    mt: 4,
                    mb: 2,
                    mx: 'auto',
                    fontFamily: 'Roboto, "Segoe UI", Arial, sans-serif'
                }}
            >
                <Typography
                    variant="h5"
                    sx={{
                        color: '#fff',
                        mb: 2,
                        fontWeight: 700,
                        fontFamily: 'inherit',
                        letterSpacing: '-0.5px'
                    }}
                >
                    Шахматка квартир
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 3 }}>
                    {/* Проект */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography sx={{ fontWeight: 500, fontSize: 16 }}>Проект:</Typography>
                        <FormControl size="small" sx={{
                            minWidth: 220,
                            '& .MuiInputBase-root, & .MuiInputBase-input': { color: '#fff', fontWeight: 500, fontSize: 15 },
                            '& .MuiSelect-icon': { color: '#fff' },
                        }}>
                            <Select
                                value={projectId || ''}
                                onChange={e => setProjectId(e.target.value)}
                                displayEmpty
                                sx={{
                                    bgcolor: 'rgba(255,255,255,0.11)',
                                    borderRadius: '10px',
                                    color: '#fff',
                                    fontWeight: 600,
                                }}
                            >
                                {projects.map(prj => (
                                    <MenuItem key={prj.id} value={prj.id}>{prj.name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        {projectId && (
                            <Box sx={{
                                ml: 1, px: 1.5, py: '2px', bgcolor: 'rgba(255,255,255,0.20)',
                                borderRadius: '16px', fontWeight: 600, fontSize: 15, color: '#fff', minWidth: 32, textAlign: 'center'
                            }}>
                                ({countProject} {pluralObj(countProject)})
                            </Box>
                        )}
                    </Box>
                    {/* Корпус */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography sx={{ fontWeight: 500, fontSize: 16 }}>Корпус:</Typography>
                        <FormControl size="small" sx={{
                            minWidth: 100,
                            '& .MuiInputBase-root, & .MuiInputBase-input': { color: '#fff', fontWeight: 500, fontSize: 15 },
                            '& .MuiSelect-icon': { color: '#fff' },
                        }}>
                            <Select
                                value={building || ''}
                                onChange={e => setBuilding(e.target.value)}
                                displayEmpty={false}
                                sx={{
                                    bgcolor: 'rgba(255,255,255,0.11)',
                                    borderRadius: '10px',
                                    color: '#fff',
                                    fontWeight: 600,
                                }}
                                disabled={!buildings.length}
                            >
                                {buildings.map(bld => (
                                    <MenuItem key={bld} value={bld}>{bld}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        {building && (
                            <Box sx={{
                                ml: 1, px: 1.5, py: '2px', bgcolor: 'rgba(255,255,255,0.20)',
                                borderRadius: '16px', fontWeight: 600, fontSize: 15, color: '#fff', minWidth: 32, textAlign: 'center'
                            }}>
                                ({countBuilding} {pluralObj(countBuilding)})
                            </Box>
                        )}
                        <IconButton size="small" onClick={() => handleOpenAddDialog('building')} sx={{
                            color: "#fff", opacity: .94, ml: .5, p: '6px'
                        }}>
                            <AddIcon fontSize="small" />
                        </IconButton>
                        {Boolean(building) && (
                            <IconButton size="small" onClick={handleDeleteBuilding} sx={{
                                color: "#fff", opacity: .88, p: '6px'
                            }}>
                                <DeleteOutline fontSize="small" />
                            </IconButton>
                        )}
                    </Box>
                </Box>
                {/* Секция отдельной строкой с небольшим отступом */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
                    <Typography sx={{ fontWeight: 500, fontSize: 16 }}>Секция:</Typography>
                    <FormControl size="small" sx={{
                        minWidth: 110,
                        '& .MuiInputBase-root, & .MuiInputBase-input': { color: '#fff', fontWeight: 500, fontSize: 15 },
                        '& .MuiSelect-icon': { color: '#fff' },
                    }}>
                        <Select
                            value={section}
                            onChange={e => setSection(e.target.value)}
                            displayEmpty
                            sx={{
                                bgcolor: 'rgba(255,255,255,0.11)',
                                borderRadius: '10px',
                                color: '#fff',
                                fontWeight: 600,
                            }}
                            disabled={!sections.length}
                        >
                            <MenuItem value="">Не выбрана</MenuItem>
                            {sections.map(sec => (
                                <MenuItem key={sec} value={sec}>{sec}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    {section && (
                        <Box sx={{
                            ml: 1, px: 1.5, py: '2px', bgcolor: 'rgba(255,255,255,0.20)',
                            borderRadius: '16px', fontWeight: 600, fontSize: 15, color: '#fff', minWidth: 32, textAlign: 'center'
                        }}>
                            ({countSection} {pluralObj(countSection)})
                        </Box>
                    )}
                    <IconButton size="small" onClick={() => handleOpenAddDialog('section')} sx={{
                        color: "#fff", opacity: .94, ml: .5, p: '6px'
                    }}>
                        <AddIcon fontSize="small" />
                    </IconButton>
                    {Boolean(section) && (
                        <IconButton size="small" onClick={handleDeleteSection} sx={{
                            color: "#fff", opacity: .88, p: '6px'
                        }}>
                            <DeleteOutline fontSize="small" />
                        </IconButton>
                    )}
                </Box>
            </Box>

            {/* Диалог добавления корпуса/секции */}
            <AddBuildingOrSectionDialog
                open={addDialog.open}
                type={addDialog.type}
                onClose={handleCloseAddDialog}
                projectId={projectId}
                building={building}
                afterAdd={refreshAll}
            />

            {/* Диалог подтверждения удаления */}
            <Dialog open={confirmDialog.open} onClose={handleCancelDelete}>
                <DialogTitle>
                    {confirmDialog.type === 'building'
                        ? `Удалить корпус "${confirmDialog.value}"?`
                        : `Удалить секцию "${confirmDialog.value}"?`
                    }
                </DialogTitle>
                <DialogContent>
                    {confirmDialog.type === 'building'
                        ? 'Все секции и квартиры корпуса будут удалены безвозвратно.'
                        : 'Все квартиры секции будут удалены безвозвратно.'}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCancelDelete}>Отмена</Button>
                    <Button color="error" variant="contained" onClick={handleConfirmDelete}>
                        Удалить
                    </Button>
                </DialogActions>
            </Dialog>

            {!buildings.length && (
                <Box sx={{ color: '#1976d2', mt: 4, mb: 3, fontSize: 17, fontWeight: 600 }}>
                    Сначала создайте корпус
                </Box>
            )}

            {projectId && building && buildings.length > 0 && (
                <UnitsMatrix
                    projectId={projectId}
                    building={building}
                    section={section}
                    onUnitsChanged={setUnits}
                />
            )}
        </Stack>
    );
}
