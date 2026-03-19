import { supabase } from "@/lib/supabase";
import Link from "next/link";

// ISR: 60초마다 재생성 (캐싱)
export const revalidate = 60;

async function getClubs() {
  const { data } = await supabase
    .from("clubs")
    .select("*")
    .order("created_at", { ascending: false });
  return (data || []) as any[];
}

async function getMemberCounts(clubIds: string[]) {
  if (clubIds.length === 0) return {};
  
  const { data } = await supabase
    .from("club_members")
    .select("club_id")
    .in("club_id", clubIds);

  const counts: Record<string, number> = {};
  data?.forEach((m: any) => {
    counts[m.club_id] = (counts[m.club_id] || 0) + 1;
  });
  
  return counts;
}

async function getEventCounts(clubIds: string[]) {
  if (clubIds.length === 0) return {};
  
  const { data } = await supabase
    .from("events")
    .select("club_id")
    .in("club_id", clubIds);

  const counts: Record<string, number> = {};
  data?.forEach((e: any) => {
    counts[e.club_id] = (counts[e.club_id] || 0) + 1;
  });
  
  return counts;
}

export default async function ClubsPage() {
  const clubs = await getClubs();
  const clubIds = clubs.map((c) => c.id);
  const [memberCounts, eventCounts] = await Promise.all([
    getMemberCounts(clubIds),
    getEventCounts(clubIds),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">🏠 동호회 목록</h2>
        <Link
          href="/clubs/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          + 새 동호회
        </Link>
      </div>

      {clubs.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clubs.map((club) => (
            <Link
              key={club.id}
              href={`/clubs/${club.id}`}
              className="block bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
            >
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                {club.name}
              </h3>
              {club.description && (
                <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                  {club.description}
                </p>
              )}
              <div className="flex items-center gap-4 text-sm">
                <span className="text-blue-600 font-medium">
                  👥 {memberCounts[club.id] || 0}명
                </span>
                <span className="text-green-600 font-medium">
                  📅 {eventCounts[club.id] || 0}개 모임
                </span>
              </div>
              <div className="mt-3 text-xs text-gray-400">
                생성일: {new Date(club.created_at).toLocaleDateString("ko-KR")}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="text-4xl mb-4">🎯</div>
          <p className="text-gray-600 mb-4">아직 동호회가 없습니다</p>
          <Link
            href="/clubs/new"
            className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            첫 번째 동호회 만들기
          </Link>
        </div>
      )}
    </div>
  );
}
