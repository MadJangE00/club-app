-- attendance 테이블 RLS 정책
CREATE POLICY "Users can create attendance" ON public.attendance
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own attendance" ON public.attendance
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Attendance is viewable" ON public.attendance
  FOR SELECT USING (true);

-- club_members DELETE 정책 (탈퇴용)
CREATE POLICY "Users can leave clubs" ON public.club_members
  FOR DELETE USING (auth.uid() = user_id);
