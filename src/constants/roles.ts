import { Briefcase, ChefHat, ShoppingCart, Megaphone } from 'lucide-react';
import type { RoleKey } from '@/types';

export const ROLE_LABELS: Record<RoleKey, string> = {
  boss: '老闆 / 經營者',
  chef: '主廚 / 師傅',
  purchaser: '採購 / 總務',
  marketing: '行銷 / 企劃',
};

export const ROLE_ICONS: Record<RoleKey, typeof Briefcase> = {
  boss: Briefcase,
  chef: ChefHat,
  purchaser: ShoppingCart,
  marketing: Megaphone,
};

export const FOCUS_OPTIONS = [
  '降低成本', '提升品質', '開發新品', '穩定供貨',
  '差異化', '品牌故事', '比賽用料', '原廠風味',
] as const;
