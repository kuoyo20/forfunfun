import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';

export default function Header({ title }: { title: string }) {
  const navigate = useNavigate();

  return (
    <header className="flex items-center justify-between px-8 py-4 border-b border-gray-200 bg-white">
      <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
      <button
        onClick={() => navigate('/articles/new')}
        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
      >
        <Plus className="w-4 h-4" />
        新增文章
      </button>
    </header>
  );
}
