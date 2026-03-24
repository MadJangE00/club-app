-- ============================================
-- 전체 게시판 (board_posts)
-- ============================================
CREATE TABLE IF NOT EXISTS public.board_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL DEFAULT '자유',
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_board_posts_category ON public.board_posts(category);
CREATE INDEX IF NOT EXISTS idx_board_posts_created ON public.board_posts(created_at DESC);

ALTER TABLE public.board_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "board_posts_select" ON public.board_posts FOR SELECT USING (true);
CREATE POLICY "board_posts_insert" ON public.board_posts FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "board_posts_update" ON public.board_posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "board_posts_delete" ON public.board_posts FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_board_posts_updated_at
  BEFORE UPDATE ON public.board_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
