import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const SYSTEM_PROMPT = `तुम्ही भारतीय शेतकऱ्यांसाठी एक तज्ज्ञ कृषी सल्लागार आहात.

नियम:
- नेहमी सोप्या मराठी भाषेत उत्तर द्या.
- उत्तरे व्यावहारिक, थोडक्यात आणि सहज समजेल अशी ठेवा.
- पीक रोगांचे निदान आणि उपाय सुचवा.
- खते आणि कीटकनाशके काळजीपूर्वक सुचवा (नाव, मात्रा, वेळ).
- कधीही हानिकारक सल्ला देऊ नका.
- कारण आणि प्रतिबंध स्पष्ट करा.
- भारतीय शेतीच्या संदर्भात उत्तर द्या.
- उत्तर ४-६ छोट्या मुद्द्यांत किंवा परिच्छेदात द्या.`;

const InputSchema = z.object({
  shopId: z.string().uuid(),
  question: z.string().max(2000).optional().default(""),
  imageUrl: z.string().url().optional(),
});

export const askAi = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => InputSchema.parse(d))
  .handler(async ({ data }) => {
    const lovableApiKey = process.env.LOVABLE_API_KEY;
    const geminiApiKey = process.env.GEMINI_API_KEY;
    const openaiApiKey = process.env.OPENAI_API_KEY;

    let apiKey = "";
    let apiUrl = "";
    let modelName = "";

    if (lovableApiKey) {
      apiKey = lovableApiKey;
      apiUrl = "https://ai.gateway.lovable.dev/v1/chat/completions";
      modelName = "google/gemini-2.5-flash";
    } else if (geminiApiKey) {
      apiKey = geminiApiKey;
      apiUrl = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
      modelName = "gemini-2.5-flash";
    } else if (openaiApiKey) {
      apiKey = openaiApiKey;
      apiUrl = "https://api.openai.com/v1/chat/completions";
      modelName = "gpt-4o-mini";
    } else {
      throw new Error("AI is not configured. Please add GEMINI_API_KEY, LOVABLE_API_KEY, or OPENAI_API_KEY to your .env file.");
    }

    if (!data.question && !data.imageUrl) throw new Error("Empty message");

    const { data: shop } = await supabaseAdmin
      .from("shops")
      .select("id, is_active")
      .eq("id", data.shopId)
      .maybeSingle();
    if (!shop || !shop.is_active) throw new Error("Shop not found");

    const userContent: Array<Record<string, unknown>> = [];
    if (data.question) userContent.push({ type: "text", text: data.question });
    if (data.imageUrl) userContent.push({ type: "image_url", image_url: { url: data.imageUrl } });

    const started = Date.now();
    const res = await fetch(apiUrl, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: modelName,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userContent.length === 1 && data.question ? data.question : userContent },
        ],
      }),
    });
    const elapsed = Date.now() - started;

    if (res.status === 429) throw new Error("बरीच विनंती आली आहे, थोड्या वेळाने पुन्हा प्रयत्न करा.");
    if (res.status === 402) throw new Error("AI क्रेडिट संपले आहेत. कृपया पुन्हा भरा.");
    if (!res.ok) {
      console.error("AI gateway error", res.status, await res.text());
      throw new Error("AI सेवा सध्या उपलब्ध नाही");
    }

    const json = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
      usage?: { total_tokens?: number };
    };
    const response = json.choices?.[0]?.message?.content ?? "क्षमा करा, उत्तर मिळाले नाही.";
    const tokens = json.usage?.total_tokens ?? 0;

    try {
      await Promise.all([
        supabaseAdmin.from("farmer_chats").insert({
          shop_id: data.shopId,
          question: data.question || null,
          response,
          image_url: data.imageUrl ?? null,
        }),
        supabaseAdmin.from("ai_usage_logs").insert({
          shop_id: data.shopId,
          tokens_used: tokens,
          response_time: elapsed,
        }),
      ]);
    } catch (dbError) {
      console.warn("Could not save chat/usage logs to Supabase database (this is expected if RLS is enabled locally):", dbError);
    }

    return { response };
  });

