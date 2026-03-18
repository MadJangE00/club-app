-- users 테이블 SELECT 정책 수정 (모두가 이름/닉네임 볼 수 있게)
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Users can view profiles" ON public.users
  FOR SELECT USING (true);

-- posts 테이블도 users 정보를 JOIN 할 수 있게
DROP POLICY IF EXISTS "Posts are viewable by everyone" ON public.posts;
CREATE POLICY "Posts are viewable by everyone" ON public.posts
  FOR SELECT USING (true);
