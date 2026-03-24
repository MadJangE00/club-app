-- ============================================
-- 포인트 은행 & 상금 시스템
-- ============================================

-- 1. 은행 테이블 (단일 행)
CREATE TABLE IF NOT EXISTS public.point_bank (
  id INTEGER PRIMARY KEY DEFAULT 1,
  balance INTEGER DEFAULT 0,
  last_reset_date DATE DEFAULT CURRENT_DATE,
  CHECK (id = 1)
);

INSERT INTO public.point_bank (id, balance, last_reset_date)
VALUES (1, 0, CURRENT_DATE)
ON CONFLICT (id) DO NOTHING;

-- 2. 상금 테이블 (단일 행)
CREATE TABLE IF NOT EXISTS public.prize_pool (
  id INTEGER PRIMARY KEY DEFAULT 1,
  balance INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CHECK (id = 1)
);

INSERT INTO public.prize_pool (id, balance)
VALUES (1, 0)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- RLS
-- ============================================
ALTER TABLE public.point_bank ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prize_pool ENABLE ROW LEVEL SECURITY;

-- 누구나 조회 가능
CREATE POLICY "point_bank_select" ON public.point_bank FOR SELECT USING (true);
CREATE POLICY "prize_pool_select" ON public.prize_pool FOR SELECT USING (true);

-- ============================================
-- 출석 체크 RPC
-- ============================================
CREATE OR REPLACE FUNCTION daily_checkin(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_today DATE;
  v_bank_balance INTEGER;
  v_already_checked BOOLEAN;
  v_points_earned INTEGER := 10;
BEGIN
  -- 한국 시간 기준 오늘 날짜
  v_today := (NOW() AT TIME ZONE 'Asia/Seoul')::DATE;

  -- 이미 출석했는지 확인
  SELECT EXISTS(
    SELECT 1 FROM daily_attendance
    WHERE user_id = p_user_id AND attended_at = v_today
  ) INTO v_already_checked;

  IF v_already_checked THEN
    RETURN jsonb_build_object('success', false, 'message', '이미 출석했습니다');
  END IF;

  -- 은행 잔액 확인
  SELECT balance INTO v_bank_balance FROM point_bank WHERE id = 1;

  IF v_bank_balance < v_points_earned THEN
    RETURN jsonb_build_object('success', false, 'message', '은행 잔액이 부족합니다');
  END IF;

  -- 출석 기록
  INSERT INTO daily_attendance (user_id, attended_at, points_earned)
  VALUES (p_user_id, v_today, v_points_earned)
  ON CONFLICT (user_id, attended_at) DO NOTHING;

  -- 은행 차감
  UPDATE point_bank SET balance = balance - v_points_earned WHERE id = 1;

  -- 유저 포인트 추가
  UPDATE users SET points = points + v_points_earned WHERE id = p_user_id;

  RETURN jsonb_build_object('success', true, 'points_earned', v_points_earned);
END;
$$;

-- ============================================
-- 자정 리셋 RPC
-- ============================================
CREATE OR REPLACE FUNCTION midnight_reset()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_bank_balance INTEGER;
  v_member_count INTEGER;
  v_new_bank INTEGER;
BEGIN
  -- 현재 은행 잔액 (미출석자 몫) → 상금으로 이동
  SELECT balance INTO v_bank_balance FROM point_bank WHERE id = 1;

  UPDATE prize_pool
  SET balance = balance + v_bank_balance,
      updated_at = NOW()
  WHERE id = 1;

  -- 전체 회원 수
  SELECT COUNT(*) INTO v_member_count FROM users;

  -- 은행 리셋: 전체 회원 수 × 10
  v_new_bank := v_member_count * 10;

  UPDATE point_bank
  SET balance = v_new_bank,
      last_reset_date = (NOW() AT TIME ZONE 'Asia/Seoul')::DATE
  WHERE id = 1;

  RETURN jsonb_build_object(
    'success', true,
    'transferred_to_prize', v_bank_balance,
    'new_bank_balance', v_new_bank,
    'member_count', v_member_count
  );
END;
$$;
