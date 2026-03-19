"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, useParams } from "next/navigation";
import type { User } from "@supabase/supabase-js";

export default function EditEventPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.id as string;
  
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push("/login");
        return;
      }
      
      setUser(user);

      // 모임 불러오기
      const { data: event, error } = await supabase
        .from("events")
        .select("*")
        .eq("id", eventId)
        .single();

      if (error || !event) {
        alert("모임을 찾을 수 없습니다.");
        router.push("/events");
        return;
      }

      // 주최자 확인
      if (event.created_by !== user.id) {
        alert("수정 권한이 없습니다.");
        router.push(`/events/${eventId}`);
        return;
      }

      // 날짜 포맷 변환 (datetime-local용)
      const dateStr = new Date(event.event_date).toISOString().slice(0, 16);

      setForm({
        club_id: event.club_id,
        title: event.title,
        description: event.description || "",
        event_date: dateStr,
        location: event.location || "",
        max_participants: event.max_participants || "",
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
  }, [eventId, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !form.title.trim() || !form.event_date || !form.club_id) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("events")
        .update({
          club_id: form.club_id,
          title: form.title,
          description: form.description || null,
          event_date: form.event_date,
          location: form.location || null,
          max_participants: form.max_participants ? parseInt(form.max_participants) : null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", eventId);

      if (error) throw error;

      router.push(`/events/${eventId}`);
      router.refresh();
    } catch (error: any) {
      console.error("Error updating event:", error);
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
      <h2 className="text-2xl font-bold text-gray-900 mb-6">📅 모임 수정</h2>

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
            disabled={saving}
            className="px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
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
