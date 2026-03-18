import { supabase } from "@/lib/supabase";
import Link from "next/link";

async function getPosts() {
  const { data } = await supabase
    .from("posts")
    .select(`
      id,
      title,
      content,
      created_at,
      users (
        name,
        nickname
      ),
      clubs (
        name
      )
    `)
    .order("created_at", { ascending: false });
  return (data || []) as any[];
}

export default async function PostsPage() {
  const posts = await getPosts();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">📋 게시판</h2>
        <Link
          href="/posts/new"
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
        >
          + 새 게시글
        </Link>
      </div>

      {posts.length > 0 ? (
        <div className="bg-white rounded-xl shadow divide-y">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/posts/${post.id}`}
              className="block p-6 hover:bg-gray-50 transition-colors"
            >
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                {post.title}
              </h3>
              <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                {post.content}
              </p>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-3">
                  <span className="font-medium text-gray-900">
                    ✏️ {post.users?.nickname || post.users?.name || "익명"}
                  </span>
                  <span className="text-gray-400">|</span>
                  <span className="text-purple-600 font-medium">
                    {post.clubs?.name || "동호회"}
                  </span>
                </div>
                <span className="text-gray-500">
                  {new Date(post.created_at).toLocaleDateString("ko-KR")}
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow p-12 text-center">
          <div className="text-4xl mb-4">📝</div>
          <p className="text-gray-600 mb-4">아직 게시글이 없습니다</p>
          <Link
            href="/posts/new"
            className="inline-block px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
          >
            첫 번째 게시글 작성하기
          </Link>
        </div>
      )}
    </div>
  );
}
