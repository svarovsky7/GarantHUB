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
  /** Список объектов одной строкой */
  unitNames?: string;
  /** Дата претензии */
  claimDate: Dayjs | null;
  /** Дата получения претензии застройщиком */
  receivedByDeveloperAt: Dayjs | null;
  /** Дата регистрации претензии */
  registeredAt: Dayjs | null;
  /** Дата устранения претензии */
  fixedAt: Dayjs | null;
  /** Загруженные файлы */
  attachments?: import('./claimFile').RemoteClaimFile[];
  /** Есть связанные дефекты со статусом "На проверке" */
  hasCheckingDefect?: boolean;
}
