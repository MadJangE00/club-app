import { supabase } from "@/lib/supabase";
import { notFound } from "next/navigation";
import Link from "next/link";
import BoardActions from "./BoardActions";

export const revalidate = 0;

const CATEGORY_STYLE: Record<string, string> = {
  공지: "bg-red-100 text-red-700",
  자유: "bg-blue-100 text-blue-700",
  버그신고: "bg-orange-100 text-orange-700",
};

async function getPost(id: string) {
  const { data } = await supabase
    .from("board_posts")
    .select("*, users(id, name, nickname)")
    .eq("id", id)
    .single();
  return data as any;
}

export default async function BoardPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await getPost(id);
  if (!post) notFound();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link href="/board" className="text-blue-600 hover:underline text-sm">
        ← 전체 게시판
      </Link>

      <div className="bg-white rounded-xl shadow p-6 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-2 py-0.5 rounded text-xs font-bold ${CATEGORY_STYLE[post.category] || "bg-gray-100 text-gray-600"}`}>
                {post.category}
              </span>
            </div>
            <h2 className="text-xl font-bold text-gray-900">{post.title}</h2>
          </div>
          <BoardActions postId={id} authorId={post.users?.id} />
        </div>

        <div className="flex items-center gap-3 text-sm text-gray-500 pb-4 border-b border-gray-100">
          <span className="font-medium text-gray-700">{post.users?.nickname || post.users?.name}</span>
          <span>•</span>
          <span>{new Date(post.created_at).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })}</span>
        </div>

        <div className="text-gray-800 whitespace-pre-wrap leading-relaxed">
          {post.content}
        </div>
      </div>
    </div>
  );
}
