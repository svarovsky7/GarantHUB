import { supabase } from '@/shared/api/supabaseClient';

/**
 * Определяет ID персоны или контрагента по имени.
 * Сначала ищет в таблице persons, затем в contractors.
 */
export async function getContactIds(name: string | null) {
  if (!name) return { personId: null, contractorId: null };
  const { data: person } = await supabase
    .from('persons')
    .select('id')
    .eq('full_name', name)
    .maybeSingle();
  if (person) return { personId: person.id as number, contractorId: null };
  const { data: contr } = await supabase
    .from('contractors')
    .select('id')
    .eq('name', name)
    .maybeSingle();
  if (contr) return { personId: null, contractorId: contr.id as number };
  return { personId: null, contractorId: null };
}

/**
 * Получить имя отправителя по ID персоны или контрагента.
 */
export async function getSenderName(
  senderPersonId: number | null,
  senderContractorId: number | null
): Promise<string> {
  if (senderPersonId) {
    const { data } = await supabase
      .from('persons')
      .select('full_name')
      .eq('id', senderPersonId)
      .maybeSingle();
    return data?.full_name ?? '';
  }
  if (senderContractorId) {
    const { data } = await supabase
      .from('contractors')
      .select('name')
      .eq('id', senderContractorId)
      .maybeSingle();
    return data?.name ?? '';
  }
  return '';
}

/**
 * Получить имя получателя по ID персоны или контрагента.
 */
export async function getReceiverName(
  receiverPersonId: number | null,
  receiverContractorId: number | null
): Promise<string> {
  if (receiverPersonId) {
    const { data } = await supabase
      .from('persons')
      .select('full_name')
      .eq('id', receiverPersonId)
      .maybeSingle();
    return data?.full_name ?? '';
  }
  if (receiverContractorId) {
    const { data } = await supabase
      .from('contractors')
      .select('name')
      .eq('id', receiverContractorId)
      .maybeSingle();
    return data?.name ?? '';
  }
  return '';
}
