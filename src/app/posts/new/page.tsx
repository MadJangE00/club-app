"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";

export default function NewPostPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [clubs, setClubs] = useState<{ id: string; name: string }[]>([]);
  const [form, setForm] = useState({
    club_id: "",
    title: "",
    content: "",
  });

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        router.push("/login");
      } else {
        setUser(user);
        
        // 사용자가 가입한 동호회만 가져오기
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
        if (clubList.length > 0) {
          setForm((prev) => ({ ...prev, club_id: clubList[0].id }));
        }
      }
    });
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !form.title.trim() || !form.content.trim()) return;

    setLoading(true);
    try {
      // 포인트 차감 (3P)
      const { data: pointResult } = await supabase.rpc("deduct_post_points");
      if (!pointResult?.success) {
        alert(pointResult?.message || "포인트가 부족합니다");
        return;
      }

      const { error } = await supabase.from("posts").insert({
        club_id: form.club_id,
        title: form.title,
        content: form.content,
        user_id: user.id,
      } as any);

      if (error) throw error;

      router.push("/posts");
    } catch (error: any) {
      console.error("Error creating post:", error);
      alert(`게시글 작성에 실패했습니다: ${error.message || "알 수 없는 오류"}`);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-600">로그인이 필요합니다...</p>
      </div>
    );
  }

  // 가입한 동호회가 없을 때
  if (clubs.length === 0) {
    return (
      <div className="max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">✏️ 게시글 작성</h2>
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="text-5xl mb-4">🔒</div>
          <p className="text-gray-700 text-lg mb-2">가입한 동호회가 없습니다</p>
          <p className="text-gray-500 mb-6">게시글을 작성하려면 먼저 동호회에 가입해주세요</p>
          <button
            onClick={() => router.push("/clubs")}
            className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            동호회 둘러보기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">✏️ 게시글 작성</h2>

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
            {clubs.length === 0 ? (
              <option value="">동호회가 없습니다</option>
            ) : (
              clubs.map((club) => (
                <option key={club.id} value={club.id}>
                  {club.name}
                </option>
              ))
            )}
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
            disabled={loading || clubs.length === 0}
            className="px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "작성 중..." : "게시글 작성 (3P)"}
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
