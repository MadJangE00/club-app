"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";

export default function EditProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    nickname: "",
    phone: "",
  });
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push("/login");
        return;
      }
      
      setUser(user);

      const { data } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single();

      if (data) {
        setForm({
          name: data.name || "",
          nickname: data.nickname || "",
          phone: data.phone || "",
        });
      }

      setLoading(false);
    }

    loadProfile();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setMessage("");

    try {
      const { error } = await supabase
        .from("users")
        .update({
          name: form.name,
          nickname: form.nickname || null,
          phone: form.phone || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) throw error;

      setMessage("프로필이 업데이트되었습니다!");
      
      setTimeout(() => {
        router.push("/profile");
      }, 1000);
    } catch (error) {
      console.error("Error updating profile:", error);
      setMessage("업데이트에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <div className="text-xl text-gray-700">로딩 중...</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">✏️ 프로필 수정</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              이름 *
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              placeholder="이름을 입력하세요"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              닉네임
            </label>
            <input
              type="text"
              value={form.nickname}
              onChange={(e) => setForm({ ...form, nickname: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              placeholder="닉네임을 입력하세요"
            />
            <p className="text-sm text-gray-500 mt-1">
              다른 사람에게 보여질 이름입니다
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              전화번호
            </label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              placeholder="010-0000-0000"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              이메일
            </label>
            <input
              type="email"
              value={user.email || ""}
              disabled
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg bg-gray-100 text-gray-500"
            />
            <p className="text-sm text-gray-500 mt-1">
              이메일은 변경할 수 없습니다
            </p>
          </div>

          {message && (
            <div className={`p-3 rounded-lg text-sm font-medium ${
              message.includes("업데이트")
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}>
              {message}
            </div>
          )}

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {saving ? "저장 중..." : "저장하기"}
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
    </div>
  );
}
