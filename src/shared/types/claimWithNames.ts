import type { Claim } from '@/shared/types/claim';
import type { Dayjs } from 'dayjs';

export interface ClaimWithNames extends Claim {
  /** Название проекта, к которому относится претензия */
  projectName: string;
  /** Наименование статуса претензии */
  statusName: string;
  /** Цвет статуса для отображения */
  statusColor: string | null;
  /** ФИО ответственного инженера */
  responsibleEngineerName: string | null;
  /** ФИО выбранного физлица */
  personName?: string | null;
  /** Уникальный идентификатор судебного дела */
  caseUid?: string | null;
  /** Список объектов одной строкой */
  unitNames?: string;
  /** Список номеров объектов одной строкой */
  unitNumbers?: string;
  /** Список корпусов одной строкой */
  buildings?: string;
  /** Дата обнаружения дефекта */
  claimedOn: Dayjs | null;
  /** Дата принятия претензии застройщиком */
  acceptedOn: Dayjs | null;
  /** Дата регистрации претензии */
  registeredOn: Dayjs | null;
  /** Дата фактического устранения */
  resolvedOn: Dayjs | null;
  /** Загруженные файлы */
  attachments?: import('./claimFile').RemoteClaimFile[];
  /** Есть связанные дефекты со статусом "На проверке" */
  hasCheckingDefect?: boolean;
}
