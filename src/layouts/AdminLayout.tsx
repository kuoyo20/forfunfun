import { Outlet, Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Plus, Users, Scale, Briefcase, Archive,
  Settings as SettingsIcon, Sparkles, Menu, X,
} from "lucide-react";
import { useState } from "react";

const NAV = [
  { to: "/", label: "總覽", icon: LayoutDashboard },
  { to: "/create", label: "建立面試", icon: Plus },
  { to: "/bulk", label: "批量建立", icon: Users },
  { to: "/compare", label: "比較排名", icon: Scale },
  { to: "/jobs", label: "職缺管理", icon: Briefcase },
  { to: "/talent", label: "人才庫", icon: Archive },
  { to: "/settings", label: "設定", icon: SettingsIcon },
];

export default function AdminLayout() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (to: string) => {
    if (to === "/") return location.pathname === "/";
    return location.pathname.startsWith(to);
  };

  return (
    <div className="flex min-h-screen bg-muted/20">
      {/* 手機漢堡 */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-3 left-3 z-40 rounded-lg border bg-card p-2 shadow-sm"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* 側欄 */}
      <aside className={cn(
        "fixed md:sticky top-0 left-0 h-screen w-64 border-r bg-card z-50 transition-transform md:translate-x-0",
        mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        <div className="flex items-center justify-between px-5 py-5 border-b">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <div className="text-sm font-bold">AI 模擬面試</div>
              <div className="text-xs text-muted-foreground">HR Console</div>
            </div>
          </div>
          <button onClick={() => setMobileOpen(false)} className="md:hidden">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="p-3 space-y-1">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                  active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-foreground hover:bg-accent"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-3 border-t">
          <Link
            to="/practice"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-muted-foreground hover:bg-accent transition-colors"
          >
            <Sparkles className="h-3 w-3" />
            自主練習模式
          </Link>
        </div>
      </aside>

      {/* 遮罩（手機版） */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/30 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* 主內容 */}
      <main className="flex-1 min-w-0 px-4 py-6 md:px-10 md:py-10">
        <div className="mx-auto max-w-5xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
