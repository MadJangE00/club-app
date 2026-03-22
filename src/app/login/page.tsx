"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "",
    name: "",
  });
  const [message, setMessage] = useState("");
  const [signupEnabled, setSignupEnabled] = useState(true);
  const [showDisabledModal, setShowDisabledModal] = useState(false);

  // 회원가입 설정 확인
  useEffect(() => {
    const checkSignupEnabled = async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("signup_enabled")
        .eq("id", 1)
        .single();
      
      if (data?.signup_enabled === false) {
        setSignupEnabled(false);
      }
    };
    checkSignupEnabled();
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 회원가입 비활성화 체크
    if (isSignUp && !signupEnabled) {
      setShowDisabledModal(true);
      return;
    }
    
    setLoading(true);
    setMessage("");

    try {
      if (isResetMode) {
        // 비밀번호 재설정 이메일 전송
        const { error } = await supabase.auth.resetPasswordForEmail(form.email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });

        if (error) throw error;

        setMessage("비밀번호 재설정 이메일을 전송했습니다. 이메일을 확인해주세요!");
      } else if (isSignUp) {
        // 회원가입
        const { data, error } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: {
            data: {
              name: form.name,
            },
          },
        });

        if (error) throw error;

        // users 테이블에도 추가
        if (data.user) {
          await supabase.from("users").insert({
            id: data.user.id,
            email: form.email,
            name: form.name,
          } as any);
        }

        setMessage("회원가입 완료! 환영합니다.");
        
        // 바로 로그인 처리
        setTimeout(() => {
          router.push("/");
          router.refresh();
        }, 1000);
      } else {
        // 로그인
        const { error } = await supabase.auth.signInWithPassword({
          email: form.email,
          password: form.password,
        });

        if (error) throw error;

        router.push("/");
        router.refresh();
      }
    } catch (error: any) {
      console.error("Auth error:", error);
      setMessage(error.message || "오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUpClick = () => {
    if (!signupEnabled) {
      setShowDisabledModal(true);
    } else {
      setIsSignUp(true);
      setIsResetMode(false);
      setMessage("");
    }
  };

  return (
    <>
      <div className="max-w-md mx-auto mt-12">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-6">
            {isResetMode ? "🔑 비밀번호 찾기" : isSignUp ? "🔐 회원가입" : "🔓 로그인"}
          </h2>

          {/* 회원가입 비활성화 안내 */}
          {isSignUp && !signupEnabled && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2 text-yellow-800 text-sm">
                <span>⚠️</span>
                <span className="font-medium">현재 회원가입이 제한되어 있습니다.</span>
              </div>
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-5">
            {isSignUp && (
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  이름
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="이름을 입력하세요"
                  required={isSignUp}
                  disabled={isSignUp && !signupEnabled}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                이메일
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="이메일을 입력하세요"
                required
                disabled={isSignUp && !signupEnabled}
              />
            </div>

            {!isResetMode && (
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  비밀번호
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="비밀번호를 입력하세요 (6자 이상)"
                  minLength={6}
                  required
                  disabled={isSignUp && !signupEnabled}
                />
              </div>
            )}

            {message && (
              <div className={`p-3 rounded-lg text-sm ${
                message.includes("완료") || message.includes("전송")
                  ? "bg-green-100 text-green-800" 
                  : "bg-red-100 text-red-800"
              }`}>
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || (isSignUp && !signupEnabled)}
              className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "처리 중..." : isResetMode ? "이메일 전송" : isSignUp ? "회원가입" : "로그인"}
            </button>
          </form>

          <div className="mt-6 space-y-2 text-center">
            {!isResetMode && !isSignUp && (
              <button
                onClick={() => {
                  setIsResetMode(true);
                  setMessage("");
                }}
                className="text-gray-600 hover:text-gray-800 text-sm block"
              >
                비밀번호를 잊으셨나요?
              </button>
            )}
            
            <button
              onClick={isSignUp ? () => {
                setIsSignUp(false);
                setMessage("");
              } : handleSignUpClick}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              {isResetMode ? "로그인으로 돌아가기" : isSignUp ? "이미 계정이 있으신가요? 로그인" : "계정이 없으신가요? 회원가입"}
            </button>
          </div>
        </div>
      </div>

      {/* 비활성화 모달 */}
      {showDisabledModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm mx-4">
            <div className="text-center">
              <div className="text-4xl mb-4">🔒</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                회원가입 불가
              </h3>
              <p className="text-gray-600 mb-6">
                현재 관리자에 의해 회원가입이 제한되어 있습니다.<br />
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
