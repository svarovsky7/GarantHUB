import React, { useEffect, useImperativeHandle } from 'react';
import type { Dayjs } from 'dayjs';
import {
  Form,
  Input,
  Select,
  DatePicker,
  Row,
  Col,
  Button,
  Skeleton,
  Switch,
} from 'antd';
import {
  useClaim,
  useClaimAll,
  useUpdateClaim,
  useAddClaimAttachments,
  useRemoveClaimAttachment,
  signedUrl,
} from '@/entities/claim';
import { supabase } from '@/shared/api/supabaseClient';
import { useVisibleProjects } from '@/entities/project';
import { useUnitsByProject } from '@/entities/unit';
import { useUsers } from '@/entities/user';
import { useClaimStatuses } from '@/entities/claimStatus';
import { useNotify } from '@/shared/hooks/useNotify';
import { useProjectId } from '@/shared/hooks/useProjectId';
import { useAuthStore } from '@/shared/store/authStore';
import { useRolePermission } from '@/entities/rolePermission';
import type { RoleName } from '@/shared/types/rolePermission';
import { useChangedFields } from '@/shared/hooks/useChangedFields';
import AttachmentEditorTable from '@/shared/ui/AttachmentEditorTable';
import FileDropZone from '@/shared/ui/FileDropZone';
import { useClaimAttachments } from './model/useClaimAttachments';
import type { RemoteClaimFile } from '@/shared/types/claimFile';
import type { ClaimFormAntdEditRef } from '@/shared/types/claimFormAntdEditRef';

export interface ClaimFormAntdEditProps {
  claimId: string | number;
  onCancel?: () => void;
  /**
   * Вызывается после успешного сохранения формы
   * @param isOfficial актуальное значение признака официальности
   */
  onSaved?: (isOfficial: boolean) => void;
  embedded?: boolean;
  /** Показывать блок работы с файлами */
  showAttachments?: boolean;
  /** Внешнее состояние вложений */
  attachmentsState?: ReturnType<typeof useClaimAttachments>;
  /** Скрыть кнопки действия */
  hideActions?: boolean;
}

export interface ClaimFormAntdEditValues {
  project_id: number | null;
  unit_ids: number[];
  claim_status_id: number | null;
  claim_no: string;
  claimed_on: Dayjs | null;
  accepted_on: Dayjs | null;
  registered_on: Dayjs | null;
  engineer_id: string | null;
  is_official: boolean;
  description: string | null;
}

const ClaimFormAntdEdit = React.forwardRef<
  ClaimFormAntdEditRef,
  ClaimFormAntdEditProps
>(function ClaimFormAntdEdit(
  {
    claimId,
    onCancel,
    onSaved,
    embedded = false,
    showAttachments = true,
    attachmentsState,
    hideActions = false,
  }: ClaimFormAntdEditProps,
  ref,
) {
  const [form] = Form.useForm<ClaimFormAntdEditValues>();
  const role = useAuthStore((s) => s.profile?.role as RoleName | undefined);
  const { data: perm } = useRolePermission(role);
  const claimAssigned = useClaim(claimId);
  const claimAll = useClaimAll(claimId);
  const claim = perm?.only_assigned_project ? claimAssigned.data : claimAll.data;
  const { data: projects = [] } = useVisibleProjects();
  const globalProjectId = useProjectId();
  const projectIdWatch = Form.useWatch('project_id', form);
  const projectId = projectIdWatch != null ? Number(projectIdWatch) : globalProjectId;
  const { data: units = [] } = useUnitsByProject(projectId);
  const { data: users = [] } = useUsers();
  const { data: statuses = [] } = useClaimStatuses();
  const update = useUpdateClaim();
  const addAtt = useAddClaimAttachments();
  const removeAtt = useRemoveClaimAttachment();
  const notify = useNotify();
  const userId = useAuthStore((s) => s.profile?.id) ?? null;
  const attachments =
    attachmentsState ?? useClaimAttachments({ claim: claim as any });
  const { changedFields, handleValuesChange } = useChangedFields(form, [claim]);

  useImperativeHandle(ref, () => ({
    submit: () => form.submit(),
    isSubmitting: update.isPending,
  }));

  const highlight = (name: keyof ClaimFormAntdEditValues) =>
    changedFields[name as string]
      ? { background: '#fffbe6', padding: 4, borderRadius: 2 }
      : {};

  useEffect(() => {
    if (!claim) return;
    form.setFieldsValue({
      project_id: claim.project_id,
      unit_ids: claim.unit_ids,
      claim_status_id: claim.claim_status_id,
      claim_no: claim.claim_no,
      claimed_on: claim.claimedOn ?? null,
      accepted_on: claim.acceptedOn ?? null,
      registered_on: claim.registeredOn ?? null,
      engineer_id: claim.engineer_id ?? null,
      description: claim.description ?? '',
      is_official: claim.is_official ?? false,
    });
  }, [claim, form]);

  const onFinish = async (values: ClaimFormAntdEditValues) => {
    if (!claim) return;
    try {
      await update.mutateAsync({
        id: claim.id,
        updates: {
          project_id: values.project_id ?? claim.project_id,
          unit_ids: values.unit_ids,
          claim_status_id: values.claim_status_id,
          claim_no: values.claim_no,
          claimed_on: values.claimed_on
            ? values.claimed_on.format('YYYY-MM-DD')
            : null,
          accepted_on: values.accepted_on
            ? values.accepted_on.format('YYYY-MM-DD')
            : null,
          registered_on: values.registered_on
            ? values.registered_on.format('YYYY-MM-DD')
            : null,
          engineer_id: values.engineer_id ?? null,
          is_official: values.is_official,
          description: values.description ?? '',
          updated_by: userId ?? undefined,
        } as any,
      });

      if (!claim.is_official && values.is_official) {
        await supabase
          .from('claim_defects')
          .update({ is_official: true })
          .eq('claim_id', claim.id);
      }

      // если претензия перестала быть официальной, обновляем связанные дефекты
      if (claim.is_official && !values.is_official) {
        await supabase
          .from('claim_defects')
          .update({ is_official: false })
          .eq('claim_id', claim.id);
      }

      for (const id of attachments.removedIds) {
        await removeAtt.mutateAsync({
          claimId: claim.id,
          attachmentId: Number(id),
        });
      }
      let uploaded: RemoteClaimFile[] = [];
      if (attachments.newFiles.length) {
        const res = await addAtt.mutateAsync({
          claimId: claim.id,
          files: attachments.newFiles.map((f) => f.file),
        });
        uploaded = res.map((u) => ({
          id: u.id,
          name: u.original_name ?? u.storage_path.split('/').pop() ?? 'file',
          original_name: u.original_name ?? null,
          path: u.storage_path,
          url: u.file_url,
          mime_type: u.file_type,
        }));
      attachments.appendRemote(uploaded);
      }
      attachments.markPersisted();
      notify.success('Претензия обновлена');
      onSaved?.(values.is_official);
    } catch (e: any) {
      notify.error(e.message);
    }
  };

  if (!claim) return <Skeleton active />;

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onFinish}
      onValuesChange={handleValuesChange}
      style={{ maxWidth: embedded ? 'none' : 640 }}
      autoComplete="off"
    >
      <Row gutter={16}>
        <Col span={8}>
          <Form.Item
            name="project_id"
            label="Проект"
            rules={[{ required: true }]}
            style={highlight('project_id')}
          >
            <Select allowClear options={projects.map((p) => ({ value: p.id, label: p.name }))} />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            name="unit_ids"
            label="Объекты"
            rules={[{ required: true }]}
            style={highlight('unit_ids')}
          >
            <Select
              mode="multiple"
              options={units.map((u) => ({ value: u.id, label: u.name }))}
              disabled={!projectId}
            />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            name="engineer_id"
            label="Закрепленный инженер"
            rules={[{ required: true }]}
            style={highlight('engineer_id')}
          >
            <Select allowClear showSearch options={users.map((u) => ({ value: u.id, label: u.name }))} />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={8}>
          <Form.Item
            name="claim_no"
            label="№ претензии"
            rules={[{ required: true }]}
            style={highlight('claim_no')}
          >
            <Input />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name="claimed_on" label="Дата претензии" style={highlight('claimed_on')}>
            <DatePicker format="DD.MM.YYYY" style={{ width: '100%' }} />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            name="accepted_on"
            label="Дата получения претензии Застройщиком"
            style={highlight('accepted_on')}
          >
            <DatePicker format="DD.MM.YYYY" style={{ width: '100%' }} />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={8}>
          <Form.Item
            name="registered_on"
            label="Дата регистрации претензии GARANTHUB"
            style={highlight('registered_on')}
          >
            <DatePicker format="DD.MM.YYYY" style={{ width: '100%' }} />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            name="claim_status_id"
            label="Статус"
            rules={[{ required: true }]}
            style={highlight('claim_status_id')}
          >
            <Select showSearch options={statuses.map((s) => ({ value: s.id, label: s.name }))} />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={24}>
          <Form.Item name="description" label="Дополнительная информация" style={highlight('description')}>
            <Input.TextArea rows={2} />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={8}>
          <Form.Item
            name="is_official"
            label="Официальная претензия"
            valuePropName="checked"
            style={highlight('is_official')}
          >
            <Switch />
          </Form.Item>
        </Col>
      </Row>
      {showAttachments && (
        <Form.Item
          label="Файлы"
          style={
            attachments.attachmentsChanged
              ? { background: '#fffbe6', padding: 4, borderRadius: 2 }
              : {}
          }
        >
          <FileDropZone onFiles={attachments.addFiles} />
          <AttachmentEditorTable
            remoteFiles={attachments.remoteFiles.map((f) => ({
              id: String(f.id),
              name: f.name,
              path: f.path,
              mime: f.mime_type,
            }))}
            newFiles={attachments.newFiles.map((f) => ({
              file: f.file,
              mime: f.file.type,
            }))}
            onRemoveRemote={(id) => attachments.removeRemote(id)}
            onRemoveNew={(idx) => attachments.removeNew(idx)}
            getSignedUrl={(path, name) => signedUrl(path, name)}
          />
        </Form.Item>
      )}
      {!hideActions && (
        <Form.Item style={{ textAlign: 'right' }}>
          {onCancel && (
            <Button style={{ marginRight: 8 }} onClick={onCancel} disabled={update.isPending}>
              Отмена
            </Button>
          )}
          <Button type="primary" htmlType="submit" loading={update.isPending}>
            Сохранить
          </Button>
        </Form.Item>
      )}
    </Form>
  );
});

export default ClaimFormAntdEdit;
