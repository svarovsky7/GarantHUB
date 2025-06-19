import type { Claim } from '@/shared/types/claim';

export interface ClaimWithNames extends Claim {
  responsibleEngineerName: string | null;
}
