-- ============================================
-- 동호회 가입 포인트 (3P: 회장 1P + 관리자 1P + 상금 1P)
-- ============================================
CREATE OR REPLACE FUNCTION pay_club_join(p_club_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  p_user_id UUID := auth.uid();
  v_user_points INTEGER;
  v_owner_id UUID;
  v_admin_id UUID;
  v_cost INTEGER := 3;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', '로그인이 필요합니다');
  END IF;

  -- 유저 포인트 확인
  SELECT points INTO v_user_points FROM users WHERE id = p_user_id;

  IF v_user_points < v_cost THEN
    RETURN jsonb_build_object('success', false, 'message', '포인트가 부족합니다 (3P 필요)');
  END IF;

  -- 동호회 회장 조회
  SELECT owner_id INTO v_owner_id FROM clubs WHERE id = p_club_id;

  -- 관리자 조회
  SELECT id INTO v_admin_id FROM users WHERE role = 'admin' LIMIT 1;

  -- 유저 포인트 차감
  UPDATE users SET points = points - v_cost WHERE id = p_user_id;

  -- 회장에게 1P 지급 (자기 자신 제외)
  IF v_owner_id IS NOT NULL AND v_owner_id != p_user_id THEN
    UPDATE users SET points = points + 1 WHERE id = v_owner_id;
  END IF;

  -- 관리자에게 1P 지급 (자기 자신 제외)
  IF v_admin_id IS NOT NULL AND v_admin_id != p_user_id THEN
    UPDATE users SET points = points + 1 WHERE id = v_admin_id;
  END IF;

  -- 상금풀에 1P 추가
  UPDATE prize_pool SET balance = balance + 1 WHERE id = 1;

  RETURN jsonb_build_object('success', true, 'deducted', v_cost);
END;
$$;

-- ============================================
-- 동호회 탈퇴 환급 (회장에게서 1P 돌려받음)
-- ============================================
CREATE OR REPLACE FUNCTION refund_club_leave(p_club_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  p_user_id UUID := auth.uid();
  v_owner_id UUID;
  v_owner_points INTEGER;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', '로그인이 필요합니다');
  END IF;

  -- 현재 동호회 회장 조회
  SELECT owner_id INTO v_owner_id FROM clubs WHERE id = p_club_id;

  -- 회장이 자기 자신이면 환급 없음
  IF v_owner_id IS NULL OR v_owner_id = p_user_id THEN
    RETURN jsonb_build_object('success', true, 'refunded', 0);
  END IF;

  -- 회장 포인트 확인
  SELECT points INTO v_owner_points FROM users WHERE id = v_owner_id;

  -- 회장에게 포인트가 있으면 차감
  IF v_owner_points >= 1 THEN
    UPDATE users SET points = points - 1 WHERE id = v_owner_id;
    UPDATE users SET points = points + 1 WHERE id = p_user_id;
    RETURN jsonb_build_object('success', true, 'refunded', 1);
  END IF;

  -- 회장 포인트 부족해도 탈퇴는 허용 (환급만 안 됨)
  RETURN jsonb_build_object('success', true, 'refunded', 0, 'note', '회장 포인트 부족으로 환급 불가');
END;
$$;
