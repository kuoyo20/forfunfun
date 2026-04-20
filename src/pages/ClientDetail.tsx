import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Plus, Phone, MapPin, Loader2, Sparkles, Trash2 } from 'lucide-react';
import Header from '@/components/Header';
import ClientStatusBadge from '@/components/ClientStatusBadge';
import ClientFormDialog from '@/components/ClientFormDialog';
import VisitFormDialog from '@/components/VisitFormDialog';
import VisitTimeline from '@/components/VisitTimeline';
import FollowUpsList from '@/components/FollowUpsList';
import { useClient } from '@/hooks/useClients';
import { useVisits } from '@/hooks/useVisits';
import { useFollowUps } from '@/hooks/useFollowUps';
import { supabase } from '@/integrations/supabase/client';
import type { ClientInsert, VisitInsert } from '@/integrations/supabase/types';

const ClientDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { client, loading, setClient } = useClient(id);
  const { visits, createVisit } = useVisits(id);
  const { followUps, createFollowUp, completeFollowUp, deleteFollowUp } = useFollowUps({ clientId: id });

  const [editOpen, setEditOpen] = useState(false);
  const [visitOpen, setVisitOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          <Loader2 size={20} className="animate-spin mr-2" /> 載入客戶資料...
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6">
          <p className="text-sm text-muted-foreground">找不到客戶資料</p>
          <Link to="/clients" className="text-sm text-primary hover:underline">返回列表</Link>
        </main>
      </div>
    );
  }

  const handleUpdate = async (data: ClientInsert) => {
    const { data: updated, error } = await supabase.from('clients').update(data).eq('id', client.id).select().single();
    if (error) throw error;
    setClient(updated);
    setEditOpen(false);
  };

  const handleCreateVisit = async (data: VisitInsert) => {
    const visit = await createVisit(data);
    // Auto-create follow-up if next_action provided
    if (visit.next_action) {
      await createFollowUp({
        visit_id: visit.id,
        client_id: client.id,
        action: visit.next_action,
        due_date: visit.next_follow_up_date || null,
      });
    }
    setVisitOpen(false);
  };

  const lastVisit = visits[0];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 max-w-5xl w-full mx-auto px-3 md:px-4 py-4 md:py-6">
        <Link to="/clients" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-3">
          <ArrowLeft size={14} /> 返回客戶列表
        </Link>

        {/* Client header card */}
        <div className="bg-card rounded-xl border border-border shadow-sm p-4 md:p-5 mb-4">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h1 className="text-lg md:text-xl font-bold text-foreground">{client.name}</h1>
                <ClientStatusBadge status={client.status} />
              </div>
              {client.industry && <p className="text-sm text-muted-foreground">{client.industry}</p>}
            </div>
            <button
              onClick={() => setEditOpen(true)}
              className="flex items-center gap-1 px-3 py-2 rounded-lg border border-border bg-card text-sm text-foreground hover:bg-secondary transition-colors"
            >
              <Edit size={14} /> 編輯
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            {client.contact_person && (
              <div>
                <span className="text-xs text-muted-foreground">聯絡人：</span>
                <span className="text-foreground">{client.contact_person}</span>
                {client.contact_role && <span className="text-muted-foreground"> （{client.contact_role}）</span>}
              </div>
            )}
            {client.phone && (
              <div className="flex items-center gap-1.5">
                <Phone size={12} className="text-muted-foreground" />
                <a href={`tel:${client.phone}`} className="text-foreground hover:text-primary">{client.phone}</a>
              </div>
            )}
            {client.address && (
              <div className="flex items-center gap-1.5 sm:col-span-2">
                <MapPin size={12} className="text-muted-foreground" />
                <span className="text-foreground">{client.address}</span>
              </div>
            )}
          </div>

          {client.tags && client.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {client.tags.map(tag => (
                <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {client.notes && (
            <div className="mt-3 pt-3 border-t border-border">
              <p className="text-xs font-bold text-muted-foreground mb-1">備註</p>
              <p className="text-sm text-foreground whitespace-pre-wrap">{client.notes}</p>
            </div>
          )}

          {/* Quick action: generate questions with history */}
          <div className="mt-4 pt-3 border-t border-border flex flex-col sm:flex-row gap-2">
            <button
              onClick={() => setVisitOpen(true)}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity min-h-[44px]"
            >
              <Plus size={14} /> 新增拜訪紀錄
            </button>
            <button
              onClick={() => navigate(`/generator?clientId=${client.id}`)}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg border border-primary bg-card text-primary text-sm font-medium hover:bg-primary/5 transition-colors min-h-[44px]"
            >
              <Sparkles size={14} /> AI 準備下次拜訪
            </button>
          </div>
        </div>

        {/* Two-column: follow-ups + visits timeline */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Follow-ups */}
          <div className="lg:col-span-1">
            <h2 className="text-sm font-bold text-foreground mb-2">跟進待辦 ({followUps.filter(f => f.status !== 'done').length})</h2>
            <FollowUpsList
              followUps={followUps}
              onComplete={completeFollowUp}
              onDelete={deleteFollowUp}
              emptyLabel="沒有待跟進事項"
            />
          </div>

          {/* Visits */}
          <div className="lg:col-span-2">
            <h2 className="text-sm font-bold text-foreground mb-2">
              拜訪時間軸 ({visits.length})
              {lastVisit && (
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  最近：{new Date(lastVisit.visit_date).toLocaleDateString('zh-TW')}
                </span>
              )}
            </h2>
            <VisitTimeline visits={visits} />
          </div>
        </div>
      </main>

      <ClientFormDialog
        open={editOpen}
        initial={client}
        onClose={() => setEditOpen(false)}
        onSubmit={handleUpdate}
      />
      <VisitFormDialog
        open={visitOpen}
        clientId={client.id}
        onClose={() => setVisitOpen(false)}
        onSubmit={handleCreateVisit}
      />
    </div>
  );
};

export default ClientDetail;
