"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";

interface PageData {
  todayChecked: boolean;
  totalPoints: number;
  consecutiveDays: number;
  bankBalance: number;
  prizeBalance: number;
  loading: boolean;
}

export default function DailyAttendance() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [data, setData] = useState<PageData>({
    todayChecked: false,
    totalPoints: 0,
    consecutiveDays: 0,
    bankBalance: 0,
    prizeBalance: 0,
    loading: true,
  });
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    async function loadData() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // 은행 & 상금 잔액 (비로그인도 표시)
      const [bankRes, prizeRes] = await Promise.all([
        supabase.from("point_bank").select("balance").eq("id", 1).single(),
        supabase.from("prize_pool").select("balance").eq("id", 1).single(),
      ]);

      if (!user) {
        setData((prev) => ({
          ...prev,
          bankBalance: bankRes.data?.balance || 0,
          prizeBalance: prizeRes.data?.balance || 0,
          loading: false,
        }));
        return;
      }

      setUser(user);

      const now = new Date();
      const koreaTime = new Date(now.getTime() + 9 * 60 * 60 * 1000);
      const today = koreaTime.toISOString().split("T")[0];

      const [todayAttendance, userData, recentAttendance] = await Promise.all([
        supabase
          .from("daily_attendance")
          .select("id")
          .eq("user_id", user.id)
          .eq("attended_at", today)
          .single(),
        supabase.from("users").select("points").eq("id", user.id).single(),
        supabase
          .from("daily_attendance")
          .select("attended_at")
          .eq("user_id", user.id)
          .order("attended_at", { ascending: false })
          .limit(30),
      ]);

      // 연속 출석일 계산 (한국 날짜 문자열 직접 비교)
      const getKoreaDateStr = (daysOffset = 0) => {
        const d = new Date();
        d.setTime(d.getTime() + 9 * 60 * 60 * 1000 + daysOffset * 86400000);
        return d.toISOString().split("T")[0];
      };

      let consecutiveDays = 0;
      if (recentAttendance.data && recentAttendance.data.length > 0) {
        for (let i = 0; i < recentAttendance.data.length; i++) {
          if (recentAttendance.data[i].attended_at === getKoreaDateStr(-i)) {
            consecutiveDays++;
          } else {
            break;
          }
        }
      }

      setData({
        todayChecked: !!todayAttendance.data,
        totalPoints: userData.data?.points || 0,
        consecutiveDays,
        bankBalance: bankRes.data?.balance || 0,
        prizeBalance: prizeRes.data?.balance || 0,
        loading: false,
      });
    }

    loadData();
  }, []);

  const handleCheckIn = async () => {
    if (!user || data.todayChecked || checking) return;

    setChecking(true);
    try {
      const { data: result, error } = await supabase.rpc("daily_checkin", {
        p_user_id: user.id,
      });

      if (error) throw error;

      if (!result.success) {
        alert(result.message);
        return;
      }

      setData((prev) => ({
        ...prev,
        todayChecked: true,
        totalPoints: prev.totalPoints + result.points_earned,
        consecutiveDays: prev.consecutiveDays + 1,
        bankBalance: prev.bankBalance - result.points_earned,
      }));

      router.refresh();
    } catch (error: any) {
      console.error("Error checking in:", error);
      alert(`출석에 실패했습니다: ${error.message || "알 수 없는 오류"}`);
    } finally {
      setChecking(false);
    }
  };

  if (data.loading) return null;

  return (
    <div className="space-y-3">
      {/* 은행 & 상금 현황 */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-xl shadow p-4 text-center">
          <div className="text-sm text-gray-500 mb-1">🏦 오늘의 은행</div>
          <div className="text-2xl font-bold text-blue-600">
            {data.bankBalance.toLocaleString()}P
          </div>
        </div>
        <div className="bg-white rounded-xl shadow p-4 text-center">
          <div className="text-sm text-gray-500 mb-1">🏆 상금 풀</div>
          <div className="text-2xl font-bold text-yellow-500">
            {data.prizeBalance.toLocaleString()}P
          </div>
        </div>
      </div>

      {/* 출석 체크 */}
      {user && (
        <div
          className={`rounded-xl shadow-lg p-5 ${
            data.todayChecked
              ? "bg-green-50"
              : "bg-gradient-to-r from-blue-500 to-purple-600 text-white"
          }`}
        >
          {data.todayChecked ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">✅</span>
                <span className="text-green-800 font-medium">
                  오늘 출석 완료!
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-green-700">
                <span>🔥 {data.consecutiveDays}일 연속</span>
                <span>•</span>
                <span>⭐ {data.totalPoints.toLocaleString()}P</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <div className="font-bold text-lg">📅 출석 체크</div>
                <div className="text-blue-100 text-sm mt-0.5">
                  🔥 {data.consecutiveDays}일 연속 &nbsp;•&nbsp; ⭐{" "}
                  {data.totalPoints.toLocaleString()}P 보유
                </div>
              </div>
              <button
                onClick={handleCheckIn}
                disabled={checking || data.bankBalance < 10}
                className="px-5 py-2.5 bg-white text-blue-600 font-bold rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {checking
                  ? "처리 중..."
                  : data.bankBalance < 10
                  ? "잔액 부족"
                  : "🎯 출석하기"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
