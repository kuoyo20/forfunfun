# 台股即時監控儀表板 — 規格書

> 範例標的：3583 辛耘
> 僅供研究使用，**非投資建議**。

---

## 一、技術棧

| 層級 | 選型 | 理由 |
|---|---|---|
| 前端 | React 18 + Vite + TypeScript | 既有專案 |
| UI | TailwindCSS + shadcn/ui | 既有專案 |
| 圖表 | recharts | 既有專案，足以畫 K 線 + MA + 量能 |
| 狀態 | @tanstack/react-query | 既有專案，內建快取 + polling |
| 即時 | polling 5s（盤中）/ 60s（盤後） | FinMind 免費版無 WS |
| 資料 | mock（預設）→ FinMind（真實） | 切換用 env：`VITE_STOCK_PROVIDER=mock\|finmind` |

## 二、資料來源

| 資料 | 來源 | 端點 |
|---|---|---|
| 即時報價 + 內外盤 | FinMind | `TaiwanStockPriceTick` |
| 日 K + 量 | FinMind | `TaiwanStockPrice` |
| 三大法人 | FinMind | `TaiwanStockInstitutionalInvestorsBuySell` |
| 主力進出 | FinMind | `TaiwanStockShareholding` |

## 三、指標計算公式

### 1. 均線 MA(n)
```
MA(n)[i] = mean(close[i-n+1 .. i])
```

### 2. KD（隨機指標，9 日）
```
RSV = (close - low9) / (high9 - low9) * 100
K = 2/3 * prevK + 1/3 * RSV
D = 2/3 * prevD + 1/3 * K
KD 高檔鈍化 = K > 80 連續 3 日
KD 低檔鈍化 = K < 20 連續 3 日
```

### 3. MACD（12, 26, 9）
```
DIF = EMA12(close) - EMA26(close)
DEM = EMA9(DIF)
OSC = DIF - DEM
正值收斂：DIF > 0 且 OSC 連續縮小
```

### 4. 多方排列
```
MA5 > MA20 > MA60 → "多頭排列 (5>20>60)"
MA5 < MA20 < MA60 → "空頭排列 (5<20<60)"
其他 → "盤整"
```

### 5. 均線乖離率
```
bias = (close - MA20) / MA20 * 100
```

### 6. 量能略縮 / 略增
```
vol_ma5 = mean(volume[-5:])
ratio = volume[today] / vol_ma5
ratio < 0.9 → 量縮
ratio > 1.2 → 量增
else → 持平
```

### 7. 內外盤
```
內盤（賣壓）= 以買價成交的張數總和
外盤（買盤）= 以賣價成交的張數總和
內外盤比 = 內盤 / (內盤+外盤) : 外盤 / (內盤+外盤)
外盤 > 內盤 → 買盤積極
```

### 8. 籌碼集中度（近 5 日）
```
top10_buy = 前 10 大券商買超合計（張）
total_volume_5d = 近 5 日總成交量（張）
集中度 = top10_buy / total_volume_5d * 100%
集中度 > 15% → 紅燈（高度集中）
5%~15%   → 黃燈（中度集中）
< 5%     → 綠燈（分散）
```
> mock 階段以隨機常數替代。

### 9. 籌碼穩定度
```
近 20 日「外資 + 投信」連續同方向天數 / 20
> 70% → 綠燈（穩定）
40~70% → 黃燈（中性）
< 40% → 紅燈（不穩）
```

### 10. 主力動向（三檔燈號）
```
主力買賣超 = 外資 + 投信 + 自營商（近 5 日合計，張）
> +500 → 綠燈（買超）
-500 ~ +500 → 黃燈（互見）
< -500 → 紅燈（賣超）
```

### 11. 短線勝率（近 10 日）
```
days = 近 10 個交易日
wins = 隔日收盤 > 當日收盤 之天數
勝率 = wins / 10 * 100%
```

### 12. 關鍵價位
```
壓力區上 = 近 60 日最高
壓力區下 = 近 20 日最高
支撐區上 = MA20
支撐區下 = MA60 或 近 60 日最低，取大者
```

### 13. K 線型態（單日判定）
| 型態 | 條件 |
|---|---|
| 長紅 K | (close-open)/open > 3% 且 close 在 high 之 95% 以內 |
| 長黑 K | (open-close)/open > 3% 且 close 在 low 之 105% 以內 |
| 高檔回落 | 高點創 20 日新高 但 close < (high+low)/2 |
| 帶上影線 | (high - max(open,close)) / (high-low) > 0.5 |
| 帶下影線 | (min(open,close) - low) / (high-low) > 0.5 |
| 量縮整理 | 連續 3 日 vol < vol_ma5 且 |close-MA5|/MA5 < 2% |

### 14. W 底 / M 頭（簡化）
```
W 底：近 60 日內找兩個低點 L1, L2，且 |L1-L2|/L1 < 3%，
       中間有一個高點 H，H > L1*1.05，第二低點後突破 H → 成立
M 頭：對稱反向
```
> 未達上述條件 → 「未形成標準 W 底 / M 頭」

### 15. 多週期趨勢
```
日 K：MA5/MA20 排列方向
週 K：將日 K 重抽成週 K，再算 MA5（=25 日均線）/ MA10（=50 日均線）
月 K：再重抽成月 K，看 MA3 / MA6
強度：
  收盤 > MA20 且 MA20 上揚 → "強"
  收盤 > MA20 但 MA20 走平 → "中強"
  其他 → "弱"
```

### 16. 隔日操作劇本（規則式，不可用 LLM 自由生成）
| 情境 | 觸發條件 | 進場價 | 停損 | 目標 |
|---|---|---|---|---|
| ① 開高走高 | 開盤 > 昨收 × 1.005 且 5min 內未破開盤 | 開盤 ~ 開盤×1.007 | 昨收 × 0.978 (-2.2%) | 近期高 / 前波高 |
| ② 震盪整理 | 開盤在 昨收 ±0.5% 內 | 昨收×0.97 ~ 昨收×0.995 | 昨收 × 0.95 | 昨收 × 1.06 / × 1.10 |
| ③ 開低回測 | 開盤 < 昨收 × 0.99 | 昨收×0.94 ~ 昨收×0.95 | 昨收 × 0.92 | 昨收 × 0.985 / × 1.02 |

> 三組價位皆以「昨收」為基準；UI 上顯示時換算成實際價。

### 17. 整體結論（規則 → 文字）
條件用 AND 串接，符合最先匹配者輸出：

| 條件 | 文字 |
|---|---|
| 多頭排列 + 量縮 + 守支撐 | 股價處於多頭趨勢高檔整理，量縮等待方向，守穩支撐區仍有挑戰新高機會，短線操作宜靈活控管風險。 |
| 多頭排列 + 跌破 MA20 | 短線跌破均線支撐，留意轉弱風險，多單宜分批出場。 |
| 空頭排列 + 量增下跌 | 空頭排列且量增殺盤，等待止跌訊號出現再考慮承接。 |
| 盤整 + 量縮 | 量縮盤整中，等待量價同步突破再行動。 |
| 其他 | 多空交戰，宜降低部位、靜待方向確立。 |

## 四、UI / Layout（對應截圖 14 區塊）

```
┌─ HeaderQuote (代號/名稱/現價/漲跌/單量/成交量/時間 + 內外盤條) ─┐
├─ KLineChart (主視覺 1/2 寬) ┬─ TechnicalSummary ─┬─ Industry/Company ─┤
│                              │ ChipAnalysis        │                    │
├─ MainForceAlert ─ WinRateGauge ─ KeyPriceLevels ─ VolPriceStruct ─ InOutStruct ─┤
├─ KLinePatternTable ─ PatternAnalysis ─ MultiPeriodAnalysis ─ NextDayPlaybook ─┤
└─ OverallConclusion (整版底部結論 banner) ───────────────────────────┘
```

## 五、實作順序（已完成 ✅ / 進行中 🔧 / 待辦 ⏳）

1. ✅ 規格書 + 公式
2. ⏳ types/ + mock data
3. ⏳ services/ (mock provider 先行)
4. ⏳ KLineChart 元件
5. ⏳ 各分析面板
6. ⏳ 規則引擎（隔日劇本 + 整體結論）
7. ⏳ StockMonitor page 組裝 + polling
8. ⏳ 路由 + build 驗證
