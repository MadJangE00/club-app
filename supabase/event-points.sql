-- 동호회 포인트 바구니
ALTER TABLE public.clubs ADD COLUMN IF NOT EXISTS point_basket INTEGER DEFAULT 0;

-- 모임 포인트 바구니
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS point_basket INTEGER DEFAULT 0;
-- 모임 최종 포인트 (이전 후 기록용)
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS final_point_basket INTEGER DEFAULT NULL;

-- 참여 포인트 납부 여부 추적
ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS points_paid BOOLEAN DEFAULT FALSE;

-- ============================================
-- 모임 개설 포인트 차감 (5P → 동호회 바구니)
-- ============================================
CREATE OR REPLACE FUNCTION pay_event_creation(p_club_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  p_user_id UUID := auth.uid();
  v_points INTEGER;
  v_cost INTEGER := 5;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', '로그인이 필요합니다');
  END IF;

  SELECT points INTO v_points FROM users WHERE id = p_user_id;

  IF v_points < v_cost THEN
    RETURN jsonb_build_object('success', false, 'message', '포인트가 부족합니다 (5P 필요)');
  END IF;

  UPDATE users SET points = points - v_cost WHERE id = p_user_id;
  UPDATE clubs SET point_basket = point_basket + v_cost WHERE id = p_club_id;

  RETURN jsonb_build_object('success', true, 'deducted', v_cost);
END;
$$;

-- ============================================
-- 모임 참여 포인트 차감 (3P → 모임 바구니)
-- ============================================
CREATE OR REPLACE FUNCTION pay_event_attendance(p_event_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  p_user_id UUID := auth.uid();
  v_points INTEGER;
  v_cost INTEGER := 3;
  v_already_paid BOOLEAN;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', '로그인이 필요합니다');
  END IF;

  -- 이미 납부했는지 확인
  SELECT COALESCE(points_paid, FALSE) INTO v_already_paid
  FROM attendance
  WHERE event_id = p_event_id AND user_id = p_user_id;

  IF v_already_paid THEN
    RETURN jsonb_build_object('success', true, 'deducted', 0, 'already_paid', true);
  END IF;

  SELECT points INTO v_points FROM users WHERE id = p_user_id;

  IF v_points < v_cost THEN
    RETURN jsonb_build_object('success', false, 'message', '포인트가 부족합니다 (3P 필요)');
  END IF;

  UPDATE users SET points = points - v_cost WHERE id = p_user_id;
  UPDATE events SET point_basket = point_basket + v_cost WHERE id = p_event_id;
  UPDATE attendance SET points_paid = TRUE
    WHERE event_id = p_event_id AND user_id = p_user_id;

  RETURN jsonb_build_object('success', true, 'deducted', v_cost);
END;
$$;

-- ============================================
-- 완료된 모임 포인트 → 동호회 바구니 이전
-- (자정 크론에서 호출)
-- ============================================
CREATE OR REPLACE FUNCTION transfer_completed_event_points()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_transferred INTEGER := 0;
BEGIN
  -- point_basket > 0 이고 날짜가 지난 모임만 처리
  UPDATE clubs c
  SET point_basket = c.point_basket + e.point_basket
  FROM events e
  WHERE e.club_id = c.id
    AND e.event_date < NOW()
    AND e.point_basket > 0;

  GET DIAGNOSTICS v_transferred = ROW_COUNT;

  -- 이전 완료된 모임 바구니 초기화 (최종값 기록 후 0으로)
  UPDATE events
  SET final_point_basket = point_basket,
      point_basket = 0
  WHERE event_date < NOW()
    AND point_basket > 0;

  RETURN jsonb_build_object('success', true, 'transferred_events', v_transferred);
END;
$$;
