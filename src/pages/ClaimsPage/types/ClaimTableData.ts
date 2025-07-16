import type { ClaimWithNames } from '@/shared/types/claimWithNames';
import dayjs from 'dayjs';

export interface ClaimTableData extends ClaimWithNames {
  key: string;
  treeIcon?: React.ReactNode;
  projectName: string;
  buildings: string;
  unitNames: string;
  statusName: string;
  responsibleEngineerName: string;
  createdByName: string;
  claimedOn: dayjs.Dayjs | null;
  acceptedOn: dayjs.Dayjs | null;
  registeredOn: dayjs.Dayjs | null;
  resolvedOn: dayjs.Dayjs | null;
  createdAt: dayjs.Dayjs | null;
}