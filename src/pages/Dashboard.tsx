import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Users, MessageCircleQuestion, TrendingUp, Calendar, ArrowRight } from 'lucide-react';
import Header from '@/components/Header';
import FollowUpsList from '@/components/FollowUpsList';
import { useClients } from '@/hooks/useClients';
import { useFollowUps } from '@/hooks/useFollowUps';
import { useVisits } from '@/hooks/useVisits';

const Dashboard = () => {
  const { clients } = useClients();
  const { followUps, completeFollowUp } = useFollowUps({ upcomingOnly: true });
  const { visits } = useVisits();

  const clientNames = useMemo(
    () => Object.fromEntries(clients.map(c => [c.id, c.name])),
    [clients]
  );

  const stats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const thisWeekStart = new Date();
    thisWeekStart.setDate(thisWeekStart.getDate() - 7);

    return {
      totalClients: clients.length,
      activeClients: clients.filter(c => c.status === 'active').length,
      prospectClients: clients.filter(c => c.status === 'prospect').length,
      thisWeekVisits: visits.filter(v => new Date(v.visit_date) >= thisWeekStart).length,
      overdueFollowUps: followUps.filter(f => f.status === 'overdue').length,
      todayFollowUps: followUps.filter(f => f.due_date === today).length,
    };
  }, [clients, visits, followUps]);

  const statCards = [
    { label: '客戶總數', value: stats.totalClients, icon: Users, color: 'text-primary', detail: `合作 ${stats.activeClients} · 開發 ${stats.prospectClients}` },
    { label: '本週拜訪', value: stats.thisWeekVisits, icon: Calendar, color: 'text-accent', detail: '近 7 天' },
    { label: '今日待辦', value: stats.todayFollowUps, icon: TrendingUp, color: 'text-primary', detail: stats.overdueFollowUps > 0 ? `⚠️ 逾期 ${stats.overdueFollowUps}` : '' },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 max-w-6xl w-full mx-auto px-3 md:px-4 py-4 md:py-6">
        {/* Welcome */}
        <div className="mb-5 md:mb-6">
          <h2 className="text-lg md:text-2xl font-bold text-foreground">業務戰情</h2>
          <p className="text-xs md:text-sm text-muted-foreground mt-0.5">讓品味與食俱進 — 為客戶的成功創造最大價值</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 md:gap-4 mb-5 md:mb-6">
          {statCards.map(card => {
            const Icon = card.icon;
            return (
              <div key={card.label} className="bg-card rounded-xl border border-border shadow-sm p-3 md:p-4">
                <div className="flex items-center gap-2 mb-1 md:mb-2">
                  <Icon size={16} className={card.color} />
                  <span className="text-xs md:text-sm text-muted-foreground">{card.label}</span>
                </div>
                <p className="text-xl md:text-3xl font-bold text-foreground">{card.value}</p>
                {card.detail && (
                  <p className="text-[10px] md:text-xs text-muted-foreground mt-1 line-clamp-1">{card.detail}</p>
                )}
              </div>
            );
          })}
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mb-5 md:mb-6">
          <Link
            to="/generator"
            className="bg-card rounded-xl border border-border shadow-sm p-4 hover:shadow-md hover:border-primary/40 transition-all group flex items-center gap-4"
          >
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <MessageCircleQuestion size={20} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-foreground group-hover:text-primary transition-colors">AI 提問生成</h3>
              <p className="text-xs text-muted-foreground">為下次拜訪準備關鍵提問策略</p>
            </div>
            <ArrowRight size={16} className="text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
          </Link>

          <Link
            to="/clients"
            className="bg-card rounded-xl border border-border shadow-sm p-4 hover:shadow-md hover:border-primary/40 transition-all group flex items-center gap-4"
          >
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
              <Users size={20} className="text-accent" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-foreground group-hover:text-primary transition-colors">客戶管理</h3>
              <p className="text-xs text-muted-foreground">檢視所有客戶檔案與拜訪紀錄</p>
            </div>
            <ArrowRight size={16} className="text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
          </Link>
        </div>

        {/* Follow-ups */}
        <div className="bg-card rounded-xl border border-border shadow-sm p-4 md:p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-bold text-foreground">
              近期跟進事項 {followUps.length > 0 && <span className="text-sm font-normal text-muted-foreground">（{followUps.length}）</span>}
            </h3>
          </div>
          <FollowUpsList
            followUps={followUps.slice(0, 10)}
            onComplete={completeFollowUp}
            showClient
            clientNames={clientNames}
            emptyLabel="🎉 目前沒有待跟進事項"
          />
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
