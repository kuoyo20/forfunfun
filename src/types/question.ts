export type QuestionPhase = 'opening' | 'needs' | 'pain' | 'vision' | 'closing' | 'history' | 'custom';

export interface Question {
  id: string;
  ask: string;
  listen: string;
  praise: string;
  type: QuestionPhase;
}

export type QuestionCategory = 'general' | 'boss' | 'chef' | 'purchaser' | 'marketing' | 'newClient' | 'existingClient' | 'closing';
