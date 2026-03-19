import { supabase } from "@/lib/supabase";
import PhotoDeleteButton from "./PhotoDeleteButton";

// 캐싱 비활성화
export const dynamic = "force-dynamic";
export const revalidate = 0;

async function getPhotos() {
  const { data } = await supabase
    .from("photo_posts")
    .select(`
      id,
      title,
      image_url,
      created_at,
      users (name, nickname, email),
      clubs (name)
    `)
    .order("created_at", { ascending: false });
  return data || [];
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

export default async function AdminPhotosPage() {
  const photos = await getPhotos();
  const photoIds = photos.map((p: any) => p.id);
  const voteCounts = await getVoteCounts(photoIds);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">📷 사진 관리</h2>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {photos.map((photo: any) => (
          <div key={photo.id} className="bg-white rounded-xl shadow overflow-hidden">
            <div className="aspect-video relative bg-gray-100">
              <img
                src={photo.image_url}
                alt={photo.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-4">
              <div className="font-medium truncate">{photo.title}</div>
              <div className="text-sm text-gray-600 mt-1">
                {photo.clubs?.name || "-"}
              </div>
              <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                <span>{photo.users?.nickname || photo.users?.name}</span>
                <span>👍 {voteCounts[photo.id] || 0}</span>
              </div>
              <div className="mt-3 flex justify-between items-center">
                <span className="text-xs text-gray-400">
                  {new Date(photo.created_at).toLocaleDateString("ko-KR")}
                </span>
                <PhotoDeleteButton photoId={photo.id} imageUrl={photo.image_url} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
