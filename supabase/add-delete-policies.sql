-- 동호회 삭제 정책 (소유자만 삭제 가능)
CREATE POLICY "Club owners can delete clubs" ON public.clubs
  FOR DELETE USING (auth.uid() = owner_id);

-- 모임 삭제 정책 (주최자만 삭제 가능)
CREATE POLICY "Event creators can delete events" ON public.events
  FOR DELETE USING (auth.uid() = created_by);

-- 게시글 삭제 정책 (작성자만 삭제 가능)
CREATE POLICY "Users can delete own posts" ON public.posts
  FOR DELETE USING (auth.uid() = user_id);

-- 모임 수정 정책 (주최자만 수정 가능)
CREATE POLICY "Event creators can update events" ON public.events
  FOR UPDATE USING (auth.uid() = created_by);
