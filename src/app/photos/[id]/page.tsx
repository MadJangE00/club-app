import { supabase } from "@/lib/supabase";
import { notFound } from "next/navigation";
import Link from "next/link";
import VoteButton from "./VoteButton";
import PhotoActions from "./PhotoActions";

// ISR: 30초마다 재생성
export const revalidate = 30;

async function getPhoto(id: string) {
  const { data, error } = await supabase
    .from("photo_posts")
    .select(`
      id,
      title,
      description,
      image_url,
      created_at,
      user_id,
      club_id,
      clubs (
        id,
        name
      ),
      users (
        name,
        nickname
      )
    `)
    .eq("id", id)
    .single();
  
  return data as any;
}

async function getVotes(photoId: string) {
  const { data, count } = await supabase
    .from("photo_votes")
    .select(`
      user_id,
      users (
        name,
        nickname
      )
    `, { count: "exact" })
    .eq("photo_id", photoId);
  
  return {
    count: count || 0,
    voters: (data || []) as any[]
  };
}

export default async function PhotoDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params;
  const photo = await getPhoto(id);
  
  if (!photo) {
    notFound();
  }

  const { count, voters } = await getVotes(id);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 사진 */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="flex justify-between items-start p-4 border-b">
          <div>
            <Link 
              href={`/clubs/${photo.club_id}`}
              className="text-pink-600 hover:underline font-medium"
            >
              {photo.clubs?.name}
            </Link>
          </div>
          <PhotoActions 
            photoId={id} 
            authorId={photo.user_id}
          />
        </div>
        
        <img
          src={photo.image_url}
          alt={photo.title}
          className="w-full max-h-[600px] object-contain bg-gray-100"
        />
        
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {photo.title}
          </h1>
          
          {photo.description && (
            <p className="text-gray-700 mb-4">{photo.description}</p>
          )}
          
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span className="font-medium text-gray-900">
              📷 {photo.users?.nickname || photo.users?.name || "익명"}
            </span>
            <span>
              {new Date(photo.created_at).toLocaleDateString("ko-KR", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>
        </div>
      </div>

      {/* 투표 섹션 */}
      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">
            👍 투표 ({count}명)
          </h3>
          <VoteButton photoId={id} />
        </div>
        
        {voters.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {voters.map((voter) => (
              <span
                key={voter.user_id}
                className="px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-sm font-medium"
              >
                {voter.users?.nickname || voter.users?.name || "사용자"}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">
            아직 투표한 사람이 없습니다
          </p>
        )}
      </div>

      {/* 뒤로가기 */}
      <div className="text-center">
        <Link
          href="/photos"
          className="text-blue-600 hover:underline font-medium"
        >
          ← 사진 목록으로
        </Link>
      </div>
    </div>
  );
}
