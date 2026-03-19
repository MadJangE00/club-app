"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";

interface ClubActionsProps {
  clubId: string;
  ownerId: string;
}

export default function ClubActions({ clubId, ownerId }: ClubActionsProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
  }, []);

  const handleDelete = async () => {
    if (!user) return;
    
    setDeleting(true);
    try {
      const { error } = await supabase
        .from("clubs")
        .delete()
        .eq("id", clubId);

      if (error) throw error;

      router.push("/clubs");
      router.refresh();
    } catch (error: any) {
      console.error("Error deleting club:", error);
      alert(`삭제에 실패했습니다: ${error.message || "알 수 없는 오류"}`);
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  // 소유자가 아니면 아무것도 표시하지 않음
  if (!user || user.id !== ownerId) {
    return null;
  }

  return (
    <div className="flex gap-2">
      <span className="px-3 py-1.5 text-sm bg-yellow-100 text-yellow-800 rounded-lg font-medium">
        👑 동호회장
      </span>
      
      {!showDeleteConfirm ? (
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-medium"
        >
          동호회 삭제
        </button>
      ) : (
        <div className="flex gap-2 items-center">
          <span className="text-sm text-red-600 font-medium">정말 삭제하시겠습니까?</span>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50"
          >
            {deleting ? "삭제 중..." : "확인"}
          </button>
          <button
            onClick={() => setShowDeleteConfirm(false)}
            className="px-3 py-1.5 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            취소
          </button>
        </div>
      )}
    </div>
  );
}
