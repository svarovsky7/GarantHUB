import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/shared/api/supabaseClient';

export default function useProjectStructure() {
    const [projects, setProjects] = useState([]);
    const [projectId, setProjectId] = useState('');
    const [buildings, setBuildings] = useState([]);
    const [building, setBuilding] = useState('');
    const [sections, setSections] = useState([]);
    const [section, setSection] = useState('');

    // Оборачиваем refreshAll в useCallback, чтобы не было ворнинга React Hook useEffect has a missing dependency
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
        (async () => {
            const { data } = await supabase.from('projects').select('*').order('id');
            setProjects(data || []);
        })();
    }, []);

    useEffect(() => {
        refreshAll();
    }, [refreshAll]);

    return {
        projects, projectId, setProjectId,
        buildings, building, setBuilding,
        sections, section, setSection,
        refreshAll
    };
}
