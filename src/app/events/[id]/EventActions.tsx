"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";

interface EventActionsProps {
  eventId: string;
  createdBy: string;
  clubId: string;
}

export default function EventActions({ eventId, createdBy, clubId }: EventActionsProps) {
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
        .from("events")
        .delete()
        .eq("id", eventId);

      if (error) throw error;

      router.push(`/clubs/${clubId}`);
      router.refresh();
    } catch (error: any) {
      console.error("Error deleting event:", error);
      alert(`삭제에 실패했습니다: ${error.message || "알 수 없는 오류"}`);
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  // 주최자가 아니면 아무것도 표시하지 않음
  if (!user || user.id !== createdBy) {
    return null;
  }

  return (
    <div className="flex gap-2 items-center">
      <button
        onClick={() => router.push(`/events/${eventId}/edit`)}
        className="px-4 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors font-medium"
      >
        수정
      </button>
      
      {!showDeleteConfirm ? (
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="px-4 py-2 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-medium"
        >
          삭제
        </button>
      ) : (
        <div className="flex gap-2 items-center">
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50"
          >
            {deleting ? "삭제 중..." : "확인"}
          </button>
          <button
            onClick={() => setShowDeleteConfirm(false)}
            className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            취소
          </button>
        </div>
      )}
    </div>
  );
}
