import { Star } from 'lucide-react';

const Header = () => (
  <header className="bg-card border-b border-border shadow-sm">
    <div className="max-w-4xl mx-auto px-4 py-5 flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
        <Star className="text-primary-foreground" size={22} />
      </div>
      <div>
        <h1 className="text-xl font-bold text-foreground tracking-tight">苗林行業務關鍵提問生成器</h1>
        <p className="text-xs text-muted-foreground">讓品味與食俱進 — 為客戶的成功創造最大價值</p>
      </div>
    </div>
  </header>
);

export default Header;
