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
  const [clubCreationEnabled, setClubCreationEnabled] = useState(true);
  const [showDisabledModal, setShowDisabledModal] = useState(false);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setUser(user);

      // 동호회 개설 설정 확인
      const { data } = await supabase
        .from("site_settings")
        .select("club_creation_enabled")
        .eq("id", 1)
        .single();
      
      if (data?.club_creation_enabled === false) {
        setClubCreationEnabled(false);
      }
    };
    init();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 비활성화 상태면 모달 표시
    if (!clubCreationEnabled) {
      setShowDisabledModal(true);
      return;
    }
    
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
    <>
      <div className="max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">➕ 새 동호회 만들기</h2>

        {/* 비활성화 안내 */}
        {!clubCreationEnabled && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2 text-yellow-800">
              <span className="text-xl">⚠️</span>
              <span className="font-medium">현재 동호회 개설이 제한되어 있습니다.</span>
            </div>
            <p className="text-sm text-yellow-700 mt-1">
              관리자가 동호회 개설을 일시 중단했습니다. 나중에 다시 시도해주세요.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              동호회 이름 *
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 disabled:bg-gray-100 disabled:cursor-not-allowed"
              placeholder="동호회 이름을 입력하세요"
              required
              disabled={!clubCreationEnabled}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              설명
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 disabled:bg-gray-100 disabled:cursor-not-allowed"
              rows={4}
              placeholder="동호회에 대한 설명을 입력하세요"
              disabled={!clubCreationEnabled}
            />
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading || !clubCreationEnabled}
              className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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

      {/* 비활성화 모달 */}
      {showDisabledModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm mx-4">
            <div className="text-center">
              <div className="text-4xl mb-4">🔒</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                동호회 개설 불가
              </h3>
              <p className="text-gray-600 mb-6">
                현재 관리자에 의해 동호회 개설이 제한되어 있습니다.<br />
                나중에 다시 시도해주세요.
              </p>
              <button
                onClick={() => setShowDisabledModal(false)}
                className="px-6 py-2 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
