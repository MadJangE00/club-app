"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";

export default function NewEventPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [clubs, setClubs] = useState<{ id: string; name: string }[]>([]);
  const [form, setForm] = useState({
    club_id: "",
    title: "",
    description: "",
    event_date: "",
    location: "",
    max_participants: "",
  } as any);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push("/login");
        return;
      }
      
      setUser(user);

      // 가입한 동호회만 가져오기
      const { data: memberships } = await supabase
        .from("club_members")
        .select(`
          club_id,
          clubs (id, name)
        `)
        .eq("user_id", user.id);

      const userClubs = memberships?.map((m: any) => m.clubs).filter(Boolean) || [];
      setClubs(userClubs);
      
      if (userClubs.length > 0) {
        setForm((prev: any) => ({ ...prev, club_id: userClubs[0].id }));
      }
    }
    
    init();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !form.title.trim() || !form.event_date || !form.club_id) return;

    setLoading(true);
    try {
      const { error } = await supabase.from("events").insert({
        club_id: form.club_id,
        title: form.title,
        description: form.description || null,
        event_date: form.event_date,
        location: form.location || null,
        max_participants: form.max_participants ? parseInt(form.max_participants) : null,
        created_by: user.id,
      } as any);

      if (error) throw error;

      router.push("/events");
    } catch (error: any) {
      console.error("Error creating event:", error);
      alert(`모임 생성에 실패했습니다: ${error.message || "알 수 없는 오류"}`);
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
      <h2 className="text-2xl font-bold text-gray-900 mb-6">📅 새 모임 개설</h2>

      {clubs.length === 0 ? (
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-6 text-center">
          <p className="text-yellow-800 font-medium mb-4">
            가입한 동호회가 없습니다. 먼저 동호회에 가입해주세요!
          </p>
          <button
            onClick={() => router.push("/clubs")}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            동호회 둘러보기
          </button>
        </div>
      ) : (
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
            <p className="text-sm text-gray-500 mt-1">
              가입한 동호회만 선택할 수 있습니다
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              모임 이름 *
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
              placeholder="모임 이름을 입력하세요"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              모임 일시 *
            </label>
            <input
              type="datetime-local"
              value={form.event_date}
              onChange={(e) => setForm({ ...form, event_date: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              장소
            </label>
            <input
              type="text"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
              placeholder="모임 장소를 입력하세요"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              최대 참여 인원
            </label>
            <input
              type="number"
              value={form.max_participants}
              onChange={(e) => setForm({ ...form, max_participants: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
              placeholder="제한 없이 비워두세요"
              min="1"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              설명
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
              rows={4}
              placeholder="모임에 대한 설명을 입력하세요"
            />
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {loading ? "생성 중..." : "모임 만들기"}
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
      )}
    </div>
  );
}
