import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { FollowUp, FollowUpInsert } from '@/integrations/supabase/types';

interface UseFollowUpsOptions {
  clientId?: string;
  status?: FollowUp['status'];
  upcomingOnly?: boolean;
}

export function useFollowUps(options: UseFollowUpsOptions = {}) {
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFollowUps = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase.from('follow_ups').select('*').order('due_date', { ascending: true, nullsFirst: false });
      if (options.clientId) query = query.eq('client_id', options.clientId);
      if (options.status) query = query.eq('status', options.status);
      if (options.upcomingOnly) query = query.in('status', ['pending', 'overdue']);

      const { data, error: fnError } = await query;
      if (fnError) throw fnError;

      // Client-side mark overdue for display
      const today = new Date().toISOString().slice(0, 10);
      const normalized = (data || []).map(f =>
        f.status === 'pending' && f.due_date && f.due_date < today
          ? { ...f, status: 'overdue' as const }
          : f
      );
      setFollowUps(normalized);
    } catch (e) {
      setError(e instanceof Error ? e.message : '載入失敗');
    } finally {
      setLoading(false);
    }
  }, [options.clientId, options.status, options.upcomingOnly]);

  useEffect(() => { fetchFollowUps(); }, [fetchFollowUps]);

  const createFollowUp = useCallback(async (input: FollowUpInsert) => {
    const { data, error: fnError } = await supabase.from('follow_ups').insert(input).select().single();
    if (fnError) throw fnError;
    setFollowUps(prev => [...prev, data].sort((a, b) => (a.due_date || '').localeCompare(b.due_date || '')));
    return data;
  }, []);

  const completeFollowUp = useCallback(async (id: string) => {
    const { data, error: fnError } = await supabase.from('follow_ups')
      .update({ status: 'done', completed_at: new Date().toISOString() })
      .eq('id', id).select().single();
    if (fnError) throw fnError;
    setFollowUps(prev => prev.map(f => (f.id === id ? data : f)));
    return data;
  }, []);

  const deleteFollowUp = useCallback(async (id: string) => {
    const { error: fnError } = await supabase.from('follow_ups').delete().eq('id', id);
    if (fnError) throw fnError;
    setFollowUps(prev => prev.filter(f => f.id !== id));
  }, []);

  return { followUps, loading, error, refetch: fetchFollowUps, createFollowUp, completeFollowUp, deleteFollowUp };
}
