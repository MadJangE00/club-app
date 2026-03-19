import { supabase } from "@/lib/supabase";
import ClubDeleteButton from "./ClubDeleteButton";

// 캐싱 비활성화
export const dynamic = "force-dynamic";
export const revalidate = 0;

async function getClubs() {
  const { data } = await supabase
    .from("clubs")
    .select(`
      id,
      name,
      description,
      created_at,
      users:owner_id (name, nickname, email)
    `)
    .order("created_at", { ascending: false });
  return data || [];
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

async function getPostCounts(clubIds: string[]) {
  if (clubIds.length === 0) return {};
  
  const { data } = await supabase
    .from("posts")
    .select("club_id")
    .in("club_id", clubIds);

  const counts: Record<string, number> = {};
  data?.forEach((p: any) => {
    counts[p.club_id] = (counts[p.club_id] || 0) + 1;
  });
  
  return counts;
}

export default async function AdminClubsPage() {
  const clubs = await getClubs();
  const clubIds = clubs.map((c: any) => c.id);
  const [memberCounts, eventCounts, postCounts] = await Promise.all([
    getMemberCounts(clubIds),
    getEventCounts(clubIds),
    getPostCounts(clubIds),
  ]);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">🏠 동호회 관리</h2>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left py-3 px-4 font-semibold">동호회명</th>
              <th className="text-left py-3 px-4 font-semibold">설명</th>
              <th className="text-left py-3 px-4 font-semibold">소유자</th>
              <th className="text-center py-3 px-4 font-semibold">멤버</th>
              <th className="text-center py-3 px-4 font-semibold">모임</th>
              <th className="text-center py-3 px-4 font-semibold">게시글</th>
              <th className="text-left py-3 px-4 font-semibold">생성일</th>
              <th className="text-left py-3 px-4 font-semibold">관리</th>
            </tr>
          </thead>
          <tbody>
            {clubs.map((club: any) => (
              <tr key={club.id} className="border-b hover:bg-gray-50">
                <td className="py-3 px-4 font-medium">{club.name}</td>
                <td className="py-3 px-4 text-gray-600 max-w-xs truncate">
                  {club.description || "-"}
                </td>
                <td className="py-3 px-4 text-gray-600">
                  {club.users?.nickname || club.users?.name}
                  <br />
                  <span className="text-xs text-gray-400">{club.users?.email}</span>
                </td>
                <td className="py-3 px-4 text-center">
                  <span className="text-blue-600 font-medium">{memberCounts[club.id] || 0}</span>
                </td>
                <td className="py-3 px-4 text-center">
                  <span className="text-green-600 font-medium">{eventCounts[club.id] || 0}</span>
                </td>
                <td className="py-3 px-4 text-center">
                  <span className="text-purple-600 font-medium">{postCounts[club.id] || 0}</span>
                </td>
                <td className="py-3 px-4 text-gray-500">
                  {new Date(club.created_at).toLocaleDateString("ko-KR")}
                </td>
                <td className="py-3 px-4">
                  <ClubDeleteButton clubId={club.id} clubName={club.name} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
