"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface BankData {
  bankBalance: number;
  prizeBalance: number;
  loading: boolean;
}

export default function BankPanel() {
  const [data, setData] = useState<BankData>({
    bankBalance: 0,
    prizeBalance: 0,
    loading: true,
  });
  const [resetting, setResetting] = useState(false);

  async function fetchBalances() {
    const [bankRes, prizeRes] = await Promise.all([
      supabase.from("point_bank").select("balance").eq("id", 1).single(),
      supabase.from("prize_pool").select("balance").eq("id", 1).single(),
    ]);
    setData({
      bankBalance: bankRes.data?.balance || 0,
      prizeBalance: prizeRes.data?.balance || 0,
      loading: false,
    });
  }

  useEffect(() => {
    fetchBalances();
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
      await fetchBalances();
    } catch (error: any) {
      alert(`실패: ${error.message}`);
    } finally {
      setResetting(false);
    }
  };

  if (data.loading) return null;

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <h2 className="text-lg font-bold text-gray-900 mb-4">🏦 포인트 은행 관리</h2>
      <div className="grid grid-cols-2 gap-4 mb-4">
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
      <p className="text-xs text-gray-400 mt-2 text-center">
        상금 풀은 변경되지 않습니다. 자정에 자동 리셋됩니다.
      </p>
    </div>
  );
}
