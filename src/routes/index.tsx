import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Sparkles, Mic, Image as ImageIcon, Languages, Smartphone, Shield, ArrowRight, Leaf } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Mahesh Agro — AI Sheti Sallagar (AI शेती सल्लागार)" },
      { name: "description", content: "Mahesh Agro AI Sheti Sallagar - Crop guidance, diseases diagnosis, and solutions in Marathi for farmers." },
      { property: "og:title", content: "Mahesh Agro — AI Sheti Sallagar" },
      { property: "og:description", content: "Mahesh Agro AI Sheti Sallagar - Crop solutions in Marathi for farmers." },
    ],
  }),
  component: Landing,
});

const features = [
  { icon: Languages, title: "मराठी native", desc: "Built ground-up for Marathi farmers. Replies are practical, local, and respectful." },
  { icon: Mic, title: "Voice in, answers out", desc: "Tap the mic, ask in Marathi. No typing required for low-literacy users." },
  { icon: ImageIcon, title: "Crop photo diagnosis", desc: "Farmers snap a leaf, AI suggests likely disease and treatment." },
  { icon: Smartphone, title: "Mobile-first PWA", desc: "Installs to home screen. Loads on 3G. Optimized for low-end Android." },
  { icon: Shield, title: "Your brand, your shop", desc: "Logo, theme color, phone — every reply quietly drives footfall back." },
  { icon: Sparkles, title: "Gemini-powered", desc: "Latest Google Gemini multimodal model. Fast, accurate, multilingual." },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-hero shadow-elegant">
              <Leaf className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-display text-lg font-bold tracking-tight">Mahesh Agro</span>
          </div>
          <Link
            to="/$slug" params={{ slug: "maheshagro" }}
            className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background transition hover:opacity-90"
          >
            Try demo →
          </Link>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-soft" />
        <div className="relative mx-auto max-w-6xl px-5 py-20 md:py-28">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-3xl text-center"
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
              <Sparkles className="h-3.5 w-3.5" /> Marathi AI for Indian farmers
            </span>
            <h1 className="mt-6 font-display text-5xl font-bold leading-[1.05] tracking-tight md:text-7xl">
              Your agri-shop. <br />
              <span className="bg-gradient-hero bg-clip-text text-transparent">A farmer's AI agronomist.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-base text-muted-foreground md:text-lg">
              A white-labeled AI assistant — branded for your shop — that farmers can ask questions in <span className="font-marathi font-semibold text-foreground">मराठी</span>, by voice, text, or a photo of a sick crop.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/$slug" params={{ slug: "maheshagro" }}
                className="inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-semibold text-background shadow-elegant transition hover:scale-[1.02]"
              >
                Try the live demo <ArrowRight className="h-4 w-4" />
              </Link>
              <a href="#features" className="rounded-full border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground hover:bg-secondary">
                See features
              </a>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mx-auto mt-16 max-w-md"
          >
            <PhoneMockup />
          </motion.div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="mx-auto max-w-6xl px-5 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-bold tracking-tight md:text-5xl">Everything a shop needs.<br />Nothing a farmer doesn't.</h2>
          <p className="mt-4 text-muted-foreground">Built mobile-first, voice-first, Marathi-first.</p>
        </div>
        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="group rounded-2xl border border-border bg-card p-6 shadow-card transition hover:-translate-y-1 hover:border-primary/40"
            >
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-hero text-primary-foreground shadow-elegant">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-5 font-display text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-5 pb-24">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-hero p-10 text-center shadow-elegant md:p-16">
          <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_20%_20%,white,transparent_40%),radial-gradient(circle_at_80%_60%,white,transparent_45%)]" />
          <div className="relative">
            <h2 className="font-display text-3xl font-bold text-primary-foreground md:text-5xl">
              Onboard your shop in minutes.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-primary-foreground/90">
              Pick a slug, upload your logo, pick a theme color — share <code className="rounded bg-black/20 px-1.5 py-0.5 text-sm">/yourshop</code> with farmers.
            </p>
            <Link
              to="/$slug" params={{ slug: "maheshagro" }}
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-background px-6 py-3 text-sm font-semibold text-foreground hover:opacity-90"
            >
              Open demo shop <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-border/60 py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Mahesh Agro
      </footer>
    </div>
  );
}

function PhoneMockup() {
  return (
    <div className="relative mx-auto w-full max-w-sm rounded-[3rem] border-[10px] border-foreground bg-foreground p-2 shadow-elegant">
      <div className="overflow-hidden rounded-[2.2rem] bg-background">
        <div className="bg-gradient-hero px-5 py-4 text-primary-foreground">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-white/20 font-display font-bold">M</div>
            <div>
              <div className="text-sm font-semibold">Mahesh Agro</div>
              <div className="text-xs opacity-80">AI सहायक · ऑनलाइन</div>
            </div>
          </div>
        </div>
        <div className="space-y-3 p-4 text-sm font-marathi">
          <div className="ml-auto max-w-[80%] rounded-2xl rounded-tr-md bg-primary px-4 py-2.5 text-primary-foreground">
            माझ्या टोमॅटोच्या पानांवर पिवळे डाग आले आहेत.
          </div>
          <div className="max-w-[85%] rounded-2xl rounded-tl-md bg-secondary px-4 py-2.5 text-secondary-foreground">
            हे लवकर ब्लाइट (Early Blight) रोगाचे लक्षण असू शकते. मॅन्कोझेब ७५% WP, २ ग्रॅम प्रति लिटर पाण्यात मिसळून फवारणी करा...
          </div>
          <div className="rounded-xl border-2 border-dashed border-primary/40 bg-primary/5 p-3 text-center text-xs text-primary">
            हे औषध Mahesh Agro येथे उपलब्ध आहे · 📞 +91 98765 43210
          </div>
        </div>
      </div>
    </div>
  );
}
