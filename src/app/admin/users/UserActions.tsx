"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

interface UserActionsProps {
  userId: string;
  currentRole: string;
}

export default function UserActions({ userId, currentRole }: UserActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const toggleRole = async () => {
    setLoading(true);
    try {
      const newRole = currentRole === "admin" ? "member" : "admin";
      
      const { error } = await supabase
        .from("users")
        .update({ role: newRole })
        .eq("id", userId);

      if (error) throw error;

      router.refresh();
    } catch (error: any) {
      console.error("Error updating role:", error);
      alert(`권한 변경에 실패했습니다: ${error.message || "알 수 없는 오류"}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={toggleRole}
      disabled={loading}
      className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
        currentRole === "admin"
          ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
          : "bg-blue-100 text-blue-700 hover:bg-blue-200"
      } disabled:opacity-50`}
    >
      {loading ? "처리 중..." : currentRole === "admin" ? "관리자 해제" : "관리자 지정"}
    </button>
  );
}
