"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";

export default function NewClubPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
  });

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push("/login");
      } else {
        setUser(user);
      }
    });
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !form.name.trim()) return;

    setLoading(true);
    try {
      // 먼저 users 테이블에 사용자가 있는지 확인
      const { data: existingUser } = await supabase
        .from("users")
        .select("id")
        .eq("id", user.id)
        .single();

      if (!existingUser) {
        // users 테이블에 사용자 추가
        const userName = (user.user_metadata?.name as string) || user.email?.split("@")[0] || "사용자";
        await supabase.from("users").insert({
          id: user.id,
          email: user.email || "",
          name: userName,
        } as any);
      }

      const { data: club, error } = await supabase.from("clubs").insert({
        name: form.name,
        description: form.description || null,
        owner_id: user.id,
      } as any).select("id").single();

      if (error) throw error;

      // 동호회 생성자를 멤버로 추가 (owner role)
      if (club) {
        await supabase.from("club_members").insert({
          club_id: club.id,
          user_id: user.id,
          role: "owner",
        } as any);
      }

      router.push("/clubs");
    } catch (error: any) {
      console.error("Error creating club:", error);
      alert(`동호회 생성에 실패했습니다: ${error.message || "알 수 없는 오류"}`);
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

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">➕ 새 동호회 만들기</h2>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-2">
            동호회 이름 *
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
            placeholder="동호회 이름을 입력하세요"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-2">
            설명
          </label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
            rows={4}
            placeholder="동호회에 대한 설명을 입력하세요"
          />
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "생성 중..." : "동호회 만들기"}
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
