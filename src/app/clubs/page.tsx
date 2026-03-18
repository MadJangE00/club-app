import { supabase } from "@/lib/supabase";
import Link from "next/link";

async function getClubs() {
  const { data } = await supabase
    .from("clubs")
    .select("*")
    .order("created_at", { ascending: false });
  return data || [];
}

export default async function ClubsPage() {
  const clubs = await getClubs();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">🏠 동호회 목록</h2>
        <Link
          href="/clubs/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
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
                <p className="text-gray-600 text-sm line-clamp-2">
                  {club.description}
                </p>
              )}
              <div className="mt-4 text-xs text-gray-400">
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
