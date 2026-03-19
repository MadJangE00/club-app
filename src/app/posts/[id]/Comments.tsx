"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  users: {
    name: string;
    nickname: string;
  } | null;
}

interface CommentsProps {
  postId: string;
}

export default function Comments({ postId }: CommentsProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      // 댓글 가져오기
      const { data } = await supabase
        .from("comments")
        .select(`
          id,
          content,
          created_at,
          user_id,
          users (
            name,
            nickname
          )
        `)
        .eq("post_id", postId)
        .order("created_at", { ascending: true });

      // users가 배열로 반환되는 경우 처리
      const formattedComments = (data || []).map((c: any) => ({
        ...c,
        users: Array.isArray(c.users) ? c.users[0] : c.users
      }));
      setComments(formattedComments as Comment[]);
    }

    loadData();
  }, [postId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newComment.trim()) return;

    setLoading(true);
    try {
      const { error } = await supabase.from("comments").insert({
        post_id: postId,
        user_id: user.id,
        content: newComment.trim(),
      });

      if (error) throw error;

      setNewComment("");
      router.refresh();
      
      // 댓글 다시 불러오기
      const { data } = await supabase
        .from("comments")
        .select(`
          id,
          content,
          created_at,
          user_id,
          users (
            name,
            nickname
          )
        `)
        .eq("post_id", postId)
        .order("created_at", { ascending: true });

      const commentsData = (data || []).map((c: any) => ({
        ...c,
        users: Array.isArray(c.users) ? c.users[0] : c.users
      }));
      setComments(commentsData as Comment[]);
    } catch (error: any) {
      console.error("Error adding comment:", error);
      alert(`댓글 작성에 실패했습니다: ${error.message || "알 수 없는 오류"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (commentId: string) => {
    if (!editContent.trim()) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("comments")
        .update({ 
          content: editContent.trim(),
          updated_at: new Date().toISOString()
        })
        .eq("id", commentId);

      if (error) throw error;

      setEditingId(null);
      setEditContent("");
      router.refresh();
      
      // 댓글 다시 불러오기
      const { data } = await supabase
        .from("comments")
        .select(`
          id,
          content,
          created_at,
          user_id,
          users (
            name,
            nickname
          )
        `)
        .eq("post_id", postId)
        .order("created_at", { ascending: true });

      const commentsData = (data || []).map((c: any) => ({
        ...c,
        users: Array.isArray(c.users) ? c.users[0] : c.users
      }));
      setComments(commentsData as Comment[]);
    } catch (error: any) {
      console.error("Error editing comment:", error);
      alert(`댓글 수정에 실패했습니다: ${error.message || "알 수 없는 오류"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm("댓글을 삭제하시겠습니까?")) return;

    try {
      const { error } = await supabase
        .from("comments")
        .delete()
        .eq("id", commentId);

      if (error) throw error;

      router.refresh();
      
      // 댓글 다시 불러오기
      const { data } = await supabase
        .from("comments")
        .select(`
          id,
          content,
          created_at,
          user_id,
          users (
            name,
            nickname
          )
        `)
        .eq("post_id", postId)
        .order("created_at", { ascending: true });

      const commentsData = (data || []).map((c: any) => ({
        ...c,
        users: Array.isArray(c.users) ? c.users[0] : c.users
      }));
      setComments(commentsData as Comment[]);
    } catch (error: any) {
      console.error("Error deleting comment:", error);
      alert(`댓글 삭제에 실패했습니다: ${error.message || "알 수 없는 오류"}`);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">💬 댓글 ({comments.length})</h3>

      {/* 댓글 작성 */}
      {user ? (
        <form onSubmit={handleSubmit} className="mb-6">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
            rows={3}
            placeholder="댓글을 입력하세요..."
            required
          />
          <button
            type="submit"
            disabled={loading || !newComment.trim()}
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
          >
            {loading ? "작성 중..." : "댓글 작성"}
          </button>
        </form>
      ) : (
        <p className="text-gray-500 text-center py-4 mb-6">
          로그인하면 댓글을 작성할 수 있습니다
        </p>
      )}

      {/* 댓글 목록 */}
      {comments.length > 0 ? (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="border-b pb-4 last:border-0">
              {editingId === comment.id ? (
                <div>
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg"
                    rows={2}
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => handleEdit(comment.id)}
                      disabled={loading}
                      className="px-3 py-1 bg-blue-600 text-white rounded text-sm"
                    >
                      저장
                    </button>
                    <button
                      onClick={() => {
                        setEditingId(null);
                        setEditContent("");
                      }}
                      className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm"
                    >
                      취소
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium text-gray-900">
                        {comment.users?.nickname || comment.users?.name || "익명"}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(comment.created_at).toLocaleDateString("ko-KR", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    {user?.id === comment.user_id && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditingId(comment.id);
                            setEditContent(comment.content);
                          }}
                          className="text-xs text-blue-600 hover:underline"
                        >
                          수정
                        </button>
                        <button
                          onClick={() => handleDelete(comment.id)}
                          className="text-xs text-red-600 hover:underline"
                        >
                          삭제
                        </button>
                      </div>
                    )}
                  </div>
                  <p className="text-gray-700 whitespace-pre-wrap">{comment.content}</p>
                </>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-center py-4">
          아직 댓글이 없습니다. 첫 번째 댓글을 작성하세요!
        </p>
      )}
    </div>
  );
}
