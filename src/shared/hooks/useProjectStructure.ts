import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/shared/api/supabaseClient';
import type { Project } from '@/shared/types/project';

const LS_KEY = 'structurePageSelection';

/**
 * Хук для выбора проекта, корпуса и секции.
 * Сохраняет состояние в localStorage и синхронизирует его между вкладками.
 */
export default function useProjectStructure() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [projectId, setProjectIdState] = useState<string>('');
    const [buildings, setBuildings] = useState<string[]>([]);
    const [building, setBuildingState] = useState<string>('');
    const [sections, setSections] = useState<string[]>([]);
    const [section, setSectionState] = useState<string>('');

    // --- Helpers для сохранения в localStorage ---
    const saveToLS = (obj: { projectId: string; building: string; section: string }) => {
        try {
            localStorage.setItem(LS_KEY, JSON.stringify(obj));
        } catch (e) { /* ignore */ }
    };

    // --- Обёртки, чтобы сеттеры писали в localStorage ---
    const setProjectId = (id: string) => {
        setProjectIdState(id);
        saveToLS({ projectId: id, building, section });
    };
    const setBuilding = (bld: string) => {
        setBuildingState(bld);
        saveToLS({ projectId, building: bld, section });
    };
    const setSection = (sec: string) => {
        setSectionState(sec);
        saveToLS({ projectId, building, section: sec });
    };

    // --- Восстановление из localStorage при инициализации ---
    useEffect(() => {
        try {
            const saved = JSON.parse(localStorage.getItem(LS_KEY) || '{}') as Partial<{ projectId: string; building: string; section: string }>;
            if (saved.projectId) setProjectIdState(saved.projectId);
            if (saved.building) setBuildingState(saved.building);
            if (saved.section) setSectionState(saved.section);
        } catch { /* ignore */ }
    }, []);

    // --- Projects ---
    useEffect(() => {
        (async () => {
            const { data } = await supabase.from('projects').select('*').order('id');
            setProjects((data ?? []) as Project[]);
        })();
    }, []);

    // --- Buildings and sections auto-refresh ---
    const refreshAll = useCallback(async () => {
        if (!projectId) {
            setBuildings([]);
            setSections([]);
            return;
        }
        const { data: bld } = await supabase
            .from('units')
            .select('building')
            .eq('project_id', projectId);
        setBuildings(Array.from(new Set((bld || []).map((u: any) => u.building).filter(Boolean))));
        if (!building) {
            setSections([]);
            return;
        }
        const { data: sec } = await supabase
            .from('units')
            .select('section')
            .eq('project_id', projectId)
            .eq('building', building);
        setSections(Array.from(new Set((sec || []).map((u: any) => u.section).filter(Boolean))));
    }, [projectId, building]);

    useEffect(() => {
        refreshAll();
    }, [refreshAll]);

    // --- Автоматическое сохранение выбранных значений при изменении ---
    useEffect(() => {
        saveToLS({ projectId, building, section });
    }, [projectId, building, section]);

    // --- Поддержка обновления между вкладками ---
    useEffect(() => {
        const handler = (e) => {
            if (e.key === LS_KEY) {
                try {
                    const saved = JSON.parse(e.newValue || '{}');
                    if (saved.projectId) setProjectIdState(saved.projectId);
                    if (saved.building) setBuildingState(saved.building);
                    if (saved.section) setSectionState(saved.section);
                } catch {/* ignore */}
            }
        };
        window.addEventListener('storage', handler);
        return () => window.removeEventListener('storage', handler);
    }, []);

    return {
        projects, projectId, setProjectId,
        buildings, building, setBuilding,
        sections, section, setSection,
        refreshAll,
    };
}

