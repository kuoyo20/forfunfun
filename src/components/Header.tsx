import { Star, LayoutDashboard, MessageCircleQuestion, Users } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const navItems = [
  { to: '/', label: '首頁', icon: LayoutDashboard },
  { to: '/generator', label: '提問生成', icon: MessageCircleQuestion },
  { to: '/clients', label: '客戶管理', icon: Users },
];

const Header = () => (
  <header className="bg-card border-b border-border shadow-sm sticky top-0 z-40">
    <div className="max-w-6xl mx-auto px-4 py-3 md:py-4 flex items-center justify-between gap-4">
      <NavLink to="/" className="flex items-center gap-3 shrink-0">
        <div className="w-9 h-9 md:w-10 md:h-10 rounded-lg bg-primary flex items-center justify-center">
          <Star className="text-primary-foreground" size={20} />
        </div>
        <div className="hidden sm:block">
          <h1 className="text-sm md:text-base font-bold text-foreground tracking-tight leading-tight">苗林行業務系統</h1>
          <p className="text-[10px] md:text-xs text-muted-foreground leading-tight">讓品味與食俱進</p>
        </div>
      </NavLink>
      <nav className="flex items-center gap-1 md:gap-2">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-1.5 px-2.5 md:px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-secondary'
              }`
            }
          >
            <Icon size={16} />
            <span className="hidden sm:inline">{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  </header>
);

export default Header;
