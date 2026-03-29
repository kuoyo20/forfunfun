import { useState, useEffect, useCallback } from 'react';
import api from '../api/client';
import type { Version } from '../types';

export function useVersions(articleId: number | null) {
  const [versions, setVersions] = useState<Version[]>([]);

  const fetch = useCallback(async () => {
    if (!articleId) return;
    const { data } = await api.get(`/articles/${articleId}/versions`);
    setVersions(data);
  }, [articleId]);

  useEffect(() => { fetch(); }, [fetch]);

  const createVersion = async (note?: string) => {
    if (!articleId) return;
    await api.post(`/articles/${articleId}/versions`, { note });
    await fetch();
  };

  const restoreVersion = async (versionId: number) => {
    if (!articleId) return;
    const { data } = await api.post(`/articles/${articleId}/versions/${versionId}/restore`);
    await fetch();
    return data;
  };

  return { versions, createVersion, restoreVersion, refresh: fetch };
}
