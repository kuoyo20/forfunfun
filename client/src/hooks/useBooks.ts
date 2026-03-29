import { useState, useEffect, useCallback } from 'react';
import api from '../api/client';
import type { Book } from '../types';

export function useBookList() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/books');
      setBooks(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { books, loading, refresh: fetch };
}

export function useBook(id: number | null) {
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async () => {
    if (!id) { setBook(null); return; }
    setLoading(true);
    try {
      const { data } = await api.get(`/books/${id}`);
      setBook(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetch(); }, [fetch]);

  return { book, loading, refresh: fetch, setBook };
}
