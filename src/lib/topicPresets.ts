export interface TopicPreset {
  id: string;
  label: string;
  topics: string[];
}

export const TOPIC_PRESETS: TopicPreset[] = [
  {
    id: "engineering",
    label: "工程 / 技術研發",
    topics: ["程式邏輯", "系統設計", "資料結構與演算法", "除錯與測試", "效能優化", "技術選型"],
  },
  {
    id: "design",
    label: "設計 (UX/UI/視覺)",
    topics: ["使用者研究", "資訊架構", "互動設計", "視覺系統", "設計工具", "設計思維"],
  },
  {
    id: "marketing",
    label: "行銷 / 品牌",
    topics: ["品牌策略", "數位行銷", "活動企劃", "數據分析", "內容行銷", "KPI 管理"],
  },
  {
    id: "sales",
    label: "業務 / 銷售",
    topics: ["客戶開發", "談判技巧", "產業知識", "CRM 系統", "提案簡報", "關係維護"],
  },
  {
    id: "product",
    label: "產品 / PM",
    topics: ["需求分析", "用戶研究", "優先順序管理", "敏捷開發", "跨部門協作", "產品數據"],
  },
  {
    id: "finance",
    label: "財會 / 法務",
    topics: ["財務報表", "稅務實務", "內控作業", "法遵知識", "系統操作", "風險管理"],
  },
  {
    id: "hr",
    label: "人資 / 行政",
    topics: ["招募策略", "員工關係", "薪酬福利", "訓練發展", "勞工法規", "組織發展"],
  },
  {
    id: "general",
    label: "通用軟實力",
    topics: ["溝通表達", "問題解決", "團隊合作", "抗壓性", "自我管理", "學習能力"],
  },
];

export function findPreset(id: string): TopicPreset | undefined {
  return TOPIC_PRESETS.find((p) => p.id === id);
}
