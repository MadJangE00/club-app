"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";

interface EventActionsProps {
  eventId: string;
  createdBy: string;
  clubId: string;
  eventStatus: string;
  eventDate: string;
}

export default function EventActions({ eventId, createdBy, clubId, eventStatus, eventDate }: EventActionsProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [working, setWorking] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
  }, []);

  const handleDelete = async () => {
    if (!user) return;
    setDeleting(true);
    try {
      const { error } = await supabase.from("events").delete().eq("id", eventId);
      if (error) throw error;
      router.push(`/clubs/${clubId}`);
      router.refresh();
    } catch (error: any) {
      alert(`삭제에 실패했습니다: ${error.message || "알 수 없는 오류"}`);
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleComplete = async () => {
    setWorking(true);
    try {
      const { data } = await supabase.rpc("set_event_pending", { p_event_id: eventId });
      if (!data?.success) { alert(data?.message || "오류가 발생했습니다"); return; }
      router.refresh();
    } finally {
      setWorking(false);
    }
  };

  const handleFinalize = async () => {
    setWorking(true);
    try {
      const { data } = await supabase.rpc("set_event_completed", { p_event_id: eventId });
      if (!data?.success) { alert(data?.message || "오류가 발생했습니다"); return; }
      router.push(`/events/${eventId}/market`);
    } finally {
      setWorking(false);
    }
  };

  if (!user || user.id !== createdBy) return null;

  const isEventPast = new Date(eventDate) < new Date();

  return (
    <div className="flex gap-2 items-center flex-wrap">
      {/* 모임 완료 버튼: 시간 지났고 active 상태 */}
      {isEventPast && eventStatus === "active" && (
        <button
          onClick={handleComplete}
          disabled={working}
          className="px-4 py-2 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium disabled:opacity-50"
        >
          {working ? "처리 중..." : "모임 완료"}
        </button>
      )}

      {/* 참석자 확인 완료 버튼: pending 상태 */}
      {eventStatus === "pending" && (
        <button
          onClick={handleFinalize}
          disabled={working}
          className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50"
        >
          {working ? "처리 중..." : "✅ 참석자 확인 완료"}
        </button>
      )}

      {/* 수정/삭제: active 상태만 */}
      {eventStatus === "active" && (
        <>
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
              <button onClick={handleDelete} disabled={deleting}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50">
                {deleting ? "삭제 중..." : "확인"}
              </button>
              <button onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium">
                취소
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
