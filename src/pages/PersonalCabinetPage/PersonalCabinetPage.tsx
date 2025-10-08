import React, { useMemo, useState } from 'react';
import { Card, Col, Row, Statistic, Typography, Space, List, Tag, Empty, Spin, Table, Badge, Tooltip, Button, Select, message, Alert } from 'antd';
import { FileTextOutlined, ExclamationCircleOutlined, MailOutlined, CalendarOutlined, ToolOutlined, CheckCircleOutlined, ClockCircleOutlined, EyeOutlined, EditOutlined, UserOutlined, TeamOutlined } from '@ant-design/icons';
import ClaimViewModal from '@/features/claim/ClaimViewModal';
import DefectViewModal from '@/features/defect/DefectViewModal';
import EngineerCallModal from '@/features/engineerCall/EngineerCallModalModern';
import LetterViewModal from '@/features/correspondence/LetterViewModal';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabaseClient';
import { useAuthStore } from '@/shared/store/authStore';
import dayjs from 'dayjs';
import { useClaimStatuses } from '@/entities/claimStatus';
import { useDefectStatuses } from '@/entities/defectStatus';
import { useStatuses } from '@/entities/status';

const { Title, Text, Paragraph } = Typography;

export default function PersonalCabinetPage() {
  const profile = useAuthStore((s) => s.profile);
  
  // Состояния для модальных окон
  const [viewClaimId, setViewClaimId] = useState<number | null>(null);
  const [viewDefectId, setViewDefectId] = useState<number | null>(null);
  const [viewEngineerCallId, setViewEngineerCallId] = useState<number | null>(null);
  const [viewLetterId, setViewLetterId] = useState<number | null>(null);
  const [editingClaimStatus, setEditingClaimStatus] = useState<number | null>(null);
  const [editingDefectStatus, setEditingDefectStatus] = useState<number | null>(null);
  const [editingCallStatus, setEditingCallStatus] = useState<number | null>(null);
  
  const queryClient = useQueryClient();
  const { data: claimStatuses = [] } = useClaimStatuses();
  const { data: defectStatuses = [] } = useDefectStatuses();
  const { data: allStatuses = [] } = useStatuses();
  
  // Фильтруем статусы для вызовов инженера
  const engineerCallStatuses = allStatuses.filter(s => s.entity === 'engineer_call');
  
  // Получаем проекты пользователя из profiles_projects
  const { data: userProjects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ['user-projects', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      
      const { data, error } = await supabase
        .from('profiles_projects')
        .select('project_id')
        .eq('profile_id', profile.id);
      
      if (error) {
        console.error('[PersonalCabinetPage] Error fetching user projects:', error);
        throw error;
      }
      
      console.log('[PersonalCabinetPage] User projects:', data);
      return data?.map(p => p.project_id) || [];
    },
    enabled: !!profile?.id
  });

  console.log('[PersonalCabinetPage] Component rendered', {
    profile: profile?.email,
    profileId: profile?.id,
    userProjects,
    userProjectsCount: userProjects.length,
    viewClaimId,
    viewDefectId
  });
  
  // Получаем детальную информацию о претензиях с дефектами
  const { data: claimsWithDefects = [], isLoading: claimsDefectsLoading } = useQuery({
    queryKey: ['user-claims-with-defects', profile?.id, userProjects],
    queryFn: async () => {
      console.log('[PersonalCabinetPage] Fetching claims with defects for user:', profile?.email, 'userProjects:', userProjects);
      if (!profile?.id || userProjects.length === 0) return [];
      
      // Получаем претензии где пользователь - инженер и проект в списке проектов пользователя
      let claimsQuery = supabase
        .from('claims')
        .select(`
          *,
          claim_status:claim_status_id(name, color),
          units:claim_units(unit:unit_id(id, name, building, floor)),
          project:project_id(name)
        `)
        .eq('engineer_id', profile.id)
        .in('project_id', userProjects)
        .order('created_at', { ascending: false });
      
      const { data: claims, error: claimsError } = await claimsQuery;
      if (claimsError) {
        console.error('[PersonalCabinetPage] Error fetching claims:', claimsError);
        throw claimsError;
      }
      console.log('[PersonalCabinetPage] Fetched claims:', claims?.length || 0);
      
      // Для каждой претензии получаем её дефекты
      const claimsWithDefectsData = await Promise.all(
        (claims || []).map(async (claim) => {
          // Сначала получаем IDs дефектов для претензии
          const { data: claimDefects } = await supabase
            .from('claim_defects')
            .select('defect_id')
            .eq('claim_id', claim.id);
          
          const defectIds = claimDefects?.map(d => d.defect_id) || [];
          
          // Затем получаем сами дефекты без расширения связей (из-за неоднозначности)
          const { data: defects, error: defectsError } = defectIds.length > 0
            ? await supabase
                .from('defects')
                .select('*')
                .in('id', defectIds)
                .order('created_at', { ascending: false })
            : { data: [], error: null };
          
          // Получаем связанные данные отдельно
          let defectsWithRelations = defects || [];
          if (defects && defects.length > 0) {
            // Получаем статусы
            const statusIds = [...new Set(defects.map(d => d.status_id).filter(Boolean))];
            const { data: statuses } = statusIds.length > 0 
              ? await supabase.from('statuses').select('*').in('id', statusIds)
              : { data: [] };
            const statusMap = new Map(statuses?.map(s => [s.id, s]) || []);
            
            // Получаем типы дефектов
            const typeIds = [...new Set(defects.map(d => d.type_id).filter(Boolean))];
            const { data: types } = typeIds.length > 0
              ? await supabase.from('defect_types').select('*').in('id', typeIds)
              : { data: [] };
            const typeMap = new Map(types?.map(t => [t.id, t]) || []);
            
            // Получаем бригады
            const brigadeIds = [...new Set(defects.map(d => d.brigade_id).filter(Boolean))];
            const { data: brigades } = brigadeIds.length > 0
              ? await supabase.from('brigades').select('*').in('id', brigadeIds)
              : { data: [] };
            const brigadeMap = new Map(brigades?.map(b => [b.id, b]) || []);
            
            // Получаем подрядчиков
            const contractorIds = [...new Set(defects.map(d => d.contractor_id).filter(Boolean))];
            const { data: contractors } = contractorIds.length > 0
              ? await supabase.from('contractors').select('*').in('id', contractorIds)
              : { data: [] };
            const contractorMap = new Map(contractors?.map(c => [c.id, c]) || []);
            
            // Объединяем все данные
            defectsWithRelations = defects.map(d => ({
              ...d,
              status: d.status_id ? statusMap.get(d.status_id) : null,
              type: d.type_id ? typeMap.get(d.type_id) : null,
              brigade: d.brigade_id ? brigadeMap.get(d.brigade_id) : null,
              contractor: d.contractor_id ? contractorMap.get(d.contractor_id) : null
            }));
          }
          
          if (defectsError) console.error('[PersonalCabinetPage] Error loading defects:', defectsError);
          console.log(`[PersonalCabinetPage] Loaded ${defectsWithRelations.length} defects for claim ${claim.claim_no}`);
          
          return {
            ...claim,
            defects: defectsWithRelations
          };
        })
      );
      
      console.log('[PersonalCabinetPage] Total claims with defects loaded:', claimsWithDefectsData.length);
      return claimsWithDefectsData;
    },
    enabled: !!profile?.id && userProjects.length > 0
  });

  // Получаем претензии пользователя
  const { data: claims = [], isLoading: claimsLoading } = useQuery({
    queryKey: ['user-claims', profile?.id, userProjects],
    queryFn: async () => {
      if (!profile?.id || userProjects.length === 0) return [];
      
      let query = supabase
        .from('claims')
        .select(`
          *,
          claim_status:claim_status_id(name, color)
        `)
        .eq('engineer_id', profile?.id)
        .in('project_id', userProjects);
      
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.id && userProjects.length > 0
  });

  // Получаем все дефекты где пользователь - инженер (через претензии)
  const allDefects = useMemo(() => {
    return claimsWithDefects.flatMap(claim => claim.defects || []);
  }, [claimsWithDefects]);

  // Получаем письма пользователя (используем responsible_user_id для проверки)
  const { data: letters = [], isLoading: lettersLoading } = useQuery({
    queryKey: ['user-letters', profile?.id, userProjects],
    queryFn: async () => {
      if (!profile?.id || userProjects.length === 0) return [];
      
      let query = supabase
        .from('letters')
        .select(`
          *,
          sender_person:sender_person_id(full_name),
          sender_contractor:sender_contractor_id(name),
          receiver_person:receiver_person_id(full_name),
          receiver_contractor:receiver_contractor_id(name),
          status:status_id(name, color)
        `)
        .eq('responsible_user_id', profile?.id)
        .in('project_id', userProjects);
      
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.id && userProjects.length > 0
  });

  // Получаем вызовы инженера с дополнительной информацией
  const { data: engineerCalls = [], isLoading: callsLoading } = useQuery({
    queryKey: ['user-engineer-calls', profile?.id, userProjects],
    queryFn: async () => {
      if (!profile?.id || userProjects.length === 0) return [];
      
      let query = supabase
        .from('engineer_calls')
        .select(`
          *,
          project:projects(id, name),
          unit:units(id, name, floor, building),
          claim:claims(id, claim_no)
        `)
        .eq('engineer_id', profile?.id)
        .in('project_id', userProjects);
      
      const { data, error } = await query.order('start_datetime', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.id && userProjects.length > 0
  });

  // Мутации для обновления статусов
  const updateClaimStatus = useMutation({
    mutationFn: async ({ claimId, statusId }: { claimId: number; statusId: number }) => {
      console.log('[PersonalCabinetPage] Updating claim status:', { claimId, statusId });
      const { error } = await supabase
        .from('claims')
        .update({ claim_status_id: statusId })
        .eq('id', claimId);
      if (error) throw error;
    },
    onSuccess: () => {
      message.success('Статус претензии обновлен');
      queryClient.invalidateQueries({ queryKey: ['user-claims-with-defects'] });
      queryClient.invalidateQueries({ queryKey: ['user-claims'] });
      setEditingClaimStatus(null);
    },
    onError: (error: any) => {
      console.error('[PersonalCabinetPage] Error updating claim status:', error);
      message.error('Ошибка при обновлении статуса претензии');
    },
  });
  
  const updateDefectStatus = useMutation({
    mutationFn: async ({ defectId, statusId }: { defectId: number; statusId: number }) => {
      console.log('[PersonalCabinetPage] Updating defect status:', { defectId, statusId });
      const { error } = await supabase
        .from('defects')
        .update({ status_id: statusId })
        .eq('id', defectId);
      if (error) throw error;
    },
    onSuccess: () => {
      message.success('Статус дефекта обновлен');
      queryClient.invalidateQueries({ queryKey: ['user-claims-with-defects'] });
      setEditingDefectStatus(null);
    },
    onError: (error: any) => {
      console.error('[PersonalCabinetPage] Error updating defect status:', error);
      message.error('Ошибка при обновлении статуса дефекта');
    },
  });
  
  const updateEngineerCallStatus = useMutation({
    mutationFn: async ({ callId, status }: { callId: number; status: string }) => {
      console.log('[PersonalCabinetPage] Updating engineer call status:', { callId, status });
      const { error } = await supabase
        .from('engineer_calls')
        .update({ status })
        .eq('id', callId);
      if (error) throw error;
    },
    onSuccess: () => {
      message.success('Статус вызова обновлен');
      queryClient.invalidateQueries({ queryKey: ['user-engineer-calls'] });
      setEditingCallStatus(null);
    },
    onError: (error: any) => {
      console.error('[PersonalCabinetPage] Error updating call status:', error);
      message.error('Ошибка при обновлении статуса вызова');
    },
  });

  // Статистика
  const stats = useMemo(() => {
    const activeClaims = claims.filter(c => 
      c.claim_status?.name !== 'Закрыта' && c.claim_status?.name !== 'Отклонена'
    ).length;
    
    const activeDefects = allDefects.filter(d => 
      d.status?.name !== 'Устранен' && d.status?.name !== 'Закрыт'
    ).length;
    
    const unreadLetters = letters.filter(l => 
      l.status?.name === 'Новое' || l.status?.name === 'Не прочитано'
    ).length;
    
    const upcomingCalls = engineerCalls.filter(c => 
      dayjs(c.start_datetime).isAfter(dayjs()) && c.status !== 'completed'
    ).length;

    return {
      activeClaims,
      totalClaims: claims.length,
      activeDefects,
      totalDefects: allDefects.length,
      unreadLetters,
      totalLetters: letters.length,
      upcomingCalls,
      totalCalls: engineerCalls.length
    };
  }, [claims, allDefects, letters, engineerCalls, profile]);

  const isLoading = claimsLoading || claimsDefectsLoading || lettersLoading || callsLoading || projectsLoading;

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <Spin size="large" />
      </div>
    );
  }

  // Если у пользователя нет проектов
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
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={2} style={{ marginBottom: 0 }}>Личный кабинет</Title>
          <Text type="secondary">
            {profile?.name || profile?.email} • {profile?.role}
          </Text>
        </Col>
        <Col>
          <Alert
            message={`Показаны данные по ${userProjects.length} проектам`}
            type="info"
            showIcon
          />
        </Col>
      </Row>

      {/* Статистика */}
      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Активные претензии"
              value={stats.activeClaims}
              suffix={`/ ${stats.totalClaims}`}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: stats.activeClaims > 0 ? '#cf1322' : '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Активные дефекты"
              value={stats.activeDefects}
              suffix={`/ ${stats.totalDefects}`}
              prefix={<ExclamationCircleOutlined />}
              valueStyle={{ color: stats.activeDefects > 0 ? '#fa8c16' : '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Непрочитанные письма"
              value={stats.unreadLetters}
              suffix={`/ ${stats.totalLetters}`}
              prefix={<MailOutlined />}
              valueStyle={{ color: stats.unreadLetters > 0 ? '#1890ff' : undefined }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Предстоящие вызовы"
              value={stats.upcomingCalls}
              suffix={`/ ${stats.totalCalls}`}
              prefix={<CalendarOutlined />}
              valueStyle={{ color: stats.upcomingCalls > 0 ? '#52c41a' : undefined }}
            />
          </Card>
        </Col>
      </Row>


      {/* Таблица претензий с дефектами */}
      <Card title="Мои претензии и дефекты" style={{ marginTop: 24 }}>
        {claimsWithDefects.length > 0 ? (
          <Table
            dataSource={claimsWithDefects}
            rowKey="id"
            pagination={{ pageSize: 10 }}
            expandable={{
              expandedRowRender: (claim) => claim.defects && claim.defects.length > 0 ? (
                <div>
                  <Typography.Text strong style={{ marginBottom: 8, display: 'block' }}>
                    Дефекты претензии №{claim.claim_no}:
                  </Typography.Text>
                  <Table
                  dataSource={claim.defects}
                  rowKey="id"
                  pagination={false}
                  size="small"
                  columns={[
                    {
                      title: 'Тип дефекта',
                      dataIndex: ['type', 'name'],
                      key: 'type',
                      sorter: (a, b) => (a.type?.name || '').localeCompare(b.type?.name || ''),
                      render: (text) => text || '-',
                    },
                    {
                      title: 'Описание',
                      dataIndex: 'description',
                      key: 'description',
                      ellipsis: true,
                      sorter: (a, b) => (a.description || '').localeCompare(b.description || ''),
                    },
                    {
                      title: 'Статус',
                      dataIndex: ['status', 'name'],
                      key: 'status',
                      sorter: (a, b) => (a.status?.name || '').localeCompare(b.status?.name || ''),
                      render: (text, record) => {
                        if (editingDefectStatus === record.id) {
                          return (
                            <Select
                              size="small"
                              style={{ width: '100%' }}
                              value={record.status_id}
                              onChange={(value) => {
                                updateDefectStatus.mutate({ defectId: record.id, statusId: value });
                              }}
                              onBlur={() => setEditingDefectStatus(null)}
                              autoFocus
                            >
                              {defectStatuses.map(status => (
                                <Select.Option key={status.id} value={status.id}>
                                  <Tag color={status.color}>{status.name}</Tag>
                                </Select.Option>
                              ))}
                            </Select>
                          );
                        }
                        return (
                          <Tag 
                            color={record.status?.color}
                            style={{ cursor: 'pointer' }}
                            onClick={() => setEditingDefectStatus(record.id)}
                          >
                            {text || '-'}
                          </Tag>
                        );
                      },
                    },
                    {
                      title: 'Исполнитель',
                      key: 'executor',
                      sorter: (a, b) => {
                        const aExec = a.brigade?.name || a.contractor?.name || '';
                        const bExec = b.brigade?.name || b.contractor?.name || '';
                        return aExec.localeCompare(bExec);
                      },
                      render: (_, record) => (
                        <Text type="secondary">
                          {record.brigade?.name || record.contractor?.name || '-'}
                        </Text>
                      ),
                    },
                    {
                      title: 'Получен',
                      dataIndex: 'received_at',
                      key: 'received_at',
                      sorter: (a, b) => {
                        if (!a.received_at) return 1;
                        if (!b.received_at) return -1;
                        return dayjs(a.received_at).unix() - dayjs(b.received_at).unix();
                      },
                      render: (date) => date ? dayjs(date).format('DD.MM.YYYY') : '-',
                    },
                    {
                      title: 'Устранен',
                      dataIndex: 'fixed_at',
                      key: 'fixed_at',
                      sorter: (a, b) => {
                        if (!a.fixed_at) return 1;
                        if (!b.fixed_at) return -1;
                        return dayjs(a.fixed_at).unix() - dayjs(b.fixed_at).unix();
                      },
                      render: (date) => date ? dayjs(date).format('DD.MM.YYYY') : '-',
                    },
                    {
                      title: 'Гарантия',
                      dataIndex: 'is_warranty',
                      key: 'is_warranty',
                      align: 'center',
                      sorter: (a, b) => (a.is_warranty ? 1 : 0) - (b.is_warranty ? 1 : 0),
                      render: (isWarranty) => (
                        isWarranty ? 
                          <CheckCircleOutlined style={{ color: '#52c41a' }} /> : 
                          <ClockCircleOutlined style={{ color: '#8c8c8c' }} />
                      ),
                    },
                    {
                      title: 'Действия',
                      key: 'actions',
                      align: 'center',
                      render: (_, record) => (
                        <Tooltip title="Просмотр дефекта">
                          <Button
                            type="link"
                            size="small"
                            icon={<EyeOutlined />}
                            onClick={() => {
                              console.log('[PersonalCabinetPage] Opening defect view modal for defect:', record.id);
                              setViewDefectId(record.id);
                            }}
                          />
                        </Tooltip>
                      ),
                    },
                  ]}
                />
                </div>
              ) : (
                <Typography.Text type="secondary">Нет дефектов</Typography.Text>
              ),
              rowExpandable: (record) => record.defects && record.defects.length > 0,
            }}
            columns={[
              {
                title: '№ претензии',
                dataIndex: 'claim_no',
                key: 'claim_no',
                sorter: (a, b) => a.claim_no.localeCompare(b.claim_no),
                render: (text) => <Text strong>{text}</Text>,
              },
              {
                title: 'Проект',
                dataIndex: ['project', 'name'],
                key: 'project',
                ellipsis: true,
                sorter: (a, b) => (a.project?.name || '').localeCompare(b.project?.name || ''),
              },
              {
                title: 'Объекты',
                key: 'units',
                ellipsis: true,
                sorter: (a, b) => {
                  const aUnits = a.units?.map(u => u.unit?.name || '').join('') || '';
                  const bUnits = b.units?.map(u => u.unit?.name || '').join('') || '';
                  return aUnits.localeCompare(bUnits);
                },
                render: (_, record) => {
                  const units = record.units?.map(u => {
                    const floor = u.unit?.floor ? `Этаж ${u.unit.floor}` : '';
                    const name = u.unit?.name ? `Объект ${u.unit.name}` : '';
                    return [floor, name].filter(Boolean).join(', ');
                  }).filter(Boolean).join('; ');
                  return (
                    <Tooltip title={units}>
                      <Text>{units || '-'}</Text>
                    </Tooltip>
                  );
                },
              },
              {
                title: 'Статус',
                dataIndex: ['claim_status', 'name'],
                key: 'status',
                sorter: (a, b) => (a.claim_status?.name || '').localeCompare(b.claim_status?.name || ''),
                render: (text, record) => {
                  if (editingClaimStatus === record.id) {
                    return (
                      <Select
                        size="small"
                        style={{ width: '100%' }}
                        value={record.claim_status_id}
                        onChange={(value) => {
                          updateClaimStatus.mutate({ claimId: record.id, statusId: value });
                        }}
                        onBlur={() => setEditingClaimStatus(null)}
                        autoFocus
                      >
                        {claimStatuses.map(status => (
                          <Select.Option key={status.id} value={status.id}>
                            <Tag color={status.color}>{status.name}</Tag>
                          </Select.Option>
                        ))}
                      </Select>
                    );
                  }
                  return (
                    <Tag 
                      color={record.claim_status?.color}
                      style={{ cursor: 'pointer' }}
                      onClick={() => setEditingClaimStatus(record.id)}
                    >
                      {text}
                    </Tag>
                  );
                },
              },
              {
                title: 'Дефектов',
                key: 'defects_count',
                align: 'center',
                sorter: (a, b) => (a.defects?.length || 0) - (b.defects?.length || 0),
                render: (_, record) => (
                  <Badge count={record.defects?.length || 0} showZero>
                    <ToolOutlined style={{ fontSize: 16 }} />
                  </Badge>
                ),
              },
              {
                title: 'Дата создания',
                dataIndex: 'created_at',
                key: 'created_at',
                sorter: (a, b) => dayjs(a.created_at).unix() - dayjs(b.created_at).unix(),
                render: (date) => dayjs(date).format('DD.MM.YYYY'),
              },
              {
                title: 'Принята',
                dataIndex: 'accepted_on',
                key: 'accepted_on',
                sorter: (a, b) => {
                  if (!a.accepted_on) return 1;
                  if (!b.accepted_on) return -1;
                  return dayjs(a.accepted_on).unix() - dayjs(b.accepted_on).unix();
                },
                render: (date) => date ? dayjs(date).format('DD.MM.YYYY') : '-',
              },
              {
                title: 'Прошло дней',
                key: 'days_since_accepted',
                align: 'center',
                sorter: (a, b) => {
                  const aDays = a.accepted_on ? dayjs().diff(dayjs(a.accepted_on), 'day') : 0;
                  const bDays = b.accepted_on ? dayjs().diff(dayjs(b.accepted_on), 'day') : 0;
                  return aDays - bDays;
                },
                render: (_, record) => {
                  if (!record.accepted_on) return '-';
                  const days = dayjs().diff(dayjs(record.accepted_on), 'day');
                  let color = '#52c41a'; // зеленый для меньше 30 дней
                  if (days > 60) color = '#f5222d'; // красный для больше 60 дней
                  else if (days > 30) color = '#fa8c16'; // оранжевый для 30-60 дней
                  return (
                    <Badge 
                      count={days} 
                      style={{ backgroundColor: color }}
                      overflowCount={999}
                    />
                  );
                },
              },
              {
                title: 'Действия',
                key: 'actions',
                align: 'center',
                render: (_, record) => (
                  <Space>
                    <Tooltip title="Просмотр и редактирование">
                      <Button
                        type="link"
                        icon={<EyeOutlined />}
                        onClick={() => {
                          console.log('[PersonalCabinetPage] Opening claim view modal for claim:', record.id, record.claim_no);
                          setViewClaimId(record.id);
                        }}
                      />
                    </Tooltip>
                  </Space>
                ),
              },
            ]}
          />
        ) : (
          <Empty description="Нет претензий" />
        )}
      </Card>

      {/* Предстоящие вызовы */}
      <Card title="Предстоящие вызовы инженера" style={{ marginTop: 24 }}>
        {engineerCalls.filter(c => dayjs(c.start_datetime).isAfter(dayjs())).length > 0 ? (
          <List
            dataSource={engineerCalls
              .filter(c => dayjs(c.start_datetime).isAfter(dayjs()))
              .slice(0, 5)}
            renderItem={(call) => (
              <List.Item>
                <List.Item.Meta
                  title={
                    <Space>
                      <CalendarOutlined />
                      <Text strong>
                        {dayjs(call.start_datetime).format('DD.MM.YYYY HH:mm')}
                      </Text>
                      {call.status && (
                        editingCallStatus === call.id ? (
                          <Select
                            size="small"
                            value={call.status}
                            onChange={(value) => {
                              updateEngineerCallStatus.mutate({
                                callId: call.id,
                                status: value
                              });
                            }}
                            onBlur={() => setEditingCallStatus(null)}
                            style={{ width: 150 }}
                            autoFocus
                          >
                            {engineerCallStatuses.length > 0 ? (
                              engineerCallStatuses.map(status => (
                                <Select.Option key={status.id} value={status.name}>
                                  <Badge color={status.color || '#d9d9d9'} text={status.name} />
                                </Select.Option>
                              ))
                            ) : (
                              <>
                                <Select.Option value="scheduled">Запланирован</Select.Option>
                                <Select.Option value="in_progress">В процессе</Select.Option>
                                <Select.Option value="completed">Завершен</Select.Option>
                                <Select.Option value="cancelled">Отменен</Select.Option>
                              </>
                            )}
                          </Select>
                        ) : (
                          <Tag
                            style={{ cursor: 'pointer' }}
                            onClick={() => {
                              console.log('[PersonalCabinetPage] Starting to edit call status:', call.id);
                              setEditingCallStatus(call.id);
                            }}
                            color={
                              engineerCallStatuses.find(s => s.name === call.status)?.color ||
                              (call.status === 'completed' ? 'green' : 
                               call.status === 'cancelled' ? 'red' :
                               call.status === 'in_progress' ? 'orange' : 'blue')
                            }
                          >
                            {call.status}
                          </Tag>
                        )
                      )}
                      <Tooltip title="Просмотр вызова">
                        <Button
                          type="text"
                          size="small"
                          icon={<EyeOutlined />}
                          onClick={() => {
                            console.log('[PersonalCabinetPage] Opening engineer call view for:', call.id);
                            setViewEngineerCallId(call.id);
                          }}
                        />
                      </Tooltip>
                    </Space>
                  }
                  description={
                    <Space direction="vertical" size="small" style={{ width: '100%' }}>
                      <Text>{call.title || call.description}</Text>
                      
                      <Space wrap size="small">
                        {call.project && (
                          <Tag icon={<FileTextOutlined />} color="blue">
                            Проект: {call.project.name}
                          </Tag>
                        )}
                        
                        {call.unit && (
                          <>
                            {call.unit.building && (
                              <Tag color="cyan">
                                Корпус: {call.unit.building}
                              </Tag>
                            )}
                            {call.unit.floor && (
                              <Tag color="purple">
                                Этаж: {call.unit.floor}
                              </Tag>
                            )}
                            <Tag color="green">
                              Квартира: {call.unit.name}
                            </Tag>
                          </>
                        )}
                        
                        {call.claim && (
                          <Tag icon={<ExclamationCircleOutlined />} color="orange">
                            Претензия №{call.claim.claim_no}
                          </Tag>
                        )}
                      </Space>
                      
                      {call.notes && <Text type="secondary">Заметки: {call.notes}</Text>}
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        ) : (
          <Empty description="Нет предстоящих вызовов" />
        )}
      </Card>

      {/* Письма пользователя */}
      <Card title="Мои письма" style={{ marginTop: 24 }}>
        {letters.length > 0 ? (
          <Table
            dataSource={letters}
            rowKey="id"
            pagination={{ pageSize: 10 }}
            columns={[
              {
                title: 'Дата',
                dataIndex: 'created_at',
                key: 'created_at',
                render: (date) => dayjs(date).format('DD.MM.YYYY'),
                sorter: (a, b) => dayjs(a.created_at).unix() - dayjs(b.created_at).unix(),
                defaultSortOrder: 'descend' as const,
              },
              {
                title: 'Номер',
                dataIndex: 'number',
                key: 'number',
                sorter: (a, b) => (a.number || 0) - (b.number || 0),
                render: (number) => (
                  <Text strong>№{number}</Text>
                ),
              },
              {
                title: 'Тема',
                dataIndex: 'theme',
                key: 'theme',
                ellipsis: true,
                sorter: (a, b) => (a.theme || '').localeCompare(b.theme || ''),
                render: (theme) => theme || <Text type="secondary">Без темы</Text>,
              },
              {
                title: 'Отправитель',
                key: 'sender',
                render: (_, record) => {
                  if (record.sender_person) {
                    return <Tag icon={<UserOutlined />}>{record.sender_person.full_name}</Tag>;
                  }
                  if (record.sender_contractor) {
                    return <Tag icon={<TeamOutlined />} color="blue">{record.sender_contractor.name}</Tag>;
                  }
                  return <Text type="secondary">—</Text>;
                },
              },
              {
                title: 'Получатель',
                key: 'receiver',
                render: (_, record) => {
                  if (record.receiver_person) {
                    return <Tag icon={<UserOutlined />}>{record.receiver_person.full_name}</Tag>;
                  }
                  if (record.receiver_contractor) {
                    return <Tag icon={<TeamOutlined />} color="green">{record.receiver_contractor.name}</Tag>;
                  }
                  return <Text type="secondary">—</Text>;
                },
              },
              {
                title: 'Статус',
                dataIndex: 'status',
                key: 'status',
                sorter: (a, b) => (a.status?.name || '').localeCompare(b.status?.name || ''),
                render: (status) => status ? (
                  <Badge 
                    color={status.color || '#d9d9d9'} 
                    text={status.name}
                  />
                ) : (
                  <Text type="secondary">—</Text>
                ),
              },
              {
                title: 'Действия',
                key: 'actions',
                align: 'center',
                render: (_, record) => (
                  <Tooltip title="Просмотр письма">
                    <Button
                      type="link"
                      icon={<EyeOutlined />}
                      onClick={() => {
                        console.log('[PersonalCabinetPage] Opening letter view for:', record.id);
                        setViewLetterId(record.id);
                      }}
                    />
                  </Tooltip>
                ),
              },
            ]}
          />
        ) : (
          <Empty description="Нет писем" />
        )}
      </Card>
      
      {/* Модальное окно для просмотра/редактирования претензии */}
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
      
      {/* Модальное окно для просмотра дефекта */}
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
      
      {/* Модальное окно для просмотра вызова инженера */}
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
      
      {/* Модальное окно для просмотра письма */}
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