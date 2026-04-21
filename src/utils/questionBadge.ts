export function getBadgeStyle(type: string): string {
  if (type === 'opening') return 'bg-badge-opening text-badge-opening-text';
  if (type === 'closing') return 'bg-badge-closing text-badge-closing-text';
  return 'bg-badge-explore text-badge-explore-text';
}

export function getBadgeLabel(type: string): string {
  if (type === 'opening') return '暖場';
  if (type === 'closing') return '締結';
  return '探索';
}
