import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/shared/api/supabaseClient';
import type { Project } from '@/shared/types/project';
import type { ProjectStructureSelection } from '@/shared/types/projectStructure';
import { useVisibleProjects } from '@/entities/project';
import { useAuthStore } from '@/shared/store/authStore';

/**
 * Ключ для хранения выбора проекта и корпуса в `localStorage`.
 */
export const LS_KEY = 'structurePageSelection';

/**
 * Хук для выбора проекта, корпуса и секции.
 * Сохраняет состояние в localStorage и синхронизирует его между вкладками.
 */
export default function useProjectStructure() {
    const { data: projects = [] } = useVisibleProjects();
    const setGlobalProjectId = useAuthStore((s) => s.setProjectId);

    const [projectId, setProjectIdState] = useState<string>('');
    const [buildings, setBuildings] = useState<string[]>([]);
    const [building, setBuildingState] = useState<string>('');
    // --- Helpers для сохранения в localStorage ---
    const saveToLS = (obj: { projectId: string; building: string }) => {
        try {
            localStorage.setItem(LS_KEY, JSON.stringify(obj));
        } catch (e) { /* ignore */ }
    };

    // --- Обёртки, чтобы сеттеры писали в localStorage ---
    const setProjectId = (id: string) => {
        setProjectIdState(id);
        setGlobalProjectId(id ? Number(id) : null);
        saveToLS({ projectId: id, building });
    };
    const setBuilding = (bld: string) => {
        setBuildingState(bld);
        saveToLS({ projectId, building: bld });
    };

    // --- Восстановление из localStorage при инициализации ---
    useEffect(() => {
        try {
            const saved = JSON.parse(localStorage.getItem(LS_KEY) || '{}') as Partial<ProjectStructureSelection>;
            if (saved.projectId) {
                setProjectIdState(saved.projectId);
                setGlobalProjectId(Number(saved.projectId));
            }
            if (saved.building) setBuildingState(saved.building);
        } catch { /* ignore */ }
    }, []);



    // --- Buildings auto-refresh ---
    const refreshAll = useCallback(async () => {
        if (!projectId) {
            setBuildings([]);
            return;
        }
        const { data: bld } = await supabase
            .rpc('buildings_by_project', { pid: Number(projectId) });
        const bldList = (bld || [])
            .map((r: any) => r.building)
            .filter(Boolean)
            .sort((a: string, b: string) => a.localeCompare(b));
        setBuildings(bldList);
        if (building && !bldList.includes(building)) {
            setBuildingState(bldList[0] ?? '');
        }
        if (!building && bldList.length) {
            setBuildingState(bldList[0]);
        }
    }, [projectId, building]);

    useEffect(() => {
        refreshAll();
    }, [refreshAll]);

    // --- Подписка на изменения в units для мгновенного обновления ---
    useEffect(() => {
        if (!projectId) return;
        const channel = supabase
            .channel('units-structure-' + projectId)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'units', filter: `project_id=eq.${projectId}` },
                () => refreshAll(),
            );
        channel.subscribe();
        return () => {
            channel.unsubscribe();
        };
    }, [projectId, refreshAll]);

    // --- Автоматическое сохранение выбранных значений при изменении ---
    useEffect(() => {
        saveToLS({ projectId, building });
        setGlobalProjectId(projectId ? Number(projectId) : null);
    }, [projectId, building]);

    // --- Поддержка обновления между вкладками ---
    useEffect(() => {
        const handler = (e: StorageEvent) => {
            if (e.key === LS_KEY) {
                try {
                    const saved = JSON.parse(e.newValue || '{}') as Partial<ProjectStructureSelection>;
                    if (saved.projectId) {
                        setProjectIdState(saved.projectId);
                        setGlobalProjectId(Number(saved.projectId));
                    }
                    if (saved.building) setBuildingState(saved.building);
                } catch { /* ignore */ }
            }
        };
        window.addEventListener('storage', handler);
        return () => window.removeEventListener('storage', handler);
    }, []);

    return {
        projects, projectId, setProjectId,
        buildings, building, setBuilding,
        refreshAll,
        setBuildings,
    };
}

