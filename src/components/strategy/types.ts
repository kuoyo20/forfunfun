export interface FormData {
  brandName: string;
  targetType: "chef" | "owner" | "procurement";
  product: string;
  salesMode: "craftsman" | "wolf" | "spin" | "challenger";
  mainItems: string;
  notes: string;
}

export interface DiagnosticData {
  targetAnalysis: string;
  productFit: string;
  painPoints: string[];
  openingStrategy: string;
  recommendedApproach: string;
  keyMessages: string[];
}

export interface StrategyData {
  trendInsights: string[];
  competitorAnalysis: string;
  pricingStrategy: string;
  proposalOutline: string[];
  closingTechniques: string[];
  followUpPlan: string;
}

export interface RevenueItem {
  id: string;
  itemName: string;
  unitPrice: number;
  quantity: number;
}
