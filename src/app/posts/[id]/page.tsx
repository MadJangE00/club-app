import { supabase } from "@/lib/supabase";
import { notFound } from "next/navigation";
import Link from "next/link";
import PostActions from "./PostActions";

// ISR: 30초마다 재생성
export const revalidate = 30;

async function getPost(id: string) {
  const { data, error } = await supabase
    .from("posts")
    .select(`
      id,
      title,
      content,
      created_at,
      updated_at,
      user_id,
      club_id,
      users (
        id,
        name,
        nickname
      ),
      clubs (
        id,
        name
      )
    `)
    .eq("id", id)
    .single();
  
  return data as any;
}

export default async function PostDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params;
  const post = await getPost(id);
  
  if (!post) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 게시글 헤더 */}
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="flex justify-between items-start mb-4">
          <Link 
            href={`/clubs/${post.club_id}`}
            className="text-purple-600 hover:underline font-medium"
          >
            {post.clubs?.name}
          </Link>
          <PostActions 
            postId={post.id} 
            authorId={post.user_id}
            clubId={post.club_id}
          />
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          {post.title}
        </h1>
        
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <span className="font-medium text-gray-900">
            ✏️ {post.users?.nickname || post.users?.name || "익명"}
          </span>
          <span>|</span>
          <span>
            {new Date(post.created_at).toLocaleDateString("ko-KR", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
          {post.updated_at !== post.created_at && (
            <>
              <span>|</span>
              <span className="text-gray-400">
                (수정됨)
              </span>
            </>
          )}
        </div>
      </div>

      {/* 게시글 내용 */}
      <div className="bg-white rounded-xl shadow p-8">
        <div className="prose max-w-none text-gray-800 whitespace-pre-wrap">
          {post.content}
        </div>
      </div>

      {/* 뒤로가기 */}
      <div className="text-center">
        <Link
          href="/posts"
          className="text-blue-600 hover:underline font-medium"
        >
          ← 게시글 목록으로
        </Link>
      </div>
    </div>
  );
}
