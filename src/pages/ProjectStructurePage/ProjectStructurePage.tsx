import React, { useState, useEffect, Suspense } from "react";
import {
    Box,
    Stack,
    Typography,
    FormControl,
    Select,
    MenuItem,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    CircularProgress,
    TextField,
    InputAdornment,
    List,
    ListItem,
    ListItemButton,
    ListItemText,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutline from "@mui/icons-material/DeleteOutline";
import EditIcon from "@mui/icons-material/Edit";
import SearchIcon from "@mui/icons-material/Search";
import AddBuildingDialog from "@/features/addBuilding/AddBuildingDialog";
import RenameBuildingDialog from "@/features/renameBuilding/RenameBuildingDialog";
import StatusLegend from "@/widgets/StatusLegend";

// Lazy loading для тяжелого компонента UnitsMatrix
const UnitsMatrix = React.lazy(() => import("@/widgets/UnitsMatrix/UnitsMatrix"));
import useProjectStructure, { LS_KEY } from "@/shared/hooks/useProjectStructure";
import { useProjectId } from '@/shared/hooks/useProjectId';
import { useDeleteUnitsByBuilding, useUnitsByProject } from '@/entities/unit';
import { useUnitsCount } from '@/shared/hooks/useUnitsCount';
// Новое:

function pluralObj(n) {
    n = Number(n);
    if (n % 10 === 1 && n % 100 !== 11) return "объект";
    if ([2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100))
        return "объекта";
    return "объектов";
}

export default function ProjectStructurePage() {
    const {
        projects,
        projectId,
        setProjectId,
        buildings,
        building,
        setBuilding,
        refreshAll,
        setBuildings,
    } = useProjectStructure();
    const globalProjectId = useProjectId();

    // Диалоги для корпусов/секций
    const [addDialogOpen, setAddDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [confirmDialog, setConfirmDialog] = useState({
        open: false,
        value: '',
    });

    // Поиск объектов по номеру
    const [searchQuery, setSearchQuery] = useState('');
    const [searchDialog, setSearchDialog] = useState({
        open: false,
        results: [] as Array<{ building: string; count: number }>,
    });

    const { projectCount, buildingCount } = useUnitsCount(projectId, building);

    const deleteBuildingMutation = useDeleteUnitsByBuilding();

    // Загрузка всех объектов текущего проекта для поиска
    const { data: allUnits = [] } = useUnitsByProject(projectId ? Number(projectId) : null);

    // Автоматический выбор проекта и корпуса при загрузке
    useEffect(() => {
        const saved = JSON.parse(localStorage.getItem(LS_KEY) || "{}");
        if (!projectId) {
            if (
                saved.projectId &&
                projects.find((p) => String(p.id) === String(saved.projectId))
            ) {
                setProjectId(saved.projectId);
            } else if (
                globalProjectId &&
                projects.find((p) => String(p.id) === String(globalProjectId))
            ) {
                setProjectId(String(globalProjectId));
            } else if (projects.length > 0) {
                setProjectId(String(projects[0].id));
            }
        }
    }, [projectId, projects, setProjectId]);

    useEffect(() => {
        const saved = JSON.parse(localStorage.getItem(LS_KEY) || "{}");
        if (!building && buildings.length > 0) {
            if (saved.building && buildings.includes(saved.building)) {
                setBuilding(saved.building);
            } else {
                setBuilding(buildings[0]);
            }
        }
    }, [buildings, building, setBuilding]);

    useEffect(() => {
        localStorage.setItem(
            LS_KEY,
            JSON.stringify({ projectId, building }),
        );
    }, [projectId, building]);

    // --- Диалоги ---
    const handleOpenAddDialog = () => setAddDialogOpen(true);
    const handleCloseAddDialog = () => setAddDialogOpen(false);
    const handleOpenEditDialog = () => setEditDialogOpen(true);
    const handleCloseEditDialog = () => setEditDialogOpen(false);

    const handleDeleteBuilding = () => {
        if (!building) return;
        setConfirmDialog({ open: true, value: building });
    };
    const handleConfirmDelete = async () => {
        await deleteBuildingMutation.mutateAsync({ projectId, building: confirmDialog.value });
        setBuildings((b) => b.filter((v) => v !== confirmDialog.value));
        setBuilding('');
        setConfirmDialog({ open: false, value: '' });
        refreshAll();
    };
    const handleCancelDelete = () => setConfirmDialog({ open: false, value: '' });

    // Функция поиска объекта по номеру
    const handleSearch = () => {
        if (!searchQuery.trim()) return;

        // Поиск объектов с точным совпадением номера
        const foundUnits = allUnits.filter(
            (unit) => unit.name && unit.name.toLowerCase() === searchQuery.trim().toLowerCase()
        );

        if (foundUnits.length === 0) {
            alert(`Объект с номером "${searchQuery}" не найден в текущем проекте`);
            return;
        }

        // Группировка по корпусам
        const buildingGroups: Record<string, number> = foundUnits.reduce((acc, unit) => {
            const bld = unit.building || '';
            acc[bld] = (acc[bld] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const buildingsWithUnits = Object.entries(buildingGroups).map(([building, count]) => ({
            building,
            count,
        }));

        // Если найден только один корпус - сразу открываем его
        if (buildingsWithUnits.length === 1) {
            setBuilding(buildingsWithUnits[0].building);
            setSearchQuery('');
        } else {
            // Если несколько корпусов - показываем диалог выбора
            setSearchDialog({
                open: true,
                results: buildingsWithUnits,
            });
        }
    };

    const handleSelectBuilding = (selectedBuilding: string) => {
        setBuilding(selectedBuilding);
        setSearchDialog({ open: false, results: [] });
        setSearchQuery('');
    };

    const handleCloseSearchDialog = () => {
        setSearchDialog({ open: false, results: [] });
    };

    const countProject = projectCount;
    const countBuilding = buildingCount;



    return (
        <Stack spacing={4} alignItems="flex-start">
            {/* Шапка */}
            <Box
                sx={{
                    background: "linear-gradient(92.6deg, #1976D2 8%, #2196F3 92%)",
                    borderRadius: "24px",
                    padding: { xs: "20px 16px 14px 16px", sm: "28px 36px 24px 36px" },
                    color: "#fff",
                    boxShadow: "0 6px 32px 0 rgba(25, 118, 210, 0.13)",
                    maxWidth: 630,
                    width: "100%",
                    mt: 4,
                    mb: 2,
                    mx: "auto",
                    fontFamily: 'Roboto, "Segoe UI", Arial, sans-serif',
                }}
            >
                <Typography
                    variant="h5"
                    sx={{
                        color: "#fff",
                        mb: 2,
                        fontWeight: 700,
                        fontFamily: "inherit",
                        letterSpacing: "-0.5px",
                    }}
                >
                    Шахматка квартир
                </Typography>
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: 3,
                    }}
                >
                    {/* Проект */}
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Typography sx={{ fontWeight: 500, fontSize: 16 }}>
                            Проект:
                        </Typography>
                        <FormControl
                            size="small"
                            sx={{
                                minWidth: 220,
                                "& .MuiInputBase-root, & .MuiInputBase-input": {
                                    color: "#fff",
                                    fontWeight: 500,
                                    fontSize: 15,
                                },
                                "& .MuiSelect-icon": { color: "#fff" },
                            }}
                        >
                            <Select
                                value={projectId || ""}
                                onChange={(e) => setProjectId(String(e.target.value))}
                                displayEmpty
                                sx={{
                                    bgcolor: "rgba(255,255,255,0.11)",
                                    borderRadius: "10px",
                                    color: "#fff",
                                    fontWeight: 600,
                                }}
                            >
                                {projects.map((prj) => (
                                    <MenuItem key={prj.id} value={prj.id}>
                                        {prj.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        {projectId && (
                            <Box
                                sx={{
                                    ml: 1,
                                    px: 1.5,
                                    py: "2px",
                                    bgcolor: "rgba(255,255,255,0.20)",
                                    borderRadius: "16px",
                                    fontWeight: 600,
                                    fontSize: 15,
                                    color: "#fff",
                                    minWidth: 32,
                                    textAlign: "center",
                                }}
                            >
                                ({countProject} {pluralObj(countProject)})
                            </Box>
                        )}
                    </Box>
                    {/* Корпус */}
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Typography sx={{ fontWeight: 500, fontSize: 16 }}>
                            Корпус:
                        </Typography>
                        <FormControl
                            size="small"
                            sx={{
                                minWidth: 100,
                                "& .MuiInputBase-root, & .MuiInputBase-input": {
                                    color: "#fff",
                                    fontWeight: 500,
                                    fontSize: 15,
                                },
                                "& .MuiSelect-icon": { color: "#fff" },
                            }}
                        >
                            <Select
                                value={buildings.includes(building) ? building : ""}
                                onChange={(e) => setBuilding(e.target.value)}
                                displayEmpty
                                sx={{
                                    bgcolor: "rgba(255,255,255,0.11)",
                                    borderRadius: "10px",
                                    color: "#fff",
                                    fontWeight: 600,
                                }}
                                disabled={!buildings.length}
                            >
                                {buildings.map((bld) => (
                                    <MenuItem key={bld} value={bld}>
                                        {bld}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        {building && (
                            <Box
                                sx={{
                                    ml: 1,
                                    px: 1.5,
                                    py: "2px",
                                    bgcolor: "rgba(255,255,255,0.20)",
                                    borderRadius: "16px",
                                    fontWeight: 600,
                                    fontSize: 15,
                                    color: "#fff",
                                    minWidth: 32,
                                    textAlign: "center",
                                }}
                            >
                                ({countBuilding} {pluralObj(countBuilding)})
                            </Box>
                        )}
                        <IconButton
                            size="small"
                            onClick={() => handleOpenAddDialog()}
                            sx={{
                                color: "#fff",
                                opacity: 0.94,
                                ml: 0.5,
                                p: "6px",
                            }}
                        >
                            <AddIcon fontSize="small" />
                        </IconButton>
                        {Boolean(building) && (
                            <IconButton
                                size="small"
                                onClick={handleOpenEditDialog}
                                sx={{
                                    color: "#fff",
                                    opacity: 0.88,
                                    p: "6px",
                                }}
                            >
                                <EditIcon fontSize="small" />
                            </IconButton>
                        )}
                        {Boolean(building) && (
                            <IconButton
                                size="small"
                                onClick={handleDeleteBuilding}
                                sx={{
                                    color: "#fff",
                                    opacity: 0.88,
                                    p: "6px",
                                }}
                            >
                                <DeleteOutline fontSize="small" />
                            </IconButton>
                        )}
                    </Box>
                </Box>
            </Box>

            {/* Поле поиска объекта */}
            <Box
                sx={{
                    background: "#fff",
                    borderRadius: "16px",
                    padding: "20px 24px",
                    boxShadow: "0 2px 12px rgba(0, 0, 0, 0.08)",
                    maxWidth: 630,
                    width: "100%",
                    mx: "auto",
                }}
            >
                <Typography
                    variant="h6"
                    sx={{
                        mb: 2,
                        fontWeight: 600,
                        color: "#1976d2",
                    }}
                >
                    Поиск объекта по номеру
                </Typography>
                <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                    <TextField
                        fullWidth
                        size="small"
                        placeholder="Введите номер объекта (например: 101)"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                                handleSearch();
                            }
                        }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon sx={{ color: "#1976d2" }} />
                                </InputAdornment>
                            ),
                        }}
                        sx={{
                            "& .MuiOutlinedInput-root": {
                                borderRadius: "12px",
                            },
                        }}
                    />
                    <Button
                        variant="contained"
                        onClick={handleSearch}
                        disabled={!searchQuery.trim() || !projectId}
                        sx={{
                            borderRadius: "12px",
                            px: 3,
                            minWidth: 120,
                            textTransform: "none",
                            fontWeight: 600,
                        }}
                    >
                        Найти
                    </Button>
                </Box>
            </Box>

            {/* Диалог добавления корпуса */}
            <AddBuildingDialog
                open={addDialogOpen}
                onClose={handleCloseAddDialog}
                projectId={projectId}
                afterAdd={(name) => {
                    setBuildings((b) => Array.from(new Set([...b, name])));
                    refreshAll();
                }}
            />

            {/* Диалог переименования корпуса */}
            <RenameBuildingDialog
                open={editDialogOpen}
                onClose={handleCloseEditDialog}
                projectId={projectId}
                currentName={building || ''}
                onSuccess={(name) => {
                    setBuildings((b) => b.map((v) => (v === building ? name : v)));
                    setBuilding(name);
                    refreshAll();
                }}
            />

            {/* Диалог подтверждения удаления */}
            <Dialog open={confirmDialog.open} onClose={handleCancelDelete}>
                <DialogTitle>
                    {`Удалить корпус "${confirmDialog.value}"?`}
                </DialogTitle>
                <DialogContent>
                    Все квартиры корпуса будут удалены безвозвратно.
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCancelDelete}>Отмена</Button>
                    <Button
                        color="error"
                        variant="contained"
                        onClick={handleConfirmDelete}
                    >
                        Удалить
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Диалог выбора корпуса при множественных результатах */}
            <Dialog
                open={searchDialog.open}
                onClose={handleCloseSearchDialog}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>
                    Выберите корпус
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Объект с номером &quot;{searchQuery}&quot; найден в нескольких корпусах:
                    </Typography>
                    <List sx={{ pt: 0 }}>
                        {searchDialog.results.map((result) => (
                            <ListItem key={result.building} disablePadding>
                                <ListItemButton
                                    onClick={() => handleSelectBuilding(result.building)}
                                    sx={{
                                        borderRadius: "8px",
                                        mb: 1,
                                        border: "1px solid #e0e0e0",
                                        "&:hover": {
                                            bgcolor: "#f5f5f5",
                                        },
                                    }}
                                >
                                    <ListItemText
                                        primary={`Корпус ${result.building}`}
                                        secondary={`Найдено объектов: ${result.count}`}
                                        primaryTypographyProps={{
                                            fontWeight: 600,
                                            color: "#1976d2",
                                        }}
                                    />
                                </ListItemButton>
                            </ListItem>
                        ))}
                    </List>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseSearchDialog}>
                        Отмена
                    </Button>
                </DialogActions>
            </Dialog>

            {!buildings.length && (
                <Box
                    sx={{ color: "#1976d2", mt: 4, mb: 3, fontSize: 17, fontWeight: 600 }}
                >
                    Сначала создайте корпус
                </Box>
            )}

            {projectId && building && buildings.length > 0 && (
                <Suspense fallback={
                    <Box display="flex" justifyContent="center" p={4}>
                        <CircularProgress size={48} />
                    </Box>
                }>
                    <UnitsMatrix projectId={projectId} building={building} />
                </Suspense>
            )}
            <StatusLegend />
        </Stack>
    );
}
