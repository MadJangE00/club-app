import { supabase } from "@/lib/supabase";
import DailyAttendance from "@/components/DailyAttendance";

// ISR: 60초마다 재생성 (캐싱)
export const revalidate = 60;

async function getStats() {
  try {
    const [usersCount, clubsCount, eventsCount, postsCount] = await Promise.all([
      supabase.from("users").select("id", { count: "exact", head: true }),
      supabase.from("clubs").select("id", { count: "exact", head: true }),
      supabase.from("events").select("id", { count: "exact", head: true }),
      supabase.from("posts").select("id", { count: "exact", head: true }),
    ]);

    return {
      users: usersCount.count || 0,
      clubs: clubsCount.count || 0,
      events: eventsCount.count || 0,
      posts: postsCount.count || 0,
    };
  } catch (error) {
    console.error("Stats fetch error:", error);
    return { users: 0, clubs: 0, events: 0, posts: 0 };
  }
}

async function getPointRanking() {
  try {
    const { data } = await supabase
      .from("users")
      .select("id, name, nickname, points")
      .neq("role", "admin")
      .order("points", { ascending: false })
      .limit(5);
    return (data || []) as any[];
  } catch (error) {
    console.error("Ranking fetch error:", error);
    return [];
  }
}

async function getRecentClubs() {
  try {
    const { data } = await supabase
      .from("clubs")
      .select("id, name, description, created_at")
      .order("created_at", { ascending: false })
      .limit(5);
    return (data || []) as any[];
  } catch (error) {
    console.error("Clubs fetch error:", error);
    return [];
  }
}

export default async function Home() {
  const stats = await getStats();
  const ranking = await getPointRanking();
  const recentClubs = await getRecentClubs();

  return (
    <div className="space-y-8">
      {/* 헤더 */}
      <div className="text-center py-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          환영합니다! 👋
        </h2>
        <p className="text-gray-700 text-lg">
          동호회를 만들고, 모임을 열고, 함께 성장하세요
        </p>
      </div>

      {/* 출석 체크 */}
      <DailyAttendance />

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <div className="text-3xl font-bold text-blue-600">{stats.users}</div>
          <div className="text-gray-800 font-medium mt-1">사용자</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <div className="text-3xl font-bold text-green-600">{stats.clubs}</div>
          <div className="text-gray-800 font-medium mt-1">동호회</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <div className="text-3xl font-bold text-purple-600">{stats.events}</div>
          <div className="text-gray-800 font-medium mt-1">모임</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <div className="text-3xl font-bold text-orange-600">{stats.posts}</div>
          <div className="text-gray-800 font-medium mt-1">게시글</div>
        </div>
      </div>

      {/* 포인트 랭킹 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">🏆 포인트 랭킹 TOP 5</h3>
        {ranking.length > 0 ? (
          <div className="space-y-3">
            {ranking.map((user: any, index: number) => {
              const medals = ["🥇", "🥈", "🥉"];
              const medal = medals[index] || `${index + 1}`;
              return (
                <div
                  key={user.id}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    index === 0
                      ? "bg-yellow-50 border border-yellow-200"
                      : index === 1
                      ? "bg-gray-50 border border-gray-200"
                      : index === 2
                      ? "bg-orange-50 border border-orange-200"
                      : "bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl w-8 text-center">{medal}</span>
                    <span className="font-semibold text-gray-900">{user.nickname || user.name || "익명"}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6 text-gray-600">
            아직 랭킹 데이터가 없습니다.
          </div>
        )}
      </div>

      {/* 빠른 시작 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">🚀 빠른 시작</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <a
            href="/clubs/new"
            className="block p-4 border-2 border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors text-center"
          >
            <div className="text-2xl mb-2">➕</div>
            <div className="font-bold text-gray-800">새 동호회 만들기</div>
          </a>
          <a
            href="/events/new"
            className="block p-4 border-2 border-gray-300 rounded-lg hover:border-green-400 hover:bg-green-50 transition-colors text-center"
          >
            <div className="text-2xl mb-2">📅</div>
            <div className="font-bold text-gray-800">모임 개설하기</div>
          </a>
          <a
            href="/posts/new"
            className="block p-4 border-2 border-gray-300 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-colors text-center"
          >
            <div className="text-2xl mb-2">✏️</div>
            <div className="font-bold text-gray-800">게시글 작성하기</div>
          </a>
        </div>
      </div>

      {/* 최근 동호회 */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-900">🏠 최근 동호회</h3>
          <a href="/clubs" className="text-blue-600 font-medium text-sm hover:underline">
            전체보기 →
          </a>
        </div>
        {recentClubs.length > 0 ? (
          <div className="space-y-3">
            {recentClubs.map((club) => (
              <a
                key={club.id}
                href={`/clubs/${club.id}`}
                className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="font-bold text-gray-900">{club.name}</div>
                {club.description && (
                  <div className="text-gray-700 mt-1">
                    {club.description}
                  </div>
                )}
              </a>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-600">
            아직 동호회가 없습니다. 첫 번째 동호회를 만들어보세요!
          </div>
        )}
      </div>
    </div>
  );
}
