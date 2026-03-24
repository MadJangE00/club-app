import { supabase } from "@/lib/supabase";
import Link from "next/link";

// ISR: 60초마다 재생성 (캐싱)
export const revalidate = 60;

async function getPhotos() {
  // 모든 동호회의 사진을 가져오고, 투표 수도 함께 조회
  const { data } = await supabase
    .from("photo_posts")
    .select(`
      id,
      title,
      image_url,
      created_at,
      club_id,
      price,
      clubs (
        id,
        name
      ),
      users (
        name,
        nickname
      )
    `)
    .order("created_at", { ascending: false });

  return (data || []) as any[];
}

async function getVoteCounts(photoIds: string[]) {
  if (photoIds.length === 0) return {};

  const { data } = await supabase
    .from("photo_votes")
    .select("photo_id")
    .in("photo_id", photoIds);

  const counts: Record<string, number> = {};
  data?.forEach((v: any) => {
    counts[v.photo_id] = (counts[v.photo_id] || 0) + 1;
  });

  return counts;
}

export default async function PhotosPage() {
  const photos = await getPhotos();
  const photoIds = photos.map((p) => p.id);
  const voteCounts = await getVoteCounts(photoIds);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">📷 사진 게시판</h2>
        <Link
          href="/photos/new"
          className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors text-sm font-medium"
        >
          + 사진 올리기
        </Link>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-blue-800 text-sm">
        💡 가입한 동호회의 사진만 볼 수 있습니다
      </div>

      {photos.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {photos.map((photo) => {
            const hasPrice = photo.price != null && photo.price > 0;
            return (
              <Link
                key={photo.id}
                href={`/photos/${photo.id}`}
                className="bg-white rounded-xl shadow overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="aspect-square relative bg-gray-100">
                  <img
                    src={photo.image_url}
                    alt={photo.title}
                    className="w-full h-full object-cover"
                  />
                  {hasPrice && (
                    <div className="absolute top-2 right-2 px-2 py-1 bg-pink-600 text-white text-xs font-bold rounded-full shadow">
                      🛒 {photo.price}P
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-gray-900 truncate">{photo.title}</h3>
                  <div className="flex justify-between items-center mt-2 text-sm">
                    <span className="text-pink-600 font-medium">
                      {photo.clubs?.name}
                    </span>
                    {hasPrice ? (
                      <span className="text-pink-600 font-semibold text-xs">
                        🛒 {photo.price}P
                      </span>
                    ) : (
                      <span className="text-gray-500">
                        👍 {voteCounts[photo.id] || 0}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow p-12 text-center">
          <div className="text-5xl mb-4">📷</div>
          <p className="text-gray-600 mb-4">아직 사진이 없습니다</p>
          <Link
            href="/photos/new"
            className="inline-block px-6 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors font-medium"
          >
            첫 번째 사진 올리기
          </Link>
        </div>
      )}
    </div>
  );
}
