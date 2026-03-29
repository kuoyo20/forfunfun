import { useNavigate } from 'react-router-dom';
import { BookOpen, Plus, Clock } from 'lucide-react';
import { useBookList } from '../hooks/useBooks';
import { BOOK_STATUS_MAP } from '../types';
import api from '../api/client';

export default function BooksPage() {
  const { books, loading } = useBookList();
  const navigate = useNavigate();

  const handleCreate = async () => {
    const { data } = await api.post('/books', { title: '新書籍' });
    navigate(`/books/${data.id}`);
  };

  return (
    <>
      <header className="flex items-center justify-between px-8 py-4 border-b border-gray-200 bg-white">
        <h2 className="text-2xl font-bold text-gray-800">書籍編纂</h2>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          新增書籍
        </button>
      </header>
      <div className="p-8 flex-1 overflow-auto">
        {loading ? (
          <div className="text-center py-16 text-gray-400">載入中...</div>
        ) : books.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg">尚無書籍</p>
            <p className="text-sm mt-2">點擊「新增書籍」開始編纂你的第一本書</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {books.map(book => (
              <div
                key={book.id}
                onClick={() => navigate(`/books/${book.id}`)}
                className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen className="w-5 h-5 text-indigo-500" />
                  <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded">
                    {BOOK_STATUS_MAP[book.status] || book.status}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">{book.title || '無標題'}</h3>
                <p className="text-sm text-gray-500 line-clamp-2 mb-3">{book.description || '尚無描述'}</p>
                <div className="flex items-center text-xs text-gray-400">
                  <Clock className="w-3 h-3 mr-1" />
                  {new Date(book.updated_at).toLocaleDateString('zh-TW')}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
