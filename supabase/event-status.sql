-- events status column
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- photo_posts market fields
ALTER TABLE public.photo_posts ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES events(id);
ALTER TABLE public.photo_posts ADD COLUMN IF NOT EXISTS price INTEGER DEFAULT 0;

-- purchases table
CREATE TABLE IF NOT EXISTS public.photo_purchases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  photo_id UUID NOT NULL REFERENCES photo_posts(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES users(id),
  purchased_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(photo_id, buyer_id)
);
ALTER TABLE public.photo_purchases ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'photo_purchases' AND policyname = 'purchases_select') THEN
    CREATE POLICY "purchases_select" ON photo_purchases FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'photo_purchases' AND policyname = 'purchases_insert') THEN
    CREATE POLICY "purchases_insert" ON photo_purchases FOR INSERT WITH CHECK (auth.uid() = buyer_id);
  END IF;
END $$;

-- set_event_pending RPC
CREATE OR REPLACE FUNCTION set_event_pending(p_event_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  p_user_id UUID := auth.uid();
  v_created_by UUID;
  v_event_date TIMESTAMPTZ;
BEGIN
  SELECT created_by, event_date INTO v_created_by, v_event_date FROM events WHERE id = p_event_id;
  IF p_user_id != v_created_by THEN
    RETURN jsonb_build_object('success', false, 'message', '권한이 없습니다');
  END IF;
  IF v_event_date > NOW() THEN
    RETURN jsonb_build_object('success', false, 'message', '아직 모임 시간이 되지 않았습니다');
  END IF;
  UPDATE events SET status = 'pending' WHERE id = p_event_id AND status = 'active';
  RETURN jsonb_build_object('success', true);
END; $$;

-- set_event_completed RPC
CREATE OR REPLACE FUNCTION set_event_completed(p_event_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  p_user_id UUID := auth.uid();
  v_created_by UUID;
BEGIN
  SELECT created_by INTO v_created_by FROM events WHERE id = p_event_id;
  IF p_user_id != v_created_by THEN
    RETURN jsonb_build_object('success', false, 'message', '권한이 없습니다');
  END IF;
  UPDATE events SET status = 'completed' WHERE id = p_event_id AND status = 'pending';
  RETURN jsonb_build_object('success', true);
END; $$;

-- purchase_photo RPC
CREATE OR REPLACE FUNCTION purchase_photo(p_photo_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  p_buyer_id UUID := auth.uid();
  v_seller_id UUID;
  v_price INTEGER;
  v_buyer_points INTEGER;
  v_already BOOLEAN;
BEGIN
  IF p_buyer_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', '로그인이 필요합니다');
  END IF;
  SELECT user_id, price INTO v_seller_id, v_price FROM photo_posts WHERE id = p_photo_id;
  IF v_seller_id = p_buyer_id THEN
    RETURN jsonb_build_object('success', true, 'own', true);
  END IF;
  SELECT EXISTS(SELECT 1 FROM photo_purchases WHERE photo_id = p_photo_id AND buyer_id = p_buyer_id) INTO v_already;
  IF v_already THEN
    RETURN jsonb_build_object('success', true, 'already_purchased', true);
  END IF;
  SELECT points INTO v_buyer_points FROM users WHERE id = p_buyer_id;
  IF v_buyer_points < v_price THEN
    RETURN jsonb_build_object('success', false, 'message', format('포인트가 부족합니다 (%sP 필요)', v_price));
  END IF;
  UPDATE users SET points = points - v_price WHERE id = p_buyer_id;
  UPDATE users SET points = points + v_price WHERE id = v_seller_id;
  INSERT INTO photo_purchases(photo_id, buyer_id) VALUES (p_photo_id, p_buyer_id);
  RETURN jsonb_build_object('success', true, 'deducted', v_price);
END; $$;
