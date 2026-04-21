import type { Client } from '@/integrations/supabase/types';

const STATUS_LABELS: Record<Client['status'], string> = {
  prospect: '開發中',
  active: '合作中',
  inactive: '暫停',
};

const STATUS_STYLES: Record<Client['status'], string> = {
  prospect: 'bg-badge-opening text-badge-opening-text',
  active: 'bg-badge-explore text-badge-explore-text',
  inactive: 'bg-secondary text-muted-foreground',
};

interface Props {
  status: Client['status'];
}

const ClientStatusBadge = ({ status }: Props) => (
  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_STYLES[status]}`}>
    {STATUS_LABELS[status]}
  </span>
);

export default ClientStatusBadge;
export { STATUS_LABELS };
