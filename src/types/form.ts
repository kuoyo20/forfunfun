export type RoleKey = 'boss' | 'chef' | 'purchaser' | 'marketing';
export type HistoryKey = 'new' | 'existing';

export interface FormData {
  product: string;
  clientName: string;
  targetRole: RoleKey;
  clientFocus: string;
  history: HistoryKey;
}

export const INITIAL_FORM_DATA: FormData = {
  product: '',
  clientName: '',
  targetRole: 'boss',
  clientFocus: '',
  history: 'new',
};
