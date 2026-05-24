import { createFileRoute, notFound, useRouter, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Send, Camera, Phone, MessageCircle, Loader2, X, Sparkles, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { getShopBySlug } from "@/lib/shop.functions";
import { askAi } from "@/lib/chat.functions";
import { supabase } from "@/integrations/supabase/client";
const safeUUID = () => {
  if (typeof window !== "undefined" && window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

export const Route = createFileRoute("/$slug")({
  loader: async ({ params }) => {
    const { shop } = await getShopBySlug({ data: { slug: params.slug } });
    if (!shop || !shop.is_active) throw notFound();
    return { shop };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData ? `${loaderData.shop.shop_name} — AI सहायक` : "AI सहायक" },
      { name: "description", content: loaderData ? `${loaderData.shop.shop_name} चा मराठी AI शेती सल्लागार.` : "Marathi AI farming assistant." },
      { name: "theme-color", content: loaderData?.shop.theme_color ?? "#16a34a" },
    ],
  }),
  notFoundComponent: () => (
    <div className="grid min-h-screen place-items-center bg-background px-6 text-center">
      <div>
        <h1 className="font-display text-3xl font-bold">Shop not found</h1>
        <p className="mt-2 text-muted-foreground">This agri-shop is not active or doesn't exist.</p>
      </div>
    </div>
  ),
  component: ChatPage,
});

type Message = {
  id: string;
  role: "user" | "assistant";
  text: string;
  imageUrl?: string;
};

function parseMarkdown(text: string) {
  if (!text) return "";
  
  // Safe escape
  let html = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Bold (**text**) -> premium bold styling
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-foreground opacity-95">$1</strong>');

  // Bullet points (- text or * text) -> modern list items
  html = html.replace(/^\s*[-*]\s+(.*?)$/gm, '<li class="ml-4 list-disc pl-1 my-1.5 leading-relaxed text-foreground/90">$1</li>');

  // Group continuous <li> into <ul>
  html = html.replace(/(<li.*?>.*?<\/li>)+/g, '<ul class="my-2.5 space-y-1.5">$1</ul>');

  // Numbered list items like "1. **title**" or "1. title" -> sleek numbered block
  html = html.replace(/^\s*(\d+)\.\s+(.*?)$/gm, '<div class="font-semibold text-[16px] text-foreground mt-3 flex items-start gap-1.5"><span class="text-primary font-bold font-display">$1.</span><span>$2</span></div>');

  // Line breaks
  html = html.replace(/\n/g, '<br />');

  // Remove duplicate breaks
  html = html.replace(/(<br \/>){2,}/g, '<div class="h-2.5"></div>');

  return html;
}

function ChatPage() {
  const { shop } = Route.useLoaderData();
  const router = useRouter();
  const ask = useServerFn(askAi);

  const [messages, setMessages] = useState<Message[]>([
    { id: "welcome", role: "assistant", text: `नमस्कार! 🙏 मी ${shop.shop_name} चा AI शेती सल्लागार आहे. तुमचा प्रश्न लिहा, बोलून सांगा, किंवा पिकाचा फोटो पाठवा.` },
  ]);
  const [input, setInput] = useState("");
  const [pendingImage, setPendingImage] = useState<{ url: string; uploading: boolean } | null>(null);
  const [sending, setSending] = useState(false);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  // theme color via CSS var
  useEffect(() => {
    if (shop.theme_color) {
      document.documentElement.style.setProperty("--shop-color", shop.theme_color);
    }
  }, [shop.theme_color]);

  function toggleVoice() {
    const SR = (typeof window !== "undefined" && ((window as any).webkitSpeechRecognition || (window as any).SpeechRecognition));
    if (!SR) {
      toast.error("Voice input not supported on this browser");
      return;
    }
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    const r = new SR();
    r.lang = "mr-IN";
    r.continuous = false;
    r.interimResults = true;
    r.onresult = (e: any) => {
      const text = Array.from(e.results).map((x: any) => x[0].transcript).join("");
      setInput(text);
    };
    r.onend = () => setListening(false);
    r.onerror = () => { setListening(false); toast.error("Voice error, try again"); };
    r.start();
    recognitionRef.current = r;
    setListening(true);
  }

  async function handleFile(file: File) {
    if (file.size > 8 * 1024 * 1024) { toast.error("Image must be under 8MB"); return; }
    if (!file.type.startsWith("image/")) { toast.error("Only image files"); return; }
    setPendingImage({ url: "", uploading: true });
    const ext = file.name.split(".").pop() || "jpg";
    const path = `chat-images/${shop.id}/${safeUUID()}.${ext}`;
    const { error } = await supabase.storage.from("shop-assets").upload(path, file, { contentType: file.type, upsert: false });
    if (error) { toast.error("Upload failed"); setPendingImage(null); return; }
    const { data } = supabase.storage.from("shop-assets").getPublicUrl(path);
    setPendingImage({ url: data.publicUrl, uploading: false });
  }

  async function send() {
    const text = input.trim();
    if (!text && !pendingImage?.url) return;
    if (pendingImage?.uploading) { toast.message("Image still uploading…"); return; }

    const userMsg: Message = { id: safeUUID(), role: "user", text, imageUrl: pendingImage?.url };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setPendingImage(null);
    setSending(true);

    try {
      const res = await ask({ data: { shopId: shop.id, question: text, imageUrl: userMsg.imageUrl } });
      setMessages((m) => [...m, { id: safeUUID(), role: "assistant", text: res.response }]);
    } catch (e: any) {
      toast.error(e?.message ?? "Something went wrong");
    } finally {
      setSending(false);
    }
  }

  const themeStyle = { "--shop": shop.theme_color } as React.CSSProperties;

  return (
    <div className="flex h-[100dvh] flex-col bg-background" style={themeStyle}>
      {/* Header */}
      <header className="border-b border-border/60 bg-card/80 px-4 py-3 backdrop-blur-xl">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <Link
            to="/"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-secondary text-secondary-foreground hover:bg-primary hover:text-primary-foreground transition-all duration-200 shadow-sm"
            aria-label="Home"
          >
            <ArrowLeft className="h-4.5 w-4.5" />
          </Link>
          <div
            className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-2xl font-display text-lg font-bold text-white shadow-card"
            style={{ background: shop.theme_color }}
          >
            {shop.logo_url ? (
              <img src={shop.logo_url} alt={shop.shop_name} className="h-full w-full object-cover" />
            ) : (
              shop.shop_name.charAt(0)
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate font-display text-base font-semibold text-foreground">{shop.shop_name}</div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500" /> AI सहायक · ऑनलाइन
            </div>
          </div>
          {shop.phone_number && (
            <a href={`tel:${shop.phone_number}`} aria-label="Call" className="grid h-10 w-10 place-items-center rounded-full bg-secondary text-secondary-foreground hover:bg-primary hover:text-primary-foreground">
              <Phone className="h-4 w-4" />
            </a>
          )}
          {shop.whatsapp_number && (
            <a href={`https://wa.me/${shop.whatsapp_number.replace(/\D/g, "")}`} target="_blank" rel="noopener" aria-label="WhatsApp" className="grid h-10 w-10 place-items-center rounded-full bg-secondary text-secondary-foreground hover:bg-primary hover:text-primary-foreground">
              <MessageCircle className="h-4 w-4" />
            </a>
          )}
        </div>
      </header>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto bg-gradient-soft">
        <div className="mx-auto flex max-w-2xl flex-col gap-3 px-4 py-5">
          <AnimatePresence initial={false}>
            {messages.map((m) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={m.role === "user" ? "ml-auto max-w-[85%]" : "mr-auto max-w-[90%]"}
              >
                {m.imageUrl && (
                  <img src={m.imageUrl} alt="" className="mb-1 max-h-64 rounded-2xl object-cover shadow-card" />
                )}
                {m.text && (
                  <div
                    className={
                      "rounded-2xl px-4 py-3 font-marathi text-[16px] leading-relaxed shadow-card " +
                      (m.role === "user"
                        ? "rounded-tr-md text-white"
                        : "rounded-tl-md bg-card text-card-foreground")
                    }
                    style={m.role === "user" ? { background: shop.theme_color } : undefined}
                    dangerouslySetInnerHTML={{ __html: parseMarkdown(m.text) }}
                  />
                )}
                {m.role === "assistant" && m.id !== "welcome" && (
                  <PromoCard shop={shop} />
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {sending && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mr-auto max-w-[60%] rounded-2xl rounded-tl-md bg-card px-4 py-3 shadow-card">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> विचार करत आहे...
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Pending image preview */}
      {pendingImage && (
        <div className="border-t border-border bg-card px-4 py-2">
          <div className="mx-auto flex max-w-2xl items-center gap-3">
            {pendingImage.uploading ? (
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-muted">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : (
              <img src={pendingImage.url} alt="" className="h-16 w-16 rounded-xl object-cover" />
            )}
            <div className="flex-1 text-sm text-muted-foreground">
              {pendingImage.uploading ? "Uploading…" : "Photo ready · add a question or send"}
            </div>
            <button onClick={() => setPendingImage(null)} className="rounded-full p-2 hover:bg-secondary">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Input bar */}
      <div className="border-t border-border bg-card px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto flex max-w-2xl items-end gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            aria-label="Upload photo"
            className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-secondary text-secondary-foreground hover:bg-primary hover:text-primary-foreground"
          >
            <Camera className="h-5 w-5" />
          </button>
          <div className="flex flex-1 items-end rounded-3xl border border-border bg-background px-1 py-1 focus-within:border-primary">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder="प्रश्न लिहा..."
              rows={1}
              className="max-h-32 flex-1 resize-none bg-transparent px-3 py-3 font-marathi text-[15px] text-foreground outline-none placeholder:text-muted-foreground"
            />
            <button
              onClick={toggleVoice}
              aria-label="Voice"
              className={
                "grid h-10 w-10 place-items-center rounded-full transition " +
                (listening ? "animate-pulse bg-destructive text-destructive-foreground" : "text-muted-foreground hover:bg-secondary")
              }
            >
              {listening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </button>
          </div>
          <button
            onClick={send}
            disabled={sending || (!input.trim() && !pendingImage?.url)}
            aria-label="Send"
            className="grid h-12 w-12 shrink-0 place-items-center rounded-full text-white shadow-elegant transition disabled:opacity-40"
            style={{ background: shop.theme_color }}
          >
            {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          </button>
        </div>
      </div>
    </div>
  );
}

function PromoCard({ shop }: { shop: { shop_name: string; phone_number: string | null; theme_color: string } }) {
  if (!shop.phone_number) return null;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.2 }}
      className="mt-2 rounded-2xl border-2 border-dashed p-3 text-sm"
      style={{ borderColor: shop.theme_color + "55", background: shop.theme_color + "0d" }}
    >
      <div className="flex items-center gap-2 font-marathi font-medium" style={{ color: shop.theme_color }}>
        <Sparkles className="h-4 w-4" />
        <span>हे औषध <strong>{shop.shop_name}</strong> येथे उपलब्ध आहे</span>
      </div>
      <a href={`tel:${shop.phone_number}`} className="mt-1 inline-block text-sm font-semibold text-foreground">
        📞 {shop.phone_number}
      </a>
    </motion.div>
  );
}
