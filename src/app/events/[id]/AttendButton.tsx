"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";

interface Props {
  eventId: string;
  clubId: string;
  eventDate: string;
  maxParticipants: number | null;
  currentCount: number;
}

type AttendanceStatus = "attending" | "maybe" | "not_attending";

export default function AttendButton({ eventId, clubId, eventDate, maxParticipants, currentCount }: Props) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AttendanceStatus | null>(null);
  const [isMember, setIsMember] = useState(false);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    async function checkAttendance() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        // 동호회 멤버인지 확인
        const { data: membership } = await supabase
          .from("club_members")
          .select("id")
          .eq("club_id", clubId)
          .eq("user_id", user.id)
          .single();

        setIsMember(!!membership);

        // 현재 출석 상태 확인
        const { data } = await supabase
          .from("attendance")
          .select("status")
          .eq("event_id", eventId)
          .eq("user_id", user.id)
          .single();

        if (data) {
          setStatus((data as any).status);
        }
      }

      setLoading(false);
    }

    checkAttendance();
  }, [eventId, clubId]);

  const handleAttend = async (newStatus: AttendanceStatus) => {
    if (!user) {
      router.push("/login");
      return;
    }

    // 인원 제한 체크
    if (newStatus === "attending" && maxParticipants && currentCount >= maxParticipants && status !== "attending") {
      alert("정원이 가득 찼습니다!");
      return;
    }

    try {
      // UPSERT 사용 (이미 있으면 업데이트, 없으면 삽입)
      const { error } = await supabase
        .from("attendance")
        .upsert(
          {
            event_id: eventId,
            user_id: user.id,
            status: newStatus,
          } as any,
          {
            onConflict: "event_id,user_id",
          }
        );

      if (error) {
        console.error("Error upserting attendance:", error);
        alert(`참가 신청 실패: ${error.message}`);
        return;
      }

      // 참석 시 포인트 차감 (3P → 모임 바구니, 이미 납부했으면 스킵)
      if (newStatus === "attending") {
        const { data: pointResult } = await supabase.rpc("pay_event_attendance", { p_event_id: eventId });
        if (pointResult && !pointResult.success) {
          alert(pointResult.message || "포인트가 부족합니다 (3P 필요)");
          // 참석 취소
          await supabase.from("attendance").update({ status: status || "not_attending" } as any)
            .eq("event_id", eventId).eq("user_id", user.id);
          return;
        }
      }

      setStatus(newStatus);
      router.refresh();
    } catch (error: any) {
      console.error("Error updating attendance:", error);
      alert(`참가 신청에 실패했습니다: ${error?.message || "알 수 없는 오류"}`);
    }
  };

  const handleConfirm = () => {
    setConfirming(true);
    // 동호회 상세 페이지로 이동
    setTimeout(() => {
      router.push(`/clubs/${clubId}`);
    }, 500);
  };

  // 모임 날짜 확인
  const now = new Date();
  const eventDateTime = new Date(eventDate);
  const isEventPast = eventDateTime < now;

  if (loading) {
    return (
      <div className="text-gray-500 text-sm">로딩중...</div>
    );
  }

  if (!user) {
    return (
      <button
        onClick={() => router.push("/login")}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors"
      >
        로그인하고 참가하기
      </button>
    );
  }

  if (!isMember) {
    return (
      <div className="px-6 py-3 bg-gray-100 text-gray-600 rounded-lg font-medium">
        🔒 동호회 멤버만 참가할 수 있습니다
      </div>
    );
  }

  // 모임이 끝난 경우
  if (isEventPast) {
    return (
      <div className="space-y-3">
        <div className="px-6 py-3 bg-gray-100 text-gray-600 rounded-lg font-medium">
          ⏰ 모임이 종료되었습니다
        </div>
        <button
          onClick={handleConfirm}
          disabled={confirming}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors disabled:opacity-50"
        >
          {confirming ? "이동 중..." : "✅ 확인"}
        </button>
      </div>
    );
  }

  const isFull = maxParticipants && currentCount >= maxParticipants;

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <button
          onClick={() => handleAttend("attending")}
          disabled={!!isFull && status !== "attending"}
          className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-colors ${
            status === "attending"
              ? "bg-green-600 text-white ring-2 ring-green-300"
              : isFull
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-green-100 text-green-700 hover:bg-green-200"
          }`}
        >
          {status === "attending" ? "✅ 참석" : "참석 (3P)"}
        </button>
        <button
          onClick={() => handleAttend("maybe")}
          className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-colors ${
            status === "maybe"
              ? "bg-yellow-500 text-white ring-2 ring-yellow-300"
              : "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
          }`}
        >
          {status === "maybe" ? "🤔 고민중" : "고민중"}
        </button>
        <button
          onClick={() => handleAttend("not_attending")}
          className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-colors ${
            status === "not_attending"
              ? "bg-red-500 text-white ring-2 ring-red-300"
              : "bg-red-100 text-red-700 hover:bg-red-200"
          }`}
        >
          {status === "not_attending" ? "❌ 불참" : "불참"}
        </button>
      </div>
      
      {status && (
        <button
          onClick={handleConfirm}
          disabled={confirming}
          className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors disabled:opacity-50"
        >
          {confirming ? "이동 중..." : "✅ 확인"}
        </button>
      )}
    </div>
  );
}
