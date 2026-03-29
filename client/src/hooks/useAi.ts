import { useState } from 'react';
import api from '../api/client';

export function useAi() {
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const run = async (action: string, text: string, options?: { tone?: string; prompt?: string }) => {
    setLoading(true);
    setError('');
    setResult('');
    try {
      const { data } = await api.post(`/ai/${action}`, { text, options });
      setResult(data.result);
      return data.result;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'AI 服務錯誤';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return { result, loading, error, run, setResult };
}
