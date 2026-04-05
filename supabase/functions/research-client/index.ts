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

    const { clientName, product } = await req.json();

    const systemPrompt = `你是一位台灣食品與烘焙產業情報分析師，專精於品牌研究與市場分析。
你的任務是根據客戶名稱與相關產品，提供詳盡的品牌背景研究報告。

請提供以下面向的分析（使用繁體中文）：

1. **品牌簡介**：品牌歷史、創辦理念、市場定位
2. **主要產品線**：核心產品類別、招牌品項、產品特色
3. **目標客群**：主要服務對象、消費者輪廓、通路佈局
4. **近期動態**：近期新聞、展店計畫、新品發布、行銷活動
5. **合作切入點建議**：根據苗林行的產品優勢，提出具體的合作機會與建議

請以結構化的方式呈現，內容要具體且有洞察力，避免空泛的描述。
如果你不確定某些資訊，請合理推測並標注。`;

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
              content: `請研究以下客戶：\n客戶名稱：${clientName}\n相關產品：${product}`,
            },
          ],
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
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content returned from AI");
    }

    return new Response(JSON.stringify({ research: content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in research-client:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
