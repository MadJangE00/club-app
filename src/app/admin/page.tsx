import { supabase } from "@/lib/supabase";
import { redirect } from "next/navigation";
import Link from "next/link";

// 캐싱 비활성화
export const dynamic = "force-dynamic";
export const revalidate = 0;

async function checkAdmin(userId: string) {
  const { data } = await supabase
    .from("users")
    .select("role")
    .eq("id", userId)
    .single();
  return data?.role === "admin";
}

async function getStats() {
  const [users, clubs, events, posts, photos] = await Promise.all([
    supabase.from("users").select("id", { count: "exact", head: true }),
    supabase.from("clubs").select("id", { count: "exact", head: true }),
    supabase.from("events").select("id", { count: "exact", head: true }),
    supabase.from("posts").select("id", { count: "exact", head: true }),
    supabase.from("photo_posts").select("id", { count: "exact", head: true }),
  ]);

  return {
    users: users.count || 0,
    clubs: clubs.count || 0,
    events: events.count || 0,
    posts: posts.count || 0,
    photos: photos.count || 0,
  };
}

async function getUsers() {
  const { data } = await supabase
    .from("users")
    .select("id, email, name, nickname, role, created_at")
    .order("created_at", { ascending: false })
    .limit(20);
  return data || [];
}

async function getRecentClubs() {
  const { data } = await supabase
    .from("clubs")
    .select("id, name, created_at, users(name, nickname)")
    .order("created_at", { ascending: false })
    .limit(10);
  return data || [];
}

export default async function AdminPage() {
  // 서버 컴포넌트에서는 세션 확인을 클라이언트에서 해야 함
  // 여기서는 데이터만 가져오고, 클라이언트에서 권한 체크

  const stats = await getStats();
  const users = await getUsers();
  const clubs = await getRecentClubs();

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">🔧 관리자 페이지</h1>
        <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-bold">
          ADMIN
        </span>
      </div>

      {/* 통계 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <div className="text-3xl font-bold text-blue-600">{stats.users}</div>
          <div className="text-gray-700 font-medium mt-1">사용자</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <div className="text-3xl font-bold text-green-600">{stats.clubs}</div>
          <div className="text-gray-700 font-medium mt-1">동호회</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <div className="text-3xl font-bold text-purple-600">{stats.events}</div>
          <div className="text-gray-700 font-medium mt-1">모임</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <div className="text-3xl font-bold text-orange-600">{stats.posts}</div>
          <div className="text-gray-700 font-medium mt-1">게시글</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <div className="text-3xl font-bold text-pink-600">{stats.photos}</div>
          <div className="text-gray-700 font-medium mt-1">사진</div>
        </div>
      </div>

      {/* 빠른 관리 */}
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">⚡ 빠른 관리</h2>
        <div className="grid md:grid-cols-4 gap-4">
          <Link
            href="/admin/users"
            className="p-4 border-2 border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors text-center"
          >
            <div className="text-2xl mb-2">👥</div>
            <div className="font-bold text-gray-800">사용자 관리</div>
          </Link>
          <Link
            href="/admin/clubs"
            className="p-4 border-2 border-gray-300 rounded-lg hover:border-green-400 hover:bg-green-50 transition-colors text-center"
          >
            <div className="text-2xl mb-2">🏠</div>
            <div className="font-bold text-gray-800">동호회 관리</div>
          </Link>
          <Link
            href="/admin/posts"
            className="p-4 border-2 border-gray-300 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-colors text-center"
          >
            <div className="text-2xl mb-2">📝</div>
            <div className="font-bold text-gray-800">게시글 관리</div>
          </Link>
          <Link
            href="/admin/photos"
            className="p-4 border-2 border-gray-300 rounded-lg hover:border-pink-400 hover:bg-pink-50 transition-colors text-center"
          >
            <div className="text-2xl mb-2">📷</div>
            <div className="font-bold text-gray-800">사진 관리</div>
          </Link>
        </div>
      </div>

      {/* 최근 사용자 */}
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">👥 최근 가입 사용자</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 font-semibold">이름</th>
                <th className="text-left py-3 px-4 font-semibold">이메일</th>
                <th className="text-left py-3 px-4 font-semibold">권한</th>
                <th className="text-left py-3 px-4 font-semibold">가입일</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user: any) => (
                <tr key={user.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4">{user.nickname || user.name}</td>
                  <td className="py-3 px-4 text-gray-600">{user.email}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      user.role === "admin" 
                        ? "bg-red-100 text-red-700" 
                        : "bg-gray-100 text-gray-700"
                    }`}>
                      {user.role === "admin" ? "관리자" : "회원"}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-500">
                    {new Date(user.created_at).toLocaleDateString("ko-KR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 최근 동호회 */}
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">🏠 최근 생성 동호회</h2>
        <div className="space-y-2">
          {clubs.map((club: any) => (
            <div key={club.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <div>
                <span className="font-medium text-gray-900">{club.name}</span>
                <span className="text-gray-500 text-sm ml-2">
                  by {club.users?.nickname || club.users?.name}
                </span>
              </div>
              <span className="text-gray-500 text-sm">
                {new Date(club.created_at).toLocaleDateString("ko-KR")}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
