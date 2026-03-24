"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";

const TICKET_COSTS = [0, 1, 2, 4, 8, 16];

function getTicketCost(ticketNumber: number): number {
  if (ticketNumber <= 6) return TICKET_COSTS[ticketNumber - 1];
  return 16 * Math.pow(2, ticketNumber - 6);
}

interface Props {
  currentRound: any;
  recentRounds: any[];
}

export default function LotteryClient({ currentRound, recentRounds }: Props) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [myPoints, setMyPoints] = useState(0);
  const [myTicketCount, setMyTicketCount] = useState(0);
  const [totalTickets, setTotalTickets] = useState(0);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (currentRound) {
        // 전체 티켓 수
        const { count } = await supabase
          .from("lottery_tickets")
          .select("id", { count: "exact", head: true })
          .eq("round_id", currentRound.id);
        setTotalTickets(count || 0);

        if (user) {
          const [pointsRes, ticketsRes] = await Promise.all([
            supabase.from("users").select("points").eq("id", user.id).single(),
            supabase
              .from("lottery_tickets")
              .select("id", { count: "exact", head: true })
              .eq("round_id", currentRound.id)
              .eq("user_id", user.id),
          ]);
          setMyPoints(pointsRes.data?.points || 0);
          setMyTicketCount(ticketsRes.count || 0);
        }
      }
      setLoading(false);
    }
    load();
  }, [currentRound]);

  const handleBuy = async () => {
    if (!user) { router.push("/login"); return; }
    if (!currentRound || buying) return;

    setBuying(true);
    try {
      const { data, error } = await supabase.rpc("buy_lottery_ticket", {
        p_round_id: currentRound.id,
      });
      if (error) throw error;
      if (!data.success) { alert(data.message); return; }

      const newCount = myTicketCount + 1;
      setMyTicketCount(newCount);
      setTotalTickets((prev) => prev + 1);
      setMyPoints((prev) => prev - data.cost);
      router.refresh();
    } catch (e: any) {
      alert(e.message || "구매 실패");
    } finally {
      setBuying(false);
    }
  };

  const nextCost = getTicketCost(myTicketCount + 1);

  if (loading) {
    return <div className="text-center py-12 text-gray-400">로딩 중...</div>;
  }

  return (
    <div className="space-y-6">
      {/* 현재 회차 */}
      {currentRound ? (
        <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl p-6 text-white shadow-xl">
          <div className="flex justify-between items-start mb-6">
            <div>
              <div className="text-purple-200 text-sm font-medium">오늘의 상금</div>
              <div className="text-4xl font-bold mt-1">
                {currentRound.prize_amount.toLocaleString()}P
              </div>
              <div className="text-purple-200 text-sm mt-1">
                {currentRound.mode === "winner_takes_all" ? "🏆 승자 독식" : "🎯 차등 분배"}
              </div>
            </div>
            <div className="text-right">
              <div className="text-purple-200 text-sm">총 티켓</div>
              <div className="text-2xl font-bold">{totalTickets}장</div>
              {user && (
                <div className="text-purple-200 text-sm mt-1">내 티켓 {myTicketCount}장</div>
              )}
            </div>
          </div>

          {/* 구매 버튼 */}
          {user ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between bg-white/10 rounded-xl p-4">
                <div>
                  <div className="font-bold">
                    {myTicketCount === 0 ? "첫 번째 티켓" : `${myTicketCount + 1}번째 티켓`}
                  </div>
                  <div className="text-purple-200 text-sm">
                    비용: {nextCost === 0 ? "🆓 무료" : `${nextCost}P`} &nbsp;•&nbsp; 보유: {myPoints.toLocaleString()}P
                  </div>
                </div>
                <button
                  onClick={handleBuy}
                  disabled={buying || (nextCost > 0 && myPoints < nextCost)}
                  className="px-5 py-2.5 bg-white text-purple-600 font-bold rounded-lg hover:bg-purple-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {buying ? "구매 중..." : nextCost > 0 && myPoints < nextCost ? "포인트 부족" : "🎟️ 구매"}
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => router.push("/login")}
              className="w-full py-3 bg-white text-purple-600 font-bold rounded-xl hover:bg-purple-50 transition-colors"
            >
              로그인하고 참여하기
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow p-12 text-center text-gray-500">
          <div className="text-4xl mb-3">🎲</div>
          <div className="font-medium">현재 진행 중인 복권이 없습니다</div>
          <div className="text-sm mt-1">매일 자정에 새 회차가 열립니다</div>
        </div>
      )}

      {/* 티켓 비용 안내 */}
      <div className="bg-white rounded-xl shadow p-5">
        <h3 className="font-bold text-gray-900 mb-3">🎟️ 티켓 구매 비용</h3>
        <div className="grid grid-cols-3 gap-2">
          {TICKET_COSTS.map((cost, i) => (
            <div
              key={i}
              className={`rounded-lg p-3 text-center text-sm ${
                user && myTicketCount === i
                  ? "bg-purple-100 border-2 border-purple-400"
                  : user && i < myTicketCount
                  ? "bg-gray-100 text-gray-400"
                  : "bg-gray-50"
              }`}
            >
              <div className="font-medium text-gray-700">{i + 1}번째</div>
              <div className="font-bold text-purple-600 mt-0.5">
                {cost === 0 ? "🆓 무료" : `${cost}P`}
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-2">※ 7번째부터 2배씩 증가 (32P, 64P...)</p>
      </div>

      {/* 최근 결과 */}
      {recentRounds.length > 0 && (
        <div className="bg-white rounded-xl shadow p-5">
          <h3 className="font-bold text-gray-900 mb-3">📋 최근 결과</h3>
          <div className="space-y-3">
            {recentRounds.map((round) => {
              const winners = round.lottery_winners || [];
              return (
                <div key={round.id} className="border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-700">
                      {new Date(round.round_date).toLocaleDateString("ko-KR", { month: "long", day: "numeric" })}
                    </span>
                    <span className="text-xs text-gray-400">
                      상금 {round.prize_amount.toLocaleString()}P
                    </span>
                  </div>
                  {winners.length > 0 ? (
                    <div className="space-y-1">
                      {winners
                        .sort((a: any, b: any) => a.rank - b.rank)
                        .map((w: any) => (
                          <div key={w.rank} className="flex items-center gap-2 text-sm">
                            <span className={`font-bold w-8 ${w.rank === 1 ? "text-yellow-500" : w.rank === 2 ? "text-gray-400" : "text-amber-600"}`}>
                              {w.rank}등
                            </span>
                            <span className="text-gray-700">{w.users?.nickname || w.users?.name}</span>
                            <span className="text-green-600 font-medium ml-auto">+{w.prize_points.toLocaleString()}P</span>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-400">참여자 없음</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
