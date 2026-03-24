-- ============================================
-- 복권 시스템
-- ============================================

-- 1. 복권 설정 (단일 행)
CREATE TABLE IF NOT EXISTS public.lottery_config (
  id INTEGER PRIMARY KEY DEFAULT 1,
  mode TEXT NOT NULL DEFAULT 'winner_takes_all',
  prize_percentage INTEGER NOT NULL DEFAULT 50,
  distribution JSONB NOT NULL DEFAULT '[{"rank":1,"percentage":100}]',
  CHECK (id = 1)
);

INSERT INTO public.lottery_config (id, mode, prize_percentage, distribution)
VALUES (1, 'winner_takes_all', 50, '[{"rank":1,"percentage":100}]')
ON CONFLICT (id) DO NOTHING;

-- 2. 복권 회차
CREATE TABLE IF NOT EXISTS public.lottery_rounds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  round_date DATE NOT NULL DEFAULT (NOW() AT TIME ZONE 'Asia/Seoul')::DATE,
  prize_amount INTEGER NOT NULL DEFAULT 0,
  mode TEXT NOT NULL,
  distribution JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  drawn_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lottery_rounds_date ON public.lottery_rounds(round_date DESC);
CREATE INDEX IF NOT EXISTS idx_lottery_rounds_status ON public.lottery_rounds(status);

-- 3. 복권 티켓
CREATE TABLE IF NOT EXISTS public.lottery_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  round_id UUID NOT NULL REFERENCES public.lottery_rounds(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  ticket_number INTEGER NOT NULL,
  cost_points INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lottery_tickets_round ON public.lottery_tickets(round_id);
CREATE INDEX IF NOT EXISTS idx_lottery_tickets_user_round ON public.lottery_tickets(user_id, round_id);

-- 4. 당첨 결과
CREATE TABLE IF NOT EXISTS public.lottery_winners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  round_id UUID NOT NULL REFERENCES public.lottery_rounds(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  rank INTEGER NOT NULL,
  prize_points INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lottery_winners_round ON public.lottery_winners(round_id);

-- RLS
ALTER TABLE public.lottery_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lottery_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lottery_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lottery_winners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_lottery_config" ON public.lottery_config FOR SELECT USING (true);
CREATE POLICY "select_lottery_rounds" ON public.lottery_rounds FOR SELECT USING (true);
CREATE POLICY "select_lottery_tickets" ON public.lottery_tickets FOR SELECT USING (true);
CREATE POLICY "select_lottery_winners" ON public.lottery_winners FOR SELECT USING (true);

-- ============================================
-- 티켓 구매 RPC
-- ============================================
CREATE OR REPLACE FUNCTION buy_lottery_ticket(p_round_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  p_user_id UUID;
  v_ticket_count INTEGER;
  v_cost INTEGER;
  v_user_points INTEGER;
  v_round RECORD;
  v_costs INTEGER[];
BEGIN
  p_user_id := auth.uid();
  IF p_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', '로그인이 필요합니다');
  END IF;

  SELECT * INTO v_round FROM lottery_rounds WHERE id = p_round_id;
  IF NOT FOUND OR v_round.status != 'open' THEN
    RETURN jsonb_build_object('success', false, 'message', '참여할 수 없는 복권입니다');
  END IF;

  SELECT COUNT(*) INTO v_ticket_count
  FROM lottery_tickets
  WHERE round_id = p_round_id AND user_id = p_user_id;

  v_costs := ARRAY[0, 1, 2, 4, 8, 16];
  IF v_ticket_count < 6 THEN
    v_cost := v_costs[v_ticket_count + 1];
  ELSE
    v_cost := (16 * POWER(2, v_ticket_count - 5))::INTEGER;
  END IF;

  IF v_cost > 0 THEN
    SELECT points INTO v_user_points FROM users WHERE id = p_user_id;
    IF v_user_points < v_cost THEN
      RETURN jsonb_build_object('success', false, 'message', '포인트가 부족합니다');
    END IF;
    UPDATE users SET points = points - v_cost WHERE id = p_user_id;
  END IF;

  INSERT INTO lottery_tickets (round_id, user_id, ticket_number, cost_points)
  VALUES (p_round_id, p_user_id, v_ticket_count + 1, v_cost);

  RETURN jsonb_build_object(
    'success', true,
    'ticket_number', v_ticket_count + 1,
    'cost', v_cost
  );
END;
$$;

-- ============================================
-- 복권 회차 오픈 RPC
-- ============================================
CREATE OR REPLACE FUNCTION open_lottery_round()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_config RECORD;
  v_prize_pool_balance INTEGER;
  v_prize_amount INTEGER;
  v_round_id UUID;
  v_today DATE;
BEGIN
  v_today := (NOW() AT TIME ZONE 'Asia/Seoul')::DATE;

  IF EXISTS (SELECT 1 FROM lottery_rounds WHERE round_date = v_today AND status = 'open') THEN
    RETURN jsonb_build_object('success', false, 'message', '오늘 회차가 이미 열려있습니다');
  END IF;

  SELECT * INTO v_config FROM lottery_config WHERE id = 1;
  SELECT balance INTO v_prize_pool_balance FROM prize_pool WHERE id = 1;

  v_prize_amount := FLOOR(v_prize_pool_balance * v_config.prize_percentage::NUMERIC / 100)::INTEGER;

  INSERT INTO lottery_rounds (round_date, prize_amount, mode, distribution, status)
  VALUES (v_today, v_prize_amount, v_config.mode, v_config.distribution, 'open')
  RETURNING id INTO v_round_id;

  RETURN jsonb_build_object('success', true, 'round_id', v_round_id, 'prize_amount', v_prize_amount);
END;
$$;

-- ============================================
-- 복권 추첨 RPC
-- ============================================
CREATE OR REPLACE FUNCTION draw_lottery(p_round_id UUID DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_round_id UUID;
  v_round RECORD;
  v_dist_elem JSONB;
  v_rank INTEGER;
  v_pct INTEGER;
  v_winner_id UUID;
  v_prize_points INTEGER;
  v_total_distributed INTEGER := 0;
  v_dist_count INTEGER;
  v_i INTEGER;
  v_actual_prize INTEGER;
  v_prize_pool_balance INTEGER;
  v_winners_result JSONB;
BEGIN
  IF p_round_id IS NULL THEN
    SELECT id INTO v_round_id FROM lottery_rounds WHERE status = 'open' ORDER BY created_at DESC LIMIT 1;
  ELSE
    v_round_id := p_round_id;
  END IF;

  IF v_round_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', '진행 중인 복권이 없습니다');
  END IF;

  SELECT * INTO v_round FROM lottery_rounds WHERE id = v_round_id;
  IF v_round.status = 'drawn' THEN
    RETURN jsonb_build_object('success', false, 'message', '이미 추첨된 회차입니다');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM lottery_tickets WHERE round_id = v_round_id) THEN
    UPDATE lottery_rounds SET status = 'drawn', drawn_at = NOW() WHERE id = v_round_id;
    RETURN jsonb_build_object('success', true, 'message', '참여자 없음', 'winners', '[]'::jsonb);
  END IF;

  SELECT balance INTO v_prize_pool_balance FROM prize_pool WHERE id = 1;
  v_actual_prize := LEAST(v_round.prize_amount, v_prize_pool_balance);
  v_dist_count := jsonb_array_length(v_round.distribution);

  FOR v_i IN 0..(v_dist_count - 1) LOOP
    v_dist_elem := v_round.distribution->v_i;
    v_rank := (v_dist_elem->>'rank')::INTEGER;
    v_pct := (v_dist_elem->>'percentage')::INTEGER;

    -- 티켓 수 가중치 적용 당첨자 선택 (중복 없음)
    SELECT lt.user_id INTO v_winner_id
    FROM lottery_tickets lt
    WHERE lt.round_id = v_round_id
      AND lt.user_id NOT IN (
        SELECT lw.user_id FROM lottery_winners lw WHERE lw.round_id = v_round_id
      )
    ORDER BY random()
    LIMIT 1;

    EXIT WHEN v_winner_id IS NULL;

    -- 마지막 등수는 나머지 금액 전부
    IF v_i = v_dist_count - 1 THEN
      v_prize_points := v_actual_prize - v_total_distributed;
    ELSE
      v_prize_points := FLOOR(v_actual_prize * v_pct::NUMERIC / 100)::INTEGER;
    END IF;

    v_total_distributed := v_total_distributed + v_prize_points;

    INSERT INTO lottery_winners (round_id, user_id, rank, prize_points)
    VALUES (v_round_id, v_winner_id, v_rank, v_prize_points);

    IF v_prize_points > 0 THEN
      UPDATE users SET points = points + v_prize_points WHERE id = v_winner_id;
    END IF;
  END LOOP;

  UPDATE prize_pool SET balance = GREATEST(0, balance - v_total_distributed), updated_at = NOW() WHERE id = 1;
  UPDATE lottery_rounds SET status = 'drawn', drawn_at = NOW() WHERE id = v_round_id;

  SELECT jsonb_agg(jsonb_build_object(
    'rank', lw.rank,
    'nickname', COALESCE(u.nickname, u.name),
    'prize_points', lw.prize_points
  ) ORDER BY lw.rank)
  INTO v_winners_result
  FROM lottery_winners lw
  JOIN users u ON u.id = lw.user_id
  WHERE lw.round_id = v_round_id;

  RETURN jsonb_build_object(
    'success', true,
    'winners', COALESCE(v_winners_result, '[]'::jsonb),
    'total_distributed', v_total_distributed
  );
END;
$$;
