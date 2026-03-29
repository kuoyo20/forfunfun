import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import DashboardPage from './pages/DashboardPage';
import ArticlesPage from './pages/ArticlesPage';
import ArticleEditorPage from './pages/ArticleEditorPage';
import BooksPage from './pages/BooksPage';
import BookEditorPage from './pages/BookEditorPage';
import SettingsPage from './pages/SettingsPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/articles" element={<ArticlesPage />} />
          <Route path="/articles/:id" element={<ArticleEditorPage />} />
          <Route path="/books" element={<BooksPage />} />
          <Route path="/books/:id" element={<BookEditorPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
