export type LightSignal = "green" | "yellow" | "red";
export type TrendDirection = "bull" | "bear" | "range";
export type TrendStrength = "strong" | "medium-strong" | "weak";

export interface Quote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePct: number;
  lotSize: number;
  totalVolume: number;
  time: string;
  innerVolume: number;
  outerVolume: number;
}

export interface KBar {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface KBarWithMA extends KBar {
  ma5?: number;
  ma20?: number;
  ma60?: number;
}

export interface ChipFlow {
  mainForceNet5d: number;
  foreignNet5d: number;
  itrustNet5d: number;
  concentration: number;
  stability: number;
}

export interface TechSummary {
  trendDirection: TrendDirection;
  maStatus: string;
  kdStatus: string;
  macdStatus: string;
  volumeStatus: string;
  volPriceRelation: string;
  biasMA20: number;
}

export interface PriceLevels {
  resistanceUpper: number;
  resistanceLower: number;
  supportUpper: number;
  supportLower: number;
  recentHigh: number;
}

export interface KPattern {
  name: string;
  matched: boolean;
  description: string;
}

export interface MultiPeriodRow {
  period: "daily" | "weekly" | "monthly";
  trend: TrendDirection;
  strength: TrendStrength;
  note: string;
}

export interface NextDayScenario {
  type: "high-open-up" | "range" | "low-open-pullback";
  label: string;
  entryLow: number;
  entryHigh: number;
  stopLoss: number;
  target1: number;
  target2: number;
}

export interface MainForceAlert {
  mainForce: LightSignal;
  concentration: LightSignal;
  stability: LightSignal;
  conclusion: string;
  description: string;
}

export interface IndustryInfo {
  industry: string[];
  company: string[];
}

export interface StockSnapshot {
  quote: Quote;
  kbars: KBar[];
  chip: ChipFlow;
  industry: IndustryInfo;
  shortTermWinRate: number;
}
