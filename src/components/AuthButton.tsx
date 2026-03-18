"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

export default function AuthButton() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 현재 사용자 확인
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });

    // 인증 상태 변경 감지
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    window.location.href = "/";
  };

  if (loading) {
    return <div className="text-gray-500 text-sm">로딩중...</div>;
  }

  if (user) {
    return (
      <div className="flex items-center gap-3">
        <a
          href="/profile"
          className="flex items-center gap-2 text-gray-700 hover:text-black font-medium"
        >
          <span className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
            {(user.user_metadata?.name || user.email || "U")[0].toUpperCase()}
          </span>
          <span className="hidden sm:inline">
            {user.user_metadata?.name || user.email?.split("@")[0]}
          </span>
        </a>
        <button
          onClick={handleLogout}
          className="px-3 py-1.5 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
        >
          로그아웃
        </button>
      </div>
    );
  }

  return (
    <a
      href="/login"
      className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
    >
      로그인
    </a>
  );
}
