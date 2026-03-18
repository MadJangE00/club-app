"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";

interface Props {
  clubId: string;
}

export default function JoinButton({ clubId }: Props) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isMember, setIsMember] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkMembership() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data } = await supabase
          .from("club_members")
          .select("id")
          .eq("club_id", clubId)
          .eq("user_id", user.id)
          .single();

        setIsMember(!!data);
      }

      setLoading(false);
    }

    checkMembership();
  }, [clubId]);

  const handleJoin = async () => {
    if (!user) {
      router.push("/login");
      return;
    }

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
        const { error: userError } = await supabase.from("users").insert({
          id: user.id,
          email: user.email || "",
          name: userName,
        } as any);

        if (userError) {
          console.error("Error creating user:", userError);
          alert(`사용자 생성 실패: ${userError.message}`);
          return;
        }
      }

      const { error } = await supabase.from("club_members").insert({
        club_id: clubId,
        user_id: user.id,
        role: "member",
      } as any);

      if (error) {
        console.error("Error joining club:", error);
        alert(`가입에 실패했습니다: ${error.message || JSON.stringify(error)}`);
        return;
      }

      setIsMember(true);
      router.refresh();
    } catch (error: any) {
      console.error("Error joining club:", error);
      alert(`가입에 실패했습니다: ${error?.message || "알 수 없는 오류"}`);
    }
  };

  const handleLeave = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("club_members")
        .delete()
        .eq("club_id", clubId)
        .eq("user_id", user.id);

      if (error) {
        console.error("Error leaving club:", error);
        alert(`탈퇴에 실패했습니다: ${error.message}`);
        return;
      }

      setIsMember(false);
      router.refresh();
    } catch (error: any) {
      console.error("Error leaving club:", error);
      alert(`탈퇴에 실패했습니다: ${error?.message || "알 수 없는 오류"}`);
    }
  };

  if (loading) {
    return (
      <button disabled className="px-6 py-2 bg-gray-300 text-gray-500 rounded-lg font-medium">
        로딩중...
      </button>
    );
  }

  if (!user) {
    return (
      <button
        onClick={() => router.push("/login")}
        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
      >
        로그인하고 가입하기
      </button>
    );
  }

  if (isMember) {
    return (
      <button
        onClick={handleLeave}
        className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium transition-colors"
      >
        탈퇴하기
      </button>
    );
  }

  return (
    <button
      onClick={handleJoin}
      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
    >
      가입하기
    </button>
  );
}
