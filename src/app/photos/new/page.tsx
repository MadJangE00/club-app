"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";

export default function NewPhotoPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [clubs, setClubs] = useState<{ id: string; name: string }[]>([]);
  const [preview, setPreview] = useState<string | null>(null);
  const [form, setForm] = useState({
    club_id: "",
    title: "",
    description: "",
  });
  const [file, setFile] = useState<File | null>(null);

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
        setForm((prev) => ({ ...prev, club_id: userClubs[0].id }));
      }
    }
    
    init();
  }, [router]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onload = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !file || !form.title.trim() || !form.club_id) return;

    setLoading(true);
    try {
      // 파일 업로드
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('photos')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // 공개 URL 가져오기
      const { data: { publicUrl } } = supabase.storage
        .from('photos')
        .getPublicUrl(fileName);

      // DB에 저장
      const { error } = await supabase.from("photo_posts").insert({
        club_id: form.club_id,
        title: form.title,
        description: form.description || null,
        image_url: publicUrl,
        user_id: user.id,
      } as any);

      if (error) throw error;

      router.push("/photos");
    } catch (error: any) {
      console.error("Error uploading photo:", error);
      alert(`사진 업로드에 실패했습니다: ${error.message || "알 수 없는 오류"}`);
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

  if (clubs.length === 0) {
    return (
      <div className="max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">📷 사진 올리기</h2>
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="text-5xl mb-4">🔒</div>
          <p className="text-gray-700 text-lg mb-2">가입한 동호회가 없습니다</p>
          <p className="text-gray-500 mb-6">사진을 올리려면 먼저 동호회에 가입해주세요</p>
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
      <h2 className="text-2xl font-bold text-gray-900 mb-6">📷 사진 올리기</h2>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-2">
            동호회 선택 *
          </label>
          <select
            value={form.club_id}
            onChange={(e) => setForm({ ...form, club_id: e.target.value })}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 text-gray-900"
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
            사진 선택 *
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 text-gray-900"
            required
          />
          {preview && (
            <div className="mt-4">
              <img
                src={preview}
                alt="미리보기"
                className="w-full max-h-80 object-contain rounded-lg border"
              />
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-2">
            제목 *
          </label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 text-gray-900"
            placeholder="사진 제목을 입력하세요"
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
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 text-gray-900"
            rows={3}
            placeholder="사진에 대한 설명을 입력하세요"
          />
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading || !file}
            className="px-6 py-3 bg-pink-600 text-white font-semibold rounded-lg hover:bg-pink-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "업로드 중..." : "사진 올리기"}
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
