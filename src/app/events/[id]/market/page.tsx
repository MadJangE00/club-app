"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";

export default function EventMarketPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [price, setPrice] = useState(1);
  const [title, setTitle] = useState("");
  const [alreadyPosted, setAlreadyPosted] = useState(false);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      setUser(user);

      const { data: ev } = await supabase
        .from("events")
        .select("id, title, status, created_by, club_id, clubs(name)")
        .eq("id", eventId)
        .single();

      if (!ev || ev.status !== "completed" || ev.created_by !== user.id) {
        router.push(`/events/${eventId}`);
        return;
      }
      setEvent(ev);
      setTitle(`${ev.title} 모임 결과`);

      // 이미 마켓에 올렸는지 확인
      const { data: existing } = await supabase
        .from("photo_posts")
        .select("id")
        .eq("event_id", eventId)
        .single();
      if (existing) setAlreadyPosted(true);

      setLoading(false);
    }
    init();
  }, [eventId, router]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result as string);
      reader.readAsDataURL(f);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !file || !title.trim()) return;
    setSubmitting(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from("photos").upload(fileName, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from("photos").getPublicUrl(fileName);

      const { error } = await supabase.from("photo_posts").insert({
        club_id: event.club_id,
        user_id: user.id,
        event_id: eventId,
        title: title.trim(),
        image_url: publicUrl,
        price,
      } as any);
      if (error) throw error;

      router.push("/photos");
    } catch (err: any) {
      alert(`업로드 실패: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="text-center py-20 text-gray-500">로딩 중...</div>;

  if (alreadyPosted) {
    return (
      <div className="max-w-xl mx-auto text-center py-20">
        <div className="text-4xl mb-4">✅</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">이미 마켓에 올렸습니다</h2>
        <Link href="/photos" className="text-blue-600 hover:underline">마켓 보기 →</Link>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link href={`/events/${eventId}`} className="text-blue-600 hover:underline text-sm">← 모임으로</Link>
      </div>
      <h2 className="text-2xl font-bold text-gray-900">📸 마켓에 결과 올리기</h2>
      <p className="text-sm text-gray-500">{event?.clubs?.name} · {event?.title}</p>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-6 space-y-5">
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-2">제목 *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 text-gray-900"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-2">이미지 선택 *</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-gray-900"
            required
          />
          {preview && <img src={preview} alt="미리보기" className="mt-4 w-full max-h-72 object-contain rounded-lg border" />}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-2">구매 가격 (P)</label>
          <input
            type="number"
            min={0}
            value={price}
            onChange={(e) => setPrice(parseInt(e.target.value) || 0)}
            className="w-24 px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 text-gray-900 text-center"
          />
          <p className="text-xs text-gray-500 mt-1">0으로 설정하면 무료로 볼 수 있습니다</p>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={submitting || !file}
            className="flex-1 py-3 bg-pink-600 text-white font-bold rounded-lg hover:bg-pink-700 disabled:opacity-50"
          >
            {submitting ? "올리는 중..." : "마켓에 올리기"}
          </button>
        </div>
      </form>
    </div>
  );
}
