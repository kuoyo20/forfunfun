import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-api-version, x-supabase-auth-token",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not set");
    }

    const { product, clientName, clientFocus, researchContext } = await req.json();

    const systemPrompt = `你是一位資深行銷策略師，專精於 B2B 食品原料產業的提案簡報製作。
你的任務是為苗林行的業務團隊生成專業的提案簡報內容，包含三大區塊：

1. **成功案例 (successCases)**：3-4 個相關產業的合作成功案例
2. **ROI 分析 (roiAnalysis)**：量化的投資報酬分析，展示合作價值
3. **優惠方案 (promoOffer)**：具吸引力的首次合作優惠方案

產品：${product}
客戶名稱：${clientName}
客戶關注點：${clientFocus}
${researchContext ? `客戶研究資料：${researchContext}` : ""}

請根據以上資訊，生成具說服力且貼近客戶需求的提案內容。
所有內容請使用繁體中文。`;

    const tools = [
      {
        type: "function",
        function: {
          name: "return_pptx_content",
          description: "回傳提案簡報的三大區塊內容",
          parameters: {
            type: "object",
            properties: {
              successCases: {
                type: "array",
                description: "成功案例陣列",
                items: {
                  type: "object",
                  properties: {
                    brand: {
                      type: "string",
                      description: "合作品牌名稱",
                    },
                    industry: {
                      type: "string",
                      description: "所屬產業",
                    },
                    challenge: {
                      type: "string",
                      description: "客戶面臨的挑戰",
                    },
                    solution: {
                      type: "string",
                      description: "苗林行提供的解決方案",
                    },
                    result: {
                      type: "string",
                      description: "合作成果與效益",
                    },
                  },
                  required: ["brand", "industry", "challenge", "solution", "result"],
                },
              },
              roiAnalysis: {
                type: "object",
                description: "ROI 投資報酬分析",
                properties: {
                  title: {
                    type: "string",
                    description: "分析標題",
                  },
                  metrics: {
                    type: "array",
                    description: "關鍵指標陣列",
                    items: {
                      type: "object",
                      properties: {
                        label: {
                          type: "string",
                          description: "指標名稱",
                        },
                        value: {
                          type: "string",
                          description: "指標數值",
                        },
                        description: {
                          type: "string",
                          description: "指標說明",
                        },
                      },
                      required: ["label", "value", "description"],
                    },
                  },
                },
                required: ["title", "metrics"],
              },
              promoOffer: {
                type: "object",
                description: "優惠方案",
                properties: {
                  title: {
                    type: "string",
                    description: "方案標題",
                  },
                  items: {
                    type: "array",
                    description: "優惠項目陣列",
                    items: {
                      type: "object",
                      properties: {
                        icon: {
                          type: "string",
                          description: "代表此項目的 emoji 圖示",
                        },
                        text: {
                          type: "string",
                          description: "優惠項目描述",
                        },
                      },
                      required: ["icon", "text"],
                    },
                  },
                  deadline: {
                    type: "string",
                    description: "優惠截止日期或期限說明",
                  },
                  cta: {
                    type: "string",
                    description: "行動呼籲文案",
                  },
                },
                required: ["title", "items", "deadline", "cta"],
              },
            },
            required: ["successCases", "roiAnalysis", "promoOffer"],
          },
        },
      },
    ];

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            {
              role: "user",
              content:
                "請根據以上資訊生成提案簡報內容，使用 return_pptx_content 工具回傳結果。",
            },
          ],
          tools,
          tool_choice: { type: "function", function: { name: "return_pptx_content" } },
        }),
      }
    );

    if (response.status === 429) {
      return new Response(
        JSON.stringify({ error: "請求過於頻繁，請稍後再試" }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (response.status === 402) {
      return new Response(
        JSON.stringify({ error: "AI 額度不足，請加值" }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway returned ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      throw new Error("No tool call returned from AI");
    }

    const parsed = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in generate-pptx-content:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
