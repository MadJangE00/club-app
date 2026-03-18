-- 포인트 필드 추가
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0;

-- 포인트 인덱스
CREATE INDEX IF NOT EXISTS idx_users_points ON public.users(points DESC);
