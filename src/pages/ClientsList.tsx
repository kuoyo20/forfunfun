import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Users, Loader2, Phone, MapPin } from 'lucide-react';
import Header from '@/components/Header';
import ClientStatusBadge, { STATUS_LABELS } from '@/components/ClientStatusBadge';
import ClientFormDialog from '@/components/ClientFormDialog';
import { useClients } from '@/hooks/useClients';
import type { Client } from '@/integrations/supabase/types';

const ClientsList = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<Client['status'] | 'all'>('all');
  const [dialogOpen, setDialogOpen] = useState(false);

  const { clients, loading, error, createClient } = useClients({
    search: search.trim() || undefined,
    status: statusFilter === 'all' ? undefined : statusFilter,
  });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 max-w-6xl w-full mx-auto px-3 md:px-4 py-4 md:py-6">
        {/* Title bar */}
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <div>
            <h2 className="text-lg md:text-xl font-bold text-foreground flex items-center gap-2">
              <Users size={20} className="text-primary" /> 客戶管理
            </h2>
            <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
              管理所有客戶檔案與合作狀態
            </p>
          </div>
          <button
            onClick={() => setDialogOpen(true)}
            className="flex items-center gap-1.5 px-3 md:px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity shadow-sm min-h-[44px]"
          >
            <Plus size={16} /> 新增客戶
          </button>
        </div>

        {/* Filters */}
        <div className="bg-card rounded-xl border border-border shadow-sm p-3 md:p-4 mb-4 flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="搜尋客戶名稱..."
              className="w-full rounded-lg border border-input bg-background pl-10 pr-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="flex gap-2">
            {(['all', 'prospect', 'active', 'inactive'] as const).map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors min-h-[40px] ${
                  statusFilter === s
                    ? 'bg-role-active-bg border border-role-active-border text-role-active-text'
                    : 'bg-secondary text-muted-foreground hover:bg-muted'
                }`}
              >
                {s === 'all' ? '全部' : STATUS_LABELS[s]}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 size={20} className="animate-spin mr-2" /> 載入中...
          </div>
        ) : error ? (
          <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 text-sm text-destructive">
            載入失敗：{error}
          </div>
        ) : clients.length === 0 ? (
          <div className="bg-card rounded-xl border border-border shadow-sm p-10 text-center">
            <Users className="mx-auto text-muted-foreground mb-3" size={36} />
            <p className="text-sm text-muted-foreground mb-3">
              {search || statusFilter !== 'all' ? '沒有符合條件的客戶' : '還沒有任何客戶，新增第一個吧！'}
            </p>
            <button
              onClick={() => setDialogOpen(true)}
              className="text-sm text-primary hover:underline"
            >
              + 新增客戶
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {clients.map(client => (
              <Link
                key={client.id}
                to={`/clients/${client.id}`}
                className="bg-card rounded-xl border border-border shadow-sm p-4 hover:shadow-md hover:border-primary/40 transition-all group"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                    {client.name}
                  </h3>
                  <ClientStatusBadge status={client.status} />
                </div>
                {client.industry && (
                  <p className="text-xs text-muted-foreground mb-2">{client.industry}</p>
                )}
                {client.contact_person && (
                  <p className="text-xs text-muted-foreground mb-1">
                    聯絡人：{client.contact_person}
                    {client.contact_role && ` （${client.contact_role}）`}
                  </p>
                )}
                {client.phone && (
                  <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                    <Phone size={10} /> {client.phone}
                  </p>
                )}
                {client.address && (
                  <p className="text-xs text-muted-foreground line-clamp-1 flex items-center gap-1">
                    <MapPin size={10} /> {client.address}
                  </p>
                )}
                {client.tags && client.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {client.tags.map(tag => (
                      <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </main>

      <ClientFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSubmit={async (data) => {
          await createClient(data);
          setDialogOpen(false);
        }}
      />
    </div>
  );
};

export default ClientsList;
