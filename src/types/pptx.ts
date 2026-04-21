export interface SuccessCase {
  brand: string;
  industry: string;
  challenge: string;
  solution: string;
  result: string;
}

export interface RoiMetric {
  label: string;
  value: string;
  description: string;
}

export interface RoiAnalysis {
  title: string;
  metrics: RoiMetric[];
}

export interface PromoOffer {
  title: string;
  items: { icon: string; text: string }[];
  deadline: string;
  cta: string;
}

export interface AiPptxContent {
  successCases: SuccessCase[];
  roiAnalysis: RoiAnalysis;
  promoOffer: PromoOffer;
}

export interface PptxData {
  clientName: string;
  product: string;
  targetRole: string;
  clientFocus: string;
  questions: { id: string; ask: string; listen: string; praise: string; type: string }[];
  aiContent?: AiPptxContent;
}
