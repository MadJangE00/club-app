"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, useParams } from "next/navigation";
import type { User } from "@supabase/supabase-js";

export default function EditPostPage() {
  const router = useRouter();
  const params = useParams();
  const postId = params.id as string;
  
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clubs, setClubs] = useState<{ id: string; name: string }[]>([]);
  const [form, setForm] = useState({
    club_id: "",
    title: "",
    content: "",
  });

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push("/login");
        return;
      }
      
      setUser(user);

      // 게시글 불러오기
      const { data: post, error } = await supabase
        .from("posts")
        .select("*")
        .eq("id", postId)
        .single();

      if (error || !post) {
        alert("게시글을 찾을 수 없습니다.");
        router.push("/posts");
        return;
      }

      // 작성자 확인
      if (post.user_id !== user.id) {
        alert("수정 권한이 없습니다.");
        router.push(`/posts/${postId}`);
        return;
      }

      setForm({
        club_id: post.club_id,
        title: post.title,
        content: post.content,
      });

      // 가입한 동호회 목록
      const { data: memberships } = await supabase
        .from("club_members")
        .select(`
          club_id,
          clubs (
            id,
            name
          )
        `)
        .eq("user_id", user.id);

      const clubList = (memberships || [])
        .map((m: any) => m.clubs)
        .filter(Boolean) as { id: string; name: string }[];
      
      setClubs(clubList);
      setLoading(false);
    }

    loadData();
  }, [postId, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !form.title.trim() || !form.content.trim()) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("posts")
        .update({
          club_id: form.club_id,
          title: form.title,
          content: form.content,
          updated_at: new Date().toISOString(),
        })
        .eq("id", postId);

      if (error) throw error;

      router.push(`/posts/${postId}`);
      router.refresh();
    } catch (error: any) {
      console.error("Error updating post:", error);
      alert(`수정에 실패했습니다: ${error.message || "알 수 없는 오류"}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-600">로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">✏️ 게시글 수정</h2>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-2">
            동호회 선택 *
          </label>
          <select
            value={form.club_id}
            onChange={(e) => setForm({ ...form, club_id: e.target.value })}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
            required
          >
            {clubs.map((club) => (
              <option key={club.id} value={club.id}>
                {club.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-2">
            제목 *
          </label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-gray-900"
            placeholder="게시글 제목을 입력하세요"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-2">
            내용 *
          </label>
          <textarea
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-gray-900"
            rows={10}
            placeholder="게시글 내용을 입력하세요"
            required
          />
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
          >
            {saving ? "저장 중..." : "수정 완료"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
          >
            취소
          </button>
        </div>
      </form>
    </div>
  );
}
