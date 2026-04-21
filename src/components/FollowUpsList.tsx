import { CheckCircle2, Circle, AlertCircle, Trash2 } from 'lucide-react';
import type { FollowUp } from '@/integrations/supabase/types';

interface Props {
  followUps: FollowUp[];
  onComplete: (id: string) => void;
  onDelete?: (id: string) => void;
  showClient?: boolean;
  clientNames?: Record<string, string>;
  emptyLabel?: string;
}

const FollowUpsList = ({ followUps, onComplete, onDelete, showClient, clientNames, emptyLabel }: Props) => {
  if (followUps.length === 0) {
    return (
      <div className="bg-card rounded-xl border border-border shadow-sm p-6 text-center">
        <CheckCircle2 className="mx-auto text-accent mb-2" size={24} />
        <p className="text-sm text-muted-foreground">{emptyLabel || '沒有待跟進事項'}</p>
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {followUps.map(f => {
        const isDone = f.status === 'done';
        const isOverdue = f.status === 'overdue';

        return (
          <li
            key={f.id}
            className={`bg-card rounded-lg border p-3 flex items-start gap-3 ${
              isOverdue ? 'border-destructive/40 bg-destructive/5' : 'border-border'
            }`}
          >
            <button
              onClick={() => !isDone && onComplete(f.id)}
              disabled={isDone}
              className="mt-0.5 shrink-0"
              title={isDone ? '已完成' : '標記為完成'}
            >
              {isDone ? (
                <CheckCircle2 size={18} className="text-accent" />
              ) : isOverdue ? (
                <AlertCircle size={18} className="text-destructive" />
              ) : (
                <Circle size={18} className="text-muted-foreground hover:text-primary transition-colors" />
              )}
            </button>

            <div className="flex-1 min-w-0">
              <p className={`text-sm ${isDone ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                {f.action}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                {showClient && clientNames?.[f.client_id] && (
                  <span className="text-xs text-muted-foreground">客戶：{clientNames[f.client_id]}</span>
                )}
                {f.due_date && (
                  <span className={`text-xs ${isOverdue ? 'text-destructive font-bold' : 'text-muted-foreground'}`}>
                    截止：{f.due_date}
                  </span>
                )}
              </div>
            </div>

            {onDelete && (
              <button
                onClick={() => onDelete(f.id)}
                className="text-muted-foreground hover:text-destructive shrink-0"
                title="刪除"
              >
                <Trash2 size={14} />
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
};

export default FollowUpsList;
