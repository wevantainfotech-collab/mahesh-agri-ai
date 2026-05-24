
-- SHOPS
CREATE TABLE public.shops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  phone_number TEXT,
  whatsapp_number TEXT,
  theme_color TEXT NOT NULL DEFAULT '#16a34a',
  address TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX shops_slug_idx ON public.shops(slug);
ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view active shops" ON public.shops
  FOR SELECT USING (is_active = true);

-- FARMER CHATS
CREATE TABLE public.farmer_chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  question TEXT,
  response TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX farmer_chats_shop_id_idx ON public.farmer_chats(shop_id, created_at DESC);
ALTER TABLE public.farmer_chats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can insert chats for active shops" ON public.farmer_chats
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.shops s WHERE s.id = shop_id AND s.is_active = true)
  );
CREATE POLICY "Public can view chats for active shops" ON public.farmer_chats
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.shops s WHERE s.id = shop_id AND s.is_active = true)
  );

-- AI USAGE LOGS
CREATE TABLE public.ai_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  tokens_used INTEGER NOT NULL DEFAULT 0,
  response_time INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ai_usage_logs_shop_id_idx ON public.ai_usage_logs(shop_id, created_at DESC);
ALTER TABLE public.ai_usage_logs ENABLE ROW LEVEL SECURITY;
-- No public access; only service role writes via server fn.

-- STORAGE BUCKET for shop assets and farmer crop photos
INSERT INTO storage.buckets (id, name, public) VALUES ('shop-assets', 'shop-assets', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public can read shop-assets"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'shop-assets');

CREATE POLICY "Public can upload crop images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'shop-assets'
    AND (storage.foldername(name))[1] = 'chat-images'
  );

-- SEED demo shop
INSERT INTO public.shops (shop_name, slug, phone_number, whatsapp_number, theme_color, address)
VALUES ('Mahesh Agro', 'maheshagro', '+919876543210', '+919876543210', '#16a34a', 'Nashik, Maharashtra');
