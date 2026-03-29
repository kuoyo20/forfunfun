import { GripVertical, Trash2, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Chapter } from '../../types';

interface Props {
  chapter: Chapter;
  onRemove: (id: number) => void;
}

export default function ChapterItem({ chapter, onRemove }: Props) {
  const navigate = useNavigate();

  return (
    <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg px-4 py-3 hover:shadow-sm transition-shadow">
      <GripVertical className="w-4 h-4 text-gray-400 cursor-grab" />
      <span className="text-sm font-medium text-indigo-500 w-8">
        {chapter.chapter_num}
      </span>
      <div className="flex-1">
        <p className="font-medium text-gray-800">
          {chapter.chapter_title || chapter.article_title || '無標題'}
        </p>
        <p className="text-xs text-gray-400">{chapter.word_count} 字</p>
      </div>
      <button
        onClick={() => navigate(`/articles/${chapter.article_id}`)}
        className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"
        title="編輯文章"
      >
        <ExternalLink className="w-4 h-4" />
      </button>
      <button
        onClick={() => onRemove(chapter.id)}
        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
        title="移除章節"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}
