"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    // URL에서 해시 파라미터 확인 (Supabase가 토큰을 해시로 전달)
    const hash = window.location.hash;
    if (!hash || !hash.includes("access_token")) {
      setError("잘못된 접근입니다. 이메일의 링크를 다시 클릭해주세요.");
    }
  }, []);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setMessage("비밀번호가 일치하지 않습니다.");
      return;
    }

    if (password.length < 6) {
      setMessage("비밀번호는 6자 이상이어야 합니다.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      setMessage("비밀번호가 변경되었습니다! 로그인 페이지로 이동합니다.");
      
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (error: any) {
      console.error("Reset error:", error);
      setMessage(error.message || "비밀번호 변경에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <div className="max-w-md mx-auto mt-12">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-6">
            🔑 비밀번호 재설정
          </h2>
          <div className="p-4 bg-red-100 text-red-800 rounded-lg">
            {error}
          </div>
          <div className="mt-6 text-center">
            <a href="/login" className="text-blue-600 hover:text-blue-800 font-medium">
              로그인 페이지로 돌아가기
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-12">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-6">
          🔑 비밀번호 재설정
        </h2>

        <form onSubmit={handleResetPassword} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              새 비밀번호
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              placeholder="새 비밀번호 (6자 이상)"
              minLength={6}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              비밀번호 확인
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              placeholder="비밀번호 다시 입력"
              minLength={6}
              required
            />
          </div>

          {message && (
            <div className={`p-3 rounded-lg text-sm ${
              message.includes("변경되었습니다")
                ? "bg-green-100 text-green-800" 
                : "bg-red-100 text-red-800"
            }`}>
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "처리 중..." : "비밀번호 변경"}
          </button>
        </form>
      </div>
    </div>
  );
}
