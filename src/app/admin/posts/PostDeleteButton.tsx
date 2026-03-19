"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

interface PostDeleteButtonProps {
  postId: string;
}

export default function PostDeleteButton({ postId }: PostDeleteButtonProps) {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("posts")
        .delete()
        .eq("id", postId);

      if (error) throw error;

      router.refresh();
    } catch (error: any) {
      console.error("Error deleting post:", error);
      alert(`삭제에 실패했습니다: ${error.message || "알 수 없는 오류"}`);
    } finally {
      setLoading(false);
      setShowConfirm(false);
    }
  };

  if (!showConfirm) {
    return (
      <button
        onClick={() => setShowConfirm(true)}
        className="px-3 py-1 bg-red-100 text-red-700 rounded text-xs font-medium hover:bg-red-200 transition-colors"
      >
        삭제
      </button>
    );
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={handleDelete}
        disabled={loading}
        className="px-3 py-1 bg-red-600 text-white rounded text-xs font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
      >
        {loading ? "삭제 중..." : "확인"}
      </button>
      <button
        onClick={() => setShowConfirm(false)}
        className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-xs font-medium hover:bg-gray-300 transition-colors"
      >
        취소
      </button>
    </div>
  );
}
