-- 게시글 작성 포인트 차감 (3P)
CREATE OR REPLACE FUNCTION deduct_post_points()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  p_user_id UUID := auth.uid();
  v_points INTEGER;
  v_cost INTEGER := 3;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', '로그인이 필요합니다');
  END IF;

  SELECT points INTO v_points FROM users WHERE id = p_user_id;

  IF v_points < v_cost THEN
    RETURN jsonb_build_object('success', false, 'message', '포인트가 부족합니다 (3P 필요)');
  END IF;

  UPDATE users SET points = points - v_cost WHERE id = p_user_id;

  RETURN jsonb_build_object('success', true, 'deducted', v_cost);
END;
$$;

-- 댓글 작성 포인트 차감 (1P, 자신의 게시글 제외)
CREATE OR REPLACE FUNCTION deduct_comment_points(p_post_author_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  p_user_id UUID := auth.uid();
  v_points INTEGER;
  v_cost INTEGER := 1;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', '로그인이 필요합니다');
  END IF;

  -- 자신의 게시글이면 무료
  IF p_user_id = p_post_author_id THEN
    RETURN jsonb_build_object('success', true, 'deducted', 0, 'free', true);
  END IF;

  SELECT points INTO v_points FROM users WHERE id = p_user_id;

  IF v_points < v_cost THEN
    RETURN jsonb_build_object('success', false, 'message', '포인트가 부족합니다 (1P 필요)');
  END IF;

  UPDATE users SET points = points - v_cost WHERE id = p_user_id;

  RETURN jsonb_build_object('success', true, 'deducted', v_cost);
END;
$$;
