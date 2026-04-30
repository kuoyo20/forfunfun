import type {
  ChipFlow,
  KBar,
  LightSignal,
  MainForceAlert,
  NextDayScenario,
  TechSummary,
} from "./types";

export function buildPlaybook(prevClose: number): NextDayScenario[] {
  return [
    {
      type: "high-open-up",
      label: "開高走高",
      entryLow: round(prevClose * 1.004),
      entryHigh: round(prevClose * 1.010),
      stopLoss: round(prevClose * 0.978),
      target1: round(prevClose * 1.062),
      target2: round(prevClose * 1.114),
    },
    {
      type: "range",
      label: "震盪整理",
      entryLow: round(prevClose * 0.971),
      entryHigh: round(prevClose * 0.997),
      stopLoss: round(prevClose * 0.952),
      target1: round(prevClose * 1.036),
      target2: round(prevClose * 1.075),
    },
    {
      type: "low-open-pullback",
      label: "開低回測",
      entryLow: round(prevClose * 0.939),
      entryHigh: round(prevClose * 0.952),
      stopLoss: round(prevClose * 0.920),
      target1: round(prevClose * 0.984),
      target2: round(prevClose * 1.024),
    },
  ];
}

export function buildMainForceAlert(chip: ChipFlow): MainForceAlert {
  const main: LightSignal =
    chip.mainForceNet5d > 500 ? "green" : chip.mainForceNet5d < -500 ? "red" : "yellow";
  const concentration: LightSignal =
    chip.concentration > 15 ? "red" : chip.concentration > 5 ? "yellow" : "green";
  const stability: LightSignal =
    chip.stability > 0.7 ? "green" : chip.stability > 0.4 ? "yellow" : "red";

  let conclusion = "中性偏多";
  if (main === "red" || concentration === "red") conclusion = "警示偏空";
  else if (main === "green" && stability === "green") conclusion = "偏多明確";
  else if (main === "yellow" && concentration === "yellow") conclusion = "中性整理";

  const description =
    main === "yellow"
      ? "主力進出互見，籌碼趨於穩定"
      : main === "green"
      ? "主力買盤積極，籌碼集中且穩定"
      : "主力連續賣超，籌碼鬆動須留意";

  return { mainForce: main, concentration, stability, conclusion, description };
}

export function buildOverallConclusion(opts: {
  tech: TechSummary;
  bars: KBar[];
  supportUpper: number;
}): string {
  const last = opts.bars[opts.bars.length - 1];
  const above = last.close >= opts.supportUpper;
  const isShrink = opts.tech.volumeStatus === "量能略縮";
  const isBull = opts.tech.trendDirection === "bull";
  const isBear = opts.tech.trendDirection === "bear";

  if (isBull && isShrink && above) {
    return "股價處於多頭趨勢高檔整理，量縮等待方向，守穩支撐區仍有挑戰新高機會，短線操作宜靈活控管風險。";
  }
  if (isBull && !above) {
    return "短線跌破均線支撐，留意轉弱風險，多單宜分批出場。";
  }
  if (isBear && opts.tech.volumeStatus === "量能放大") {
    return "空頭排列且量增殺盤，等待止跌訊號出現再考慮承接。";
  }
  if (!isBull && !isBear && isShrink) {
    return "量縮盤整中，等待量價同步突破再行動。";
  }
  return "多空交戰，宜降低部位、靜待方向確立。";
}

function round(n: number) {
  return Math.round(n * 10) / 10;
}
