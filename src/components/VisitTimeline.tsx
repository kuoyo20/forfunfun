import type { Visit } from '@/integrations/supabase/types';
import { ROLE_LABELS } from '@/constants';
import type { RoleKey } from '@/types';

interface Props {
  visits: Visit[];
}

const OUTCOME_META: Record<NonNullable<Visit['outcome']>, { icon: string; color: string; label: string }> = {
  positive: { icon: '✅', color: 'text-accent', label: '正向' },
  neutral: { icon: '〰️', color: 'text-muted-foreground', label: '中性' },
  negative: { icon: '❌', color: 'text-destructive', label: '需跟進' },
};

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

const VisitTimeline = ({ visits }: Props) => {
  if (visits.length === 0) {
    return (
      <div className="bg-card rounded-xl border border-border shadow-sm p-8 text-center">
        <p className="text-sm text-muted-foreground">還沒有拜訪紀錄，開始記錄第一次拜訪吧！</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="absolute left-3 top-0 bottom-0 w-px bg-border" aria-hidden />

      <div className="space-y-4">
        {visits.map(visit => {
          const meta = visit.outcome ? OUTCOME_META[visit.outcome] : null;
          const roleLabel = visit.target_role && visit.target_role in ROLE_LABELS
            ? ROLE_LABELS[visit.target_role as RoleKey]
            : visit.target_role;

          return (
            <div key={visit.id} className="relative pl-10">
              <div className="absolute left-1 top-3 w-5 h-5 rounded-full bg-primary border-4 border-background" />

              <div className="bg-card rounded-xl border border-border shadow-sm p-4">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="text-xs font-bold text-foreground">{formatDate(visit.visit_date)}</span>
                  {meta && (
                    <span className={`text-xs font-medium ${meta.color}`}>
                      {meta.icon} {meta.label}
                    </span>
                  )}
                  {visit.product_discussed && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-badge-explore text-badge-explore-text">
                      {visit.product_discussed}
                    </span>
                  )}
                  {roleLabel && (
                    <span className="text-xs text-muted-foreground">→ {roleLabel}</span>
                  )}
                </div>

                {visit.client_reaction && (
                  <div className="mb-2">
                    <p className="text-xs font-bold text-muted-foreground mb-0.5">客戶反應</p>
                    <p className="text-sm text-foreground">{visit.client_reaction}</p>
                  </div>
                )}

                {visit.key_findings && (
                  <div className="mb-2">
                    <p className="text-xs font-bold text-muted-foreground mb-0.5">關鍵發現</p>
                    <p className="text-sm text-foreground">{visit.key_findings}</p>
                  </div>
                )}

                {visit.next_action && (
                  <div className="border-t border-border pt-2 mt-2">
                    <p className="text-xs font-bold text-primary mb-0.5">
                      → 下一步 {visit.next_follow_up_date && <span className="text-muted-foreground font-normal">（{visit.next_follow_up_date}）</span>}
                    </p>
                    <p className="text-sm text-foreground">{visit.next_action}</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default VisitTimeline;
