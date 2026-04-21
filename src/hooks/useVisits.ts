import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Visit, VisitInsert } from '@/integrations/supabase/types';

export function useVisits(clientId?: string) {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVisits = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase.from('visits').select('*').order('visit_date', { ascending: false });
      if (clientId) query = query.eq('client_id', clientId);

      const { data, error: fnError } = await query;
      if (fnError) throw fnError;
      setVisits(data || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : '載入失敗');
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => { fetchVisits(); }, [fetchVisits]);

  const createVisit = useCallback(async (input: VisitInsert) => {
    const { data, error: fnError } = await supabase.from('visits').insert(input).select().single();
    if (fnError) throw fnError;
    setVisits(prev => [data, ...prev]);
    return data;
  }, []);

  const deleteVisit = useCallback(async (id: string) => {
    const { error: fnError } = await supabase.from('visits').delete().eq('id', id);
    if (fnError) throw fnError;
    setVisits(prev => prev.filter(v => v.id !== id));
  }, []);

  return { visits, loading, error, refetch: fetchVisits, createVisit, deleteVisit };
}
