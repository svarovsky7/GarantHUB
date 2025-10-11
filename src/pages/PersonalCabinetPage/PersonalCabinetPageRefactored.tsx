import React, { useMemo, useState } from 'react';
import { Typography, Alert, Spin } from 'antd';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/shared/store/authStore';
import { useClaimStatuses } from '@/entities/claimStatus';
import { useDefectStatuses } from '@/entities/defectStatus';
import { useStatuses } from '@/entities/status';

import ClaimViewModal from '@/features/claim/ClaimViewModal';
import DefectViewModal from '@/features/defect/DefectViewModal';
import EngineerCallModal from '@/features/engineerCall/EngineerCallModalModern.refactored';
import LetterViewModal from '@/features/correspondence/LetterViewModal';

import PageHeader from './ui/PageHeader';
import StatsCards from './ui/StatsCards';
import ClaimsSection from './ui/ClaimsSection';
import EngineerCallsSection from './ui/EngineerCallsSection';
import LettersSection from './ui/LettersSection';

import {
  useUserProjects,
  useUserClaims,
  useUserClaimsWithDefects,
  useUserLetters,
  useUserEngineerCalls
} from './model/usePersonalCabinetData';
import { usePersonalCabinetStats } from './model/usePersonalCabinetStats';
import {
  useUpdateClaimStatus,
  useUpdateDefectStatus,
  useUpdateEngineerCallStatus
} from './model/usePersonalCabinetMutations';

const { Title, Text } = Typography;

export default function PersonalCabinetPage() {
  const profile = useAuthStore((s) => s.profile);
  const queryClient = useQueryClient();

  // Modal states
  const [viewClaimId, setViewClaimId] = useState<number | null>(null);
  const [viewDefectId, setViewDefectId] = useState<number | null>(null);
  const [viewEngineerCallId, setViewEngineerCallId] = useState<number | null>(null);
  const [viewLetterId, setViewLetterId] = useState<number | null>(null);

  // Editing states
  const [editingClaimStatus, setEditingClaimStatus] = useState<number | null>(null);
  const [editingDefectStatus, setEditingDefectStatus] = useState<number | null>(null);
  const [editingCallStatus, setEditingCallStatus] = useState<number | null>(null);

  // Fetch statuses
  const { data: claimStatuses = [] } = useClaimStatuses();
  const { data: defectStatuses = [] } = useDefectStatuses();
  const { data: allStatuses = [] } = useStatuses();
  const engineerCallStatuses = allStatuses.filter(s => s.entity === 'engineer_call');

  // Fetch user data
  const { data: userProjects = [], isLoading: projectsLoading } = useUserProjects();
  const { data: claims = [], isLoading: claimsLoading } = useUserClaims(userProjects);
  const { data: claimsWithDefects = [], isLoading: claimsDefectsLoading } = useUserClaimsWithDefects(userProjects);
  const { data: letters = [], isLoading: lettersLoading } = useUserLetters(userProjects);
  const { data: engineerCalls = [], isLoading: callsLoading } = useUserEngineerCalls(userProjects);

  // Extract all defects from claims
  const allDefects = useMemo(() => {
    return claimsWithDefects.flatMap(claim => claim.defects || []);
  }, [claimsWithDefects]);

  // Calculate statistics
  const stats = usePersonalCabinetStats(claims, allDefects, letters, engineerCalls);

  // Mutations
  const updateClaimStatus = useUpdateClaimStatus(() => setEditingClaimStatus(null));
  const updateDefectStatus = useUpdateDefectStatus(() => setEditingDefectStatus(null));
  const updateEngineerCallStatus = useUpdateEngineerCallStatus(() => setEditingCallStatus(null));

  // Loading state
  const isLoading = claimsLoading || claimsDefectsLoading || lettersLoading || callsLoading || projectsLoading;

  console.log('[PersonalCabinetPage] Component rendered', {
    profile: profile?.email,
    profileId: profile?.id,
    userProjects,
    userProjectsCount: userProjects.length,
    viewClaimId,
    viewDefectId
  });

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (userProjects.length === 0) {
    return (
      <div style={{ padding: '24px' }}>
        <Title level={2}>Личный кабинет</Title>
        <Text type="secondary">
          {profile?.name || profile?.email} • {profile?.role}
        </Text>

        <Alert
          message="Нет доступных проектов"
          description="К вашему профилю не привязано ни одного проекта. Обратитесь к администратору для получения доступа к проектам."
          type="warning"
          showIcon
          style={{ marginTop: 24 }}
        />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <PageHeader
        userName={profile?.name}
        userEmail={profile?.email}
        userRole={profile?.role}
        projectsCount={userProjects.length}
      />

      <StatsCards stats={stats} />

      <div style={{ marginTop: 24 }}>
        <ClaimsSection
          claimsWithDefects={claimsWithDefects}
          claimStatuses={claimStatuses}
          defectStatuses={defectStatuses}
          editingClaimStatus={editingClaimStatus}
          editingDefectStatus={editingDefectStatus}
          onEditClaimStatus={setEditingClaimStatus}
          onUpdateClaimStatus={(claimId, statusId) =>
            updateClaimStatus.mutate({ claimId, statusId })
          }
          onCancelClaimEdit={() => setEditingClaimStatus(null)}
          onEditDefectStatus={setEditingDefectStatus}
          onUpdateDefectStatus={(defectId, statusId) =>
            updateDefectStatus.mutate({ defectId, statusId })
          }
          onCancelDefectEdit={() => setEditingDefectStatus(null)}
          onViewClaim={(id) => {
            console.log('[PersonalCabinetPage] Opening claim view modal for claim:', id);
            setViewClaimId(id);
          }}
          onViewDefect={(id) => {
            console.log('[PersonalCabinetPage] Opening defect view modal for defect:', id);
            setViewDefectId(id);
          }}
        />
      </div>

      <div style={{ marginTop: 24 }}>
        <EngineerCallsSection
          engineerCalls={engineerCalls}
          engineerCallStatuses={engineerCallStatuses}
          editingCallStatus={editingCallStatus}
          onEditCallStatus={(id) => {
            console.log('[PersonalCabinetPage] Starting to edit call status:', id);
            setEditingCallStatus(id);
          }}
          onUpdateCallStatus={(callId, status) =>
            updateEngineerCallStatus.mutate({ callId, status })
          }
          onCancelCallEdit={() => setEditingCallStatus(null)}
          onViewCall={(id) => {
            console.log('[PersonalCabinetPage] Opening engineer call view for:', id);
            setViewEngineerCallId(id);
          }}
        />
      </div>

      <div style={{ marginTop: 24 }}>
        <LettersSection
          letters={letters}
          onViewLetter={(id) => {
            console.log('[PersonalCabinetPage] Opening letter view for:', id);
            setViewLetterId(id);
          }}
        />
      </div>

      {/* Modals */}
      {viewClaimId && (
        <>
          {console.log('[PersonalCabinetPage] Rendering ClaimViewModal with id:', viewClaimId)}
          <ClaimViewModal
            claimId={viewClaimId}
            open={!!viewClaimId}
            onClose={() => {
              console.log('[PersonalCabinetPage] Closing claim modal');
              setViewClaimId(null);
            }}
          />
        </>
      )}

      {viewDefectId && (
        <>
          {console.log('[PersonalCabinetPage] Rendering DefectViewModal with id:', viewDefectId)}
          <DefectViewModal
            defectId={viewDefectId}
            open={!!viewDefectId}
            onClose={() => {
              console.log('[PersonalCabinetPage] Closing defect modal');
              setViewDefectId(null);
            }}
          />
        </>
      )}

      {viewEngineerCallId && (
        <>
          {console.log('[PersonalCabinetPage] Rendering EngineerCallModal with id:', viewEngineerCallId)}
          <EngineerCallModal
            visible={!!viewEngineerCallId}
            initialData={engineerCalls.find(c => c.id === viewEngineerCallId)}
            onClose={() => {
              console.log('[PersonalCabinetPage] Closing engineer call modal');
              setViewEngineerCallId(null);
            }}
            onSubmit={async () => {
              console.log('[PersonalCabinetPage] Engineer call updated successfully');
              queryClient.invalidateQueries({ queryKey: ['user-engineer-calls'] });
              setViewEngineerCallId(null);
            }}
          />
        </>
      )}

      {viewLetterId && (
        <>
          {console.log('[PersonalCabinetPage] Rendering LetterViewModal with id:', viewLetterId)}
          <LetterViewModal
            letterId={viewLetterId}
            open={!!viewLetterId}
            onClose={() => {
              console.log('[PersonalCabinetPage] Closing letter modal');
              setViewLetterId(null);
            }}
          />
        </>
      )}
    </div>
  );
}
