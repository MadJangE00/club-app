import { supabase } from "@/lib/supabase";
import PostDeleteButton from "./PostDeleteButton";

// 캐싱 비활성화
export const dynamic = "force-dynamic";
export const revalidate = 0;

async function getPosts() {
  const { data } = await supabase
    .from("posts")
    .select(`
      id,
      title,
      content,
      created_at,
      users (name, nickname, email),
      clubs (name)
    `)
    .order("created_at", { ascending: false });
  return data || [];
}

export default async function AdminPostsPage() {
  const posts = await getPosts();

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">📝 게시글 관리</h2>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left py-3 px-4 font-semibold">제목</th>
              <th className="text-left py-3 px-4 font-semibold">동호회</th>
              <th className="text-left py-3 px-4 font-semibold">작성자</th>
              <th className="text-left py-3 px-4 font-semibold">작성일</th>
              <th className="text-left py-3 px-4 font-semibold">관리</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((post: any) => (
              <tr key={post.id} className="border-b hover:bg-gray-50">
                <td className="py-3 px-4">
                  <div className="font-medium">{post.title}</div>
                  <div className="text-gray-500 text-xs truncate max-w-xs">
                    {post.content?.slice(0, 50)}...
                  </div>
                </td>
                <td className="py-3 px-4 text-gray-600">
                  {post.clubs?.name || "-"}
                </td>
                <td className="py-3 px-4 text-gray-600">
                  {post.users?.nickname || post.users?.name}
                  <br />
                  <span className="text-xs text-gray-400">{post.users?.email}</span>
                </td>
                <td className="py-3 px-4 text-gray-500">
                  {new Date(post.created_at).toLocaleDateString("ko-KR")}
                </td>
                <td className="py-3 px-4">
                  <PostDeleteButton postId={post.id} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
