"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";

interface LikeButtonProps {
  postId: string;
}

export default function LikeButton({ postId }: LikeButtonProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [hasLiked, setHasLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      // 좋아요 수 가져오기
      const { count } = await supabase
        .from("post_likes")
        .select("*", { count: "exact", head: true })
        .eq("post_id", postId);

      setLikeCount(count || 0);

      // 내가 좋아요 했는지 확인
      if (user) {
        const { data } = await supabase
          .from("post_likes")
          .select("id")
          .eq("post_id", postId)
          .eq("user_id", user.id)
          .single();

        setHasLiked(!!data);
      }
    }

    loadData();
  }, [postId]);

  const handleLike = async () => {
    if (!user) {
      router.push("/login");
      return;
    }

    setLoading(true);
    try {
      if (hasLiked) {
        // 좋아요 취소
        const { error } = await supabase
          .from("post_likes")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", user.id);

        if (error) throw error;
        setHasLiked(false);
        setLikeCount((prev) => prev - 1);
      } else {
        // 좋아요
        const { error } = await supabase.from("post_likes").insert({
          post_id: postId,
          user_id: user.id,
        });

        if (error) throw error;
        setHasLiked(true);
        setLikeCount((prev) => prev + 1);
      }

      router.refresh();
    } catch (error: any) {
      console.error("Error toggling like:", error);
      alert(`좋아요에 실패했습니다: ${error.message || "알 수 없는 오류"}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleLike}
      disabled={loading}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
        hasLiked
          ? "bg-red-100 text-red-600 hover:bg-red-200"
          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
      } disabled:opacity-50`}
    >
      <span className="text-lg">{hasLiked ? "❤️" : "🤍"}</span>
      <span>{likeCount}</span>
    </button>
  );
}
