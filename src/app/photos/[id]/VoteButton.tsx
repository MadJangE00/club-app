"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";

interface VoteButtonProps {
  photoId: string;
}

export default function VoteButton({ photoId }: VoteButtonProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function checkVote() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      setUser(user);

      const { data } = await supabase
        .from("photo_votes")
        .select("id")
        .eq("photo_id", photoId)
        .eq("user_id", user.id)
        .single();

      setHasVoted(!!data);
    }

    checkVote();
  }, [photoId]);

  const handleVote = async () => {
    if (!user) {
      router.push("/login");
      return;
    }

    setLoading(true);
    try {
      if (hasVoted) {
        // 투표 취소
        const { error } = await supabase
          .from("photo_votes")
          .delete()
          .eq("photo_id", photoId)
          .eq("user_id", user.id);

        if (error) throw error;
        setHasVoted(false);
      } else {
        // 투표
        const { error } = await supabase.from("photo_votes").insert({
          photo_id: photoId,
          user_id: user.id,
        } as any);

        if (error) throw error;
        setHasVoted(true);
      }

      router.refresh();
    } catch (error: any) {
      console.error("Error voting:", error);
      alert(`투표에 실패했습니다: ${error.message || "알 수 없는 오류"}`);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <button
        onClick={() => router.push("/login")}
        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium text-sm"
      >
        로그인하고 투표하기
      </button>
    );
  }

  return (
    <button
      onClick={handleVote}
      disabled={loading}
      className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
        hasVoted
          ? "bg-pink-600 text-white hover:bg-pink-700"
          : "bg-pink-100 text-pink-700 hover:bg-pink-200"
      } disabled:opacity-50`}
    >
      {loading ? "처리 중..." : hasVoted ? "👍 투표함" : "👍 투표하기"}
    </button>
  );
}
