"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface BankData {
  bankBalance: number;
  prizeBalance: number;
  totalMembers: number;
  yesterdayAttendance: number;
  loading: boolean;
}

export default function BankPanel() {
  const [data, setData] = useState<BankData>({
    bankBalance: 0,
    prizeBalance: 0,
    totalMembers: 0,
    yesterdayAttendance: 0,
    loading: true,
  });
  const [resetting, setResetting] = useState(false);

  async function fetchData() {
    // 한국 시간 기준 어제 날짜
    const koreaTime = new Date(new Date().getTime() + 9 * 60 * 60 * 1000);
    koreaTime.setDate(koreaTime.getDate() - 1);
    const yesterday = koreaTime.toISOString().split("T")[0];

    const [bankRes, prizeRes, membersRes, yesterdayRes] = await Promise.all([
      supabase.from("point_bank").select("balance").eq("id", 1).single(),
      supabase.from("prize_pool").select("balance").eq("id", 1).single(),
      supabase.from("users").select("id", { count: "exact", head: true }),
      supabase
        .from("daily_attendance")
        .select("id", { count: "exact", head: true })
        .eq("attended_at", yesterday),
    ]);

    setData({
      bankBalance: bankRes.data?.balance || 0,
      prizeBalance: prizeRes.data?.balance || 0,
      totalMembers: membersRes.count || 0,
      yesterdayAttendance: yesterdayRes.count || 0,
      loading: false,
    });
  }

  useEffect(() => {
    fetchData();
  }, []);

  const handleReset = async () => {
    if (!confirm("은행을 현재 회원 수 × 10P로 리셋하시겠습니까?\n(상금 풀은 변경되지 않습니다)")) return;

    setResetting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("로그인이 필요합니다");

      const res = await fetch("/api/admin/reset-bank", {
        method: "POST",
        headers: { authorization: `Bearer ${session.access_token}` },
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error);

      alert(`리셋 완료!\n회원 수: ${result.member_count}명\n새 은행 잔액: ${result.new_bank_balance}P`);
      await fetchData();
    } catch (error: any) {
      alert(`실패: ${error.message}`);
    } finally {
      setResetting(false);
    }
  };

  if (data.loading) return null;

  const attendanceRate = data.totalMembers > 0
    ? Math.round((data.yesterdayAttendance / data.totalMembers) * 100)
    : 0;
  const absentCount = data.totalMembers - data.yesterdayAttendance;

  return (
    <div className="bg-white rounded-xl shadow p-6 space-y-4">
      <h2 className="text-lg font-bold text-gray-900">🏦 포인트 은행 관리</h2>

      {/* 전날 출석률 */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-600">📊 전날 출석률</span>
          <span className="text-lg font-bold text-gray-900">{attendanceRate}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className="bg-blue-500 h-2.5 rounded-full transition-all"
            style={{ width: `${attendanceRate}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1.5">
          <span>✅ 출석 {data.yesterdayAttendance}명</span>
          <span>❌ 미출석 {absentCount}명 / 전체 {data.totalMembers}명</span>
        </div>
      </div>

      {/* 은행 & 상금 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-blue-50 rounded-lg p-4 text-center">
          <div className="text-sm text-gray-500 mb-1">현재 은행 잔액</div>
          <div className="text-2xl font-bold text-blue-600">
            {data.bankBalance.toLocaleString()}P
          </div>
        </div>
        <div className="bg-yellow-50 rounded-lg p-4 text-center">
          <div className="text-sm text-gray-500 mb-1">상금 풀</div>
          <div className="text-2xl font-bold text-yellow-500">
            {data.prizeBalance.toLocaleString()}P
          </div>
        </div>
      </div>

      <button
        onClick={handleReset}
        disabled={resetting}
        className="w-full py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
      >
        {resetting ? "처리 중..." : "🔄 은행 리셋 (회원 수 × 10P)"}
      </button>
      <p className="text-xs text-gray-400 text-center">
        상금 풀은 변경되지 않습니다. 자정에 자동 리셋됩니다.
      </p>
    </div>
  );
}
