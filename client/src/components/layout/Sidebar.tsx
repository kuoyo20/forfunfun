import { NavLink } from 'react-router-dom';
import { FileText, BookOpen, Settings, Home, PenTool } from 'lucide-react';

const links = [
  { to: '/', label: '首頁', icon: Home },
  { to: '/articles', label: '文章管理', icon: FileText },
  { to: '/books', label: '書籍編纂', icon: BookOpen },
  { to: '/settings', label: '設定', icon: Settings },
];

export default function Sidebar() {
  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col min-h-screen">
      <div className="p-6 flex items-center gap-3 border-b border-gray-700">
        <PenTool className="w-7 h-7 text-indigo-400" />
        <h1 className="text-xl font-bold">WriteFlow</h1>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`
            }
          >
            <Icon className="w-5 h-5" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="p-4 border-t border-gray-700 text-xs text-gray-500">
        WriteFlow v1.0
      </div>
    </aside>
  );
}
