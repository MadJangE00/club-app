import { supabase } from "@/lib/supabase";
import { notFound } from "next/navigation";
import JoinButton from "./JoinButton";
import ClubActions from "./ClubActions";
import Calendar from "./Calendar";
import Link from "next/link";

// ISR: 30초마다 재생성
export const revalidate = 30;

async function getClub(id: string) {
  const { data, error } = await supabase
    .from("clubs")
    .select(`
      *,
      users:owner_id (name, nickname)
    `)
    .eq("id", id)
    .single();
  
  return data as any;
}

async function getMembers(clubId: string) {
  const { data } = await supabase
    .from("club_members")
    .select(`
      id,
      role,
      joined_at,
      users (name, nickname)
    `)
    .eq("club_id", clubId)
    .order("joined_at", { ascending: true });
  
  return (data || []) as any[];
}

async function getEvents(clubId: string) {
  const { data } = await supabase
    .from("events")
    .select("*")
    .eq("club_id", clubId)
    .order("event_date", { ascending: true });
  
  return (data || []) as any[];
}

async function getPosts(clubId: string) {
  const { data } = await supabase
    .from("posts")
    .select(`
      id,
      title,
      content,
      created_at,
      users (name, nickname)
    `)
    .eq("club_id", clubId)
    .order("created_at", { ascending: false })
    .limit(5);
  
  return (data || []) as any[];
}

export default async function ClubDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params;
  const club = await getClub(id);
  
  if (!club) {
    notFound();
  }

  const [members, events, posts] = await Promise.all([
    getMembers(id),
    getEvents(id),
    getPosts(id),
  ]);

  return (
    <div className="space-y-6">
      {/* 동호회 헤더 */}
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">{club.name}</h2>
            {club.description && (
              <p className="text-gray-700 mt-2 text-lg">{club.description}</p>
            )}
            <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
              <span>
                👑 회장: <span className="font-medium text-gray-900">
                  {club.users?.nickname || club.users?.name || "알 수 없음"}
                </span>
              </span>
              <span>|</span>
              <span>생성일: {new Date(club.created_at).toLocaleDateString("ko-KR")}</span>
            </div>
          </div>
          <div className="flex gap-2 items-center">
            <JoinButton clubId={id} />
            <ClubActions clubId={id} ownerId={club.owner_id} />
          </div>
        </div>
      </div>

      {/* 통계 */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <div className="text-3xl font-bold text-blue-600">{members.length}</div>
          <div className="text-gray-700 font-medium mt-1">멤버</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <div className="text-3xl font-bold text-green-600">{events.length}</div>
          <div className="text-gray-700 font-medium mt-1">모임</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <div className="text-3xl font-bold text-purple-600">{posts.length}</div>
          <div className="text-gray-700 font-medium mt-1">게시글</div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* 멤버 목록 */}
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">👥 멤버 ({members.length})</h3>
          {members.length > 0 ? (
            <div className="space-y-2">
              {members.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium text-gray-900">
                    {member.users?.nickname || member.users?.name || "사용자"}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    member.role === "owner" 
                      ? "bg-yellow-100 text-yellow-800" 
                      : member.role === "admin" 
                      ? "bg-blue-100 text-blue-800" 
                      : "bg-gray-200 text-gray-600"
                  }`}>
                    {member.role === "owner" ? "👑 소유자" : member.role === "admin" ? "⭐ 관리자" : "멤버"}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">아직 멤버가 없습니다</p>
          )}
        </div>

        {/* 게시글 */}
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-900">📝 게시글</h3>
            <Link
              href={`/posts/new?club=${id}`}
              className="text-sm text-blue-600 hover:underline"
            >
              + 새 게시글
            </Link>
          </div>
          {posts.length > 0 ? (
            <div className="divide-y">
              {posts.map((post) => (
                <Link
                  key={post.id}
                  href={`/posts/${post.id}`}
                  className="block py-4 hover:bg-gray-50 -mx-6 px-6"
                >
                  <div className="font-medium text-gray-900">{post.title}</div>
                  <div className="flex justify-between mt-1 text-sm text-gray-500">
                    <span>{post.users?.nickname || post.users?.name || "사용자"}</span>
                    <span>{new Date(post.created_at).toLocaleDateString("ko-KR")}</span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">아직 게시글이 없습니다</p>
          )}
        </div>
      </div>

      {/* 캘린더 */}
      <Calendar events={events} clubId={id} />
    </div>
  );
}
