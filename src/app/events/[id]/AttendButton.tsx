"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";

interface Props {
  eventId: string;
  maxParticipants: number | null;
  currentCount: number;
}

type AttendanceStatus = "attending" | "maybe" | "not_attending";

export default function AttendButton({ eventId, maxParticipants, currentCount }: Props) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AttendanceStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAttendance() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data } = await supabase
          .from("attendance")
          .select("status")
          .eq("event_id", eventId)
          .eq("user_id", user.id)
          .single();

        if (data) {
          setStatus(data.status);
        }
      }

      setLoading(false);
    }

    checkAttendance();
  }, [eventId]);

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
          },
          {
            onConflict: "event_id,user_id",
          }
        );

      if (error) {
        console.error("Error upserting attendance:", error);
        alert(`참가 신청 실패: ${error.message}`);
        return;
      }

      setStatus(newStatus);
      router.refresh();
    } catch (error: any) {
      console.error("Error updating attendance:", error);
      alert(`참가 신청에 실패했습니다: ${error?.message || "알 수 없는 오류"}`);
    }
  };

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

  const isFull = maxParticipants && currentCount >= maxParticipants;

  return (
    <div className="flex gap-2">
      <button
        onClick={() => handleAttend("attending")}
        disabled={isFull && status !== "attending"}
        className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
          status === "attending"
            ? "bg-green-600 text-white ring-2 ring-green-300"
            : isFull
            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
            : "bg-green-600 text-white hover:bg-green-700"
        }`}
      >
        {isFull && status !== "attending" ? "정원 초과" : status === "attending" ? "✅ 참석중" : "참석하기"}
      </button>
      <button
        onClick={() => handleAttend("maybe")}
        className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
          status === "maybe"
            ? "bg-yellow-500 text-white ring-2 ring-yellow-300"
            : "bg-yellow-500 text-white hover:bg-yellow-600"
        }`}
      >
        {status === "maybe" ? "🤔 고민중" : "고민중"}
      </button>
      <button
        onClick={() => handleAttend("not_attending")}
        className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
          status === "not_attending"
            ? "bg-red-500 text-white ring-2 ring-red-300"
            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
        }`}
      >
        {status === "not_attending" ? "❌ 불참" : "불참"}
      </button>
    </div>
  );
}
