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

    const { product, clientName, targetRole, clientFocus, history, researchContext } =
      await req.json();

    const systemPrompt = `你是苗林行的資深業務顧問，擁有超過15年的食品原料B2B銷售經驗。
你擅長與烘焙業、餐飲業、食品加工業的採購決策者溝通。

根據以下資訊，為業務人員生成 6-8 個高品質的銷售問題，涵蓋以下階段：
- 暖場 (opening)：建立信任與關係的破冰問題
- 探索需求 (needs)：了解客戶現有採購與使用情境
- 挖掘痛點 (pain)：發掘客戶面臨的挑戰與未被滿足的需求
- 願景 (vision)：引導客戶想像合作後的理想狀態
- 締結 (closing)：推動合作決策的收尾問題

每個問題都應該包含：
1. ask：業務要問的問題
2. listen：提醒業務注意聽的關鍵回應
3. praise：可以讚美客戶的切入點

產品：${product}
客戶名稱：${clientName}
對口角色：${targetRole}
客戶關注點：${clientFocus}
${history ? `過往互動紀錄：${history}` : ""}
${researchContext ? `客戶研究資料：${researchContext}` : ""}`;

    const tools = [
      {
        type: "function",
        function: {
          name: "return_questions",
          description: "回傳生成的銷售問題陣列",
          parameters: {
            type: "object",
            properties: {
              questions: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: {
                      type: "string",
                      description: "問題的唯一識別碼，格式為 q1, q2, q3...",
                    },
                    ask: {
                      type: "string",
                      description: "業務要問的問題",
                    },
                    listen: {
                      type: "string",
                      description: "提醒業務注意聽的關鍵回應",
                    },
                    praise: {
                      type: "string",
                      description: "可以讚美客戶的切入點",
                    },
                    type: {
                      type: "string",
                      enum: ["opening", "needs", "pain", "vision", "closing"],
                      description: "問題的階段類型",
                    },
                  },
                  required: ["id", "ask", "listen", "praise", "type"],
                },
              },
            },
            required: ["questions"],
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
              content: "請根據以上資訊生成銷售問題，使用 return_questions 工具回傳結果。",
            },
          ],
          tools,
          tool_choice: { type: "function", function: { name: "return_questions" } },
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
    console.error("Error in generate-questions:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
