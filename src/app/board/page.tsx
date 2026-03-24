import { supabase } from "@/lib/supabase";
import Link from "next/link";

export const revalidate = 30;

const CATEGORIES = ["전체", "공지", "자유", "버그신고"] as const;
const CATEGORY_STYLE: Record<string, string> = {
  공지: "bg-red-100 text-red-700",
  자유: "bg-blue-100 text-blue-700",
  버그신고: "bg-orange-100 text-orange-700",
};

async function getPosts(category?: string) {
  let query = supabase
    .from("board_posts")
    .select("id, category, title, content, created_at, users(name, nickname)")
    .order("created_at", { ascending: false });

  if (category && category !== "전체") {
    query = query.eq("category", category);
  }

  const { data } = await query;
  return (data || []) as any[];
}

export default async function BoardPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const posts = await getPosts(category);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">📋 전체 게시판</h2>
        <Link
          href="/board/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          + 글쓰기
        </Link>
      </div>

      {/* 카테고리 탭 */}
      <div className="flex gap-2 flex-wrap">
        {CATEGORIES.map((cat) => (
          <Link
            key={cat}
            href={cat === "전체" ? "/board" : `/board?category=${cat}`}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              (cat === "전체" && !category) || category === cat
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-600 hover:bg-gray-100 shadow-sm"
            }`}
          >
            {cat}
          </Link>
        ))}
      </div>

      {/* 게시글 목록 */}
      {posts.length > 0 ? (
        <div className="bg-white rounded-xl shadow divide-y">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/board/${post.id}`}
              className="block p-5 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start gap-3">
                <span className={`px-2 py-0.5 rounded text-xs font-bold shrink-0 mt-0.5 ${CATEGORY_STYLE[post.category] || "bg-gray-100 text-gray-600"}`}>
                  {post.category}
                </span>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 truncate">{post.title}</h3>
                  <p className="text-gray-500 text-sm line-clamp-1 mt-0.5">{post.content}</p>
                </div>
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-2 pl-0">
                <span>{post.users?.nickname || post.users?.name}</span>
                <span>{new Date(post.created_at).toLocaleDateString("ko-KR")}</span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow p-12 text-center text-gray-500">
          <div className="text-4xl mb-3">📝</div>
          <p>아직 게시글이 없습니다</p>
        </div>
      )}
    </div>
  );
}
