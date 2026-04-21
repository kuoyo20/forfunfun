import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Client, ClientInsert, ClientUpdate } from '@/integrations/supabase/types';

interface UseClientsOptions {
  search?: string;
  status?: Client['status'];
}

export function useClients(options: UseClientsOptions = {}) {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClients = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase.from('clients').select('*').order('updated_at', { ascending: false });
      if (options.status) query = query.eq('status', options.status);
      if (options.search) query = query.ilike('name', `%${options.search}%`);

      const { data, error: fnError } = await query;
      if (fnError) throw fnError;
      setClients(data || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : '載入失敗');
    } finally {
      setLoading(false);
    }
  }, [options.search, options.status]);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  const createClient = useCallback(async (input: ClientInsert) => {
    const { data, error: fnError } = await supabase.from('clients').insert(input).select().single();
    if (fnError) throw fnError;
    setClients(prev => [data, ...prev]);
    return data;
  }, []);

  const updateClient = useCallback(async (id: string, patch: ClientUpdate) => {
    const { data, error: fnError } = await supabase.from('clients').update(patch).eq('id', id).select().single();
    if (fnError) throw fnError;
    setClients(prev => prev.map(c => (c.id === id ? data : c)));
    return data;
  }, []);

  const deleteClient = useCallback(async (id: string) => {
    const { error: fnError } = await supabase.from('clients').delete().eq('id', id);
    if (fnError) throw fnError;
    setClients(prev => prev.filter(c => c.id !== id));
  }, []);

  return { clients, loading, error, refetch: fetchClients, createClient, updateClient, deleteClient };
}

export function useClient(id: string | undefined) {
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error: fnError } = await supabase.from('clients').select('*').eq('id', id).single();
        if (fnError) throw fnError;
        if (!cancelled) setClient(data);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : '載入失敗');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  return { client, loading, error, setClient };
}
