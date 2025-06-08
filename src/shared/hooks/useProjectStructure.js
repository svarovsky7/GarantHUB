import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/shared/api/supabaseClient';

const LS_KEY = 'structurePageSelection';

/**
 * Управляет списком проектов и доступными корпусами/секциями.
 * Сохраняет выбор в localStorage и синхронизирует его между вкладками.
 * @returns {object} Объект со списком проектов и функциями выбора
 */
export default function useProjectStructure() {
    const [projects, setProjects] = useState([]);
    const [projectId, setProjectIdState] = useState('');
    const [buildings, setBuildings] = useState([]);
    const [building, setBuildingState] = useState('');
    const [sections, setSections] = useState([]);
    const [section, setSectionState] = useState('');

    // --- Helpers для сохранения в localStorage ---
    const saveToLS = (obj) => {
        try {
            localStorage.setItem(LS_KEY, JSON.stringify(obj));
        } catch (e) { /* ignore */ }
    };

    // --- Обёртки, чтобы сеттеры писали в localStorage ---
    const setProjectId = (id) => {
        setProjectIdState(id);
        saveToLS({ projectId: id, building, section });
    };
    const setBuilding = (bld) => {
        setBuildingState(bld);
        saveToLS({ projectId, building: bld, section });
    };
    const setSection = (sec) => {
        setSectionState(sec);
        saveToLS({ projectId, building, section: sec });
    };

    // --- Восстановление из localStorage при инициализации ---
    useEffect(() => {
        try {
            const saved = JSON.parse(localStorage.getItem(LS_KEY) || '{}');
            if (saved.projectId) setProjectIdState(saved.projectId);
            if (saved.building) setBuildingState(saved.building);
            if (saved.section) setSectionState(saved.section);
        } catch { /* ignore */ }
    }, []);

    // --- Projects ---
    useEffect(() => {
        (async () => {
            const { data } = await supabase.from('projects').select('*').order('id');
            setProjects(data || []);
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
        setBuildings(Array.from(new Set((bld || []).map(u => u.building).filter(Boolean))));
        if (!building) {
            setSections([]);
            return;
        }
        const { data: sec } = await supabase
            .from('units')
            .select('section')
            .eq('project_id', projectId)
            .eq('building', building);
        setSections(Array.from(new Set((sec || []).map(u => u.section).filter(Boolean))));
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
