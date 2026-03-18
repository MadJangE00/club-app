-- users 테이블에 INSERT 정책 추가 (회원가입 시 필요)
CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- users 테이블 SELECT 정책도 수정 (자신의 정보만)
DROP POLICY IF EXISTS "Users can view all users" ON public.users;
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- club_members INSERT 정책 추가
CREATE POLICY "Users can join clubs" ON public.club_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- club_members SELECT 정책
CREATE POLICY "Club members are viewable" ON public.club_members
  FOR SELECT USING (true);

-- events INSERT 정책
CREATE POLICY "Users can create events" ON public.events
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- events SELECT 정책
CREATE POLICY "Events are viewable by everyone" ON public.events
  FOR SELECT USING (true);

-- attendance INSERT 정책
CREATE POLICY "Users can create attendance" ON public.attendance
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- attendance SELECT 정책
CREATE POLICY "Attendance is viewable" ON public.attendance
  FOR SELECT USING (true);

-- clubs INSERT 정책 수정
DROP POLICY IF EXISTS "Club members can create clubs" ON public.clubs;
CREATE POLICY "Users can create clubs" ON public.clubs
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
