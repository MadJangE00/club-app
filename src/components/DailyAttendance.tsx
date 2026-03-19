"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";

interface AttendanceData {
  todayChecked: boolean;
  totalPoints: number;
  consecutiveDays: number;
  loading: boolean;
}

export default function DailyAttendance() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [data, setData] = useState<AttendanceData>({
    todayChecked: false,
    totalPoints: 0,
    consecutiveDays: 0,
    loading: true,
  });
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setData((prev) => ({ ...prev, loading: false }));
        return;
      }
      setUser(user);

      const today = new Date().toISOString().split("T")[0];

      // 오늘 출석했는지 확인
      const { data: todayAttendance } = await supabase
        .from("daily_attendance")
        .select("id")
        .eq("user_id", user.id)
        .eq("attended_at", today)
        .single();

      // 총 포인트 가져오기 (users 테이블에서)
      const { data: userData } = await supabase
        .from("users")
        .select("points")
        .eq("id", user.id)
        .single();

      // 연속 출석일 계산
      const { data: recentAttendance } = await supabase
        .from("daily_attendance")
        .select("attended_at")
        .eq("user_id", user.id)
        .order("attended_at", { ascending: false })
        .limit(30);

      let consecutiveDays = 0;
      if (recentAttendance && recentAttendance.length > 0) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        for (let i = 0; i < recentAttendance.length; i++) {
          const checkDate = new Date(recentAttendance[i].attended_at);
          checkDate.setHours(0, 0, 0, 0);
          
          const expectedDate = new Date(today);
          expectedDate.setDate(today.getDate() - i);
          
          if (checkDate.getTime() === expectedDate.getTime()) {
            consecutiveDays++;
          } else {
            break;
          }
        }
      }

      setData({
        todayChecked: !!todayAttendance,
        totalPoints: userData?.points || 0,
        consecutiveDays,
        loading: false,
      });
    }

    loadData();
  }, []);

  const handleCheckIn = async () => {
    if (!user || data.todayChecked || checking) return;

    setChecking(true);
    try {
      const today = new Date().toISOString().split("T")[0];

      // 출석 기록
      const { error: attendanceError } = await supabase
        .from("daily_attendance")
        .insert({
          user_id: user.id,
          attended_at: today,
          points_earned: 10,
        });

      if (attendanceError) throw attendanceError;

      // 포인트 업데이트
      const { error: pointsError } = await supabase.rpc("add_points", {
        user_id: user.id,
        points: 10,
      });

      // RPC가 없으면 직접 업데이트
      if (pointsError) {
        await supabase
          .from("users")
          .update({ points: (data.totalPoints || 0) + 10 })
          .eq("id", user.id);
      }

      setData((prev) => ({
        ...prev,
        todayChecked: true,
        totalPoints: (prev.totalPoints || 0) + 10,
        consecutiveDays: prev.consecutiveDays + 1,
      }));

      router.refresh();
    } catch (error: any) {
      console.error("Error checking in:", error);
      alert(`출석에 실패했습니다: ${error.message || "알 수 없는 오류"}`);
    } finally {
      setChecking(false);
    }
  };

  if (data.loading) {
    return (
      <div className="bg-white rounded-xl shadow p-6">
        <div className="text-center text-gray-500">로딩 중...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="bg-white rounded-xl shadow p-6">
        <p className="text-center text-gray-600">
          로그인하면 출석 체크를 할 수 있어요!
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold">📅 매일 출석 체크</h3>
          <p className="text-blue-100 text-sm mt-1">하루 한 번, 10포인트 적립!</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold">⭐ {data.totalPoints || 0}</div>
          <div className="text-blue-100 text-sm">포인트</div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🔥</span>
          <div>
            <div className="font-bold">{data.consecutiveDays}일 연속</div>
            <div className="text-blue-100 text-xs">출석 중</div>
          </div>
        </div>

        {data.todayChecked ? (
          <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-lg">
            <span className="text-2xl">✅</span>
            <span className="font-bold">오늘 출석 완료!</span>
          </div>
        ) : (
          <button
            onClick={handleCheckIn}
            disabled={checking}
            className="px-6 py-3 bg-white text-blue-600 font-bold rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {checking ? "처리 중..." : "🎯 출석하기"}
          </button>
        )}
      </div>
    </div>
  );
}
