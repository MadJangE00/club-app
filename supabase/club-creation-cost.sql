-- 동호회 개설 비용 설정 컬럼 추가
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS club_creation_cost INTEGER DEFAULT 30;

-- ============================================
-- 동호회 개설 포인트 차감 → 관리자에게 지급
-- ============================================
CREATE OR REPLACE FUNCTION pay_club_creation_cost()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  p_user_id UUID := auth.uid();
  v_cost INTEGER;
  v_user_points INTEGER;
  v_admin_id UUID;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', '로그인이 필요합니다');
  END IF;

  -- 현재 개설 비용 조회
  SELECT club_creation_cost INTO v_cost FROM site_settings WHERE id = 1;
  v_cost := COALESCE(v_cost, 30);

  -- 비용이 0이면 무료
  IF v_cost <= 0 THEN
    RETURN jsonb_build_object('success', true, 'deducted', 0);
  END IF;

  -- 유저 포인트 확인
  SELECT points INTO v_user_points FROM users WHERE id = p_user_id;

  IF v_user_points < v_cost THEN
    RETURN jsonb_build_object('success', false, 'message', format('포인트가 부족합니다 (%sP 필요)', v_cost));
  END IF;

  -- 관리자 찾기
  SELECT id INTO v_admin_id FROM users WHERE role = 'admin' LIMIT 1;

  -- 유저 포인트 차감
  UPDATE users SET points = points - v_cost WHERE id = p_user_id;

  -- 관리자 포인트 지급 (관리자가 있는 경우)
  IF v_admin_id IS NOT NULL THEN
    UPDATE users SET points = points + v_cost WHERE id = v_admin_id;
  END IF;

  RETURN jsonb_build_object('success', true, 'deducted', v_cost);
END;
$$;
