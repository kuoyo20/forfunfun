import { useState, useEffect, useCallback } from 'react';
import api from '../api/client';
import type { Article, ArticleListItem } from '../types';

export function useArticleList(params?: { category?: string; search?: string }) {
  const [articles, setArticles] = useState<ArticleListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/articles', { params });
      setArticles(data.articles);
      setTotal(data.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [params?.category, params?.search]);

  useEffect(() => { fetch(); }, [fetch]);

  return { articles, total, loading, refresh: fetch };
}

export function useArticle(id: number | null) {
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!id) { setArticle(null); return; }
    setLoading(true);
    api.get(`/articles/${id}`)
      .then(({ data }) => setArticle(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const save = useCallback(async (data: Partial<Article>) => {
    if (!id) return;
    const { data: updated } = await api.put(`/articles/${id}`, data);
    setArticle(updated);
    return updated;
  }, [id]);

  return { article, loading, save, setArticle };
}
