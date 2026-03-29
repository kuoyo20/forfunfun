export interface Article {
  id: number;
  title: string;
  content_md: string;
  content_html: string;
  content_json: string;
  category: 'blog' | 'social_media' | 'column' | 'book_chapter';
  status: 'draft' | 'published' | 'archived';
  tags: string;
  publication: string | null;
  word_count: number;
  created_at: string;
  updated_at: string;
}

export interface ArticleListItem {
  id: number;
  title: string;
  category: string;
  status: string;
  tags: string;
  publication: string | null;
  word_count: number;
  created_at: string;
  updated_at: string;
}

export interface Version {
  id: number;
  article_id: number;
  title: string;
  content_md: string;
  content_json: string;
  note: string | null;
  created_at: string;
}

export interface Book {
  id: number;
  title: string;
  description: string;
  status: 'draft' | 'in_progress' | 'completed';
  created_at: string;
  updated_at: string;
  chapters?: Chapter[];
}

export interface Chapter {
  id: number;
  chapter_num: number;
  chapter_title: string | null;
  article_id: number;
  article_title: string;
  word_count: number;
}

export const CATEGORIES: Record<string, string> = {
  blog: '部落格',
  social_media: '社群媒體',
  column: '專欄',
  book_chapter: '書籍章節',
};

export const PUBLICATIONS = ['數位時代', '天下', '商周'];

export const STATUS_MAP: Record<string, string> = {
  draft: '草稿',
  published: '已發布',
  archived: '已封存',
};

export const BOOK_STATUS_MAP: Record<string, string> = {
  draft: '草稿',
  in_progress: '撰寫中',
  completed: '已完成',
};
