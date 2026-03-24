"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface DistRow { rank: number; percentage: number; }
interface Config {
  mode: "winner_takes_all" | "custom";
  prize_percentage: number;
  distribution: DistRow[];
}
interface Round {
  id: string;
  round_date: string;
  prize_amount: number;
  mode: string;
  status: string;
  drawn_at: string | null;
  lottery_winners: any[];
  ticket_count: number;
}

export default function LotteryPanel() {
  const [config, setConfig] = useState<Config | null>(null);
  const [currentRound, setCurrentRound] = useState<Round | null>(null);
  const [recentRounds, setRecentRounds] = useState<Round[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editConfig, setEditConfig] = useState<Config | null>(null);
  const [saving, setSaving] = useState(false);
  const [acting, setActing] = useState<"draw" | "open" | null>(null);

  async function fetchData() {
    const [configRes, currentRes, recentRes] = await Promise.all([
      supabase.from("lottery_config").select("*").eq("id", 1).single(),
      supabase
        .from("lottery_rounds")
        .select(`id, round_date, prize_amount, mode, status, drawn_at,
          lottery_winners(rank, prize_points, users(nickname, name)),
          lottery_tickets(count)`)
        .eq("status", "open")
        .order("created_at", { ascending: false })
        .limit(1)
        .single(),
      supabase
        .from("lottery_rounds")
        .select(`id, round_date, prize_amount, mode, status, drawn_at,
          lottery_winners(rank, prize_points, users(nickname, name))`)
        .eq("status", "drawn")
        .order("round_date", { ascending: false })
        .limit(3),
    ]);

    if (configRes.data) setConfig(configRes.data as Config);
    if (currentRes.data) setCurrentRound(currentRes.data as any);
    if (recentRes.data) setRecentRounds(recentRes.data as any[]);
  }

  useEffect(() => { fetchData(); }, []);

  const openModal = () => {
    if (!config) return;
    setEditConfig({ ...config, distribution: config.distribution.map((d) => ({ ...d })) });
    setShowModal(true);
  };

  const handleSaveConfig = async () => {
    if (!editConfig) return;
    const totalPct = editConfig.distribution.reduce((s, d) => s + d.percentage, 0);
    if (totalPct !== 100) { alert("분배 비율 합계가 100%여야 합니다"); return; }

    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/admin/lottery/config", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${session!.access_token}` },
        body: JSON.stringify(editConfig),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      await fetchData();
      setShowModal(false);
    } catch (e: any) {
      alert(`저장 실패: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDraw = async () => {
    if (!confirm("지금 추첨하시겠습니까?")) return;
    setActing("draw");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/admin/lottery/draw", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${session!.access_token}` },
        body: JSON.stringify({}),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      if (!result.success) { alert(result.message); return; }

      const winners = result.winners || [];
      if (winners.length === 0) {
        alert("추첨 완료! (참여자 없음)");
      } else {
        const msg = winners.map((w: any) => `${w.rank}등: ${w.nickname} (+${w.prize_points}P)`).join("\n");
        alert(`🎉 추첨 완료!\n${msg}`);
      }
      await fetchData();
    } catch (e: any) {
      alert(`추첨 실패: ${e.message}`);
    } finally {
      setActing(null);
    }
  };

  const handleOpen = async () => {
    if (!confirm("새 회차를 오픈하시겠습니까?")) return;
    setActing("open");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/admin/lottery/open", {
        method: "POST",
        headers: { authorization: `Bearer ${session!.access_token}` },
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      if (!result.success) { alert(result.message); return; }
      alert(`새 회차 오픈!\n상금: ${result.prize_amount}P`);
      await fetchData();
    } catch (e: any) {
      alert(`오픈 실패: ${e.message}`);
    } finally {
      setActing(null);
    }
  };

  const addDistRow = () => {
    if (!editConfig) return;
    const nextRank = editConfig.distribution.length + 1;
    setEditConfig({ ...editConfig, distribution: [...editConfig.distribution, { rank: nextRank, percentage: 0 }] });
  };

  const removeDistRow = (i: number) => {
    if (!editConfig) return;
    const newDist = editConfig.distribution.filter((_, idx) => idx !== i).map((d, idx) => ({ ...d, rank: idx + 1 }));
    setEditConfig({ ...editConfig, distribution: newDist });
  };

  const updateDistPct = (i: number, pct: number) => {
    if (!editConfig) return;
    const newDist = editConfig.distribution.map((d, idx) => idx === i ? { ...d, percentage: pct } : d);
    setEditConfig({ ...editConfig, distribution: newDist });
  };

  if (!config) return null;

  const totalEditPct = editConfig?.distribution.reduce((s, d) => s + d.percentage, 0) ?? 0;

  return (
    <>
      <div className="bg-white rounded-xl shadow p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-900">🎲 복권 관리</h2>
          <button onClick={openModal} className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors">
            ⚙️ 설정
          </button>
        </div>

        {/* 현재 설정 */}
        <div className="grid grid-cols-3 gap-3 text-sm">
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <div className="text-gray-500">모드</div>
            <div className="font-bold mt-0.5">
              {config.mode === "winner_takes_all" ? "🏆 승자독식" : "🎯 차등분배"}
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <div className="text-gray-500">상금 비율</div>
            <div className="font-bold mt-0.5">{config.prize_percentage}%</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <div className="text-gray-500">등수 수</div>
            <div className="font-bold mt-0.5">{config.distribution.length}개</div>
          </div>
        </div>

        {/* 현재 회차 */}
        {currentRound ? (
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium text-purple-800">진행 중인 회차</span>
              <span className="text-sm text-purple-600">
                {new Date(currentRound.round_date).toLocaleDateString("ko-KR")}
              </span>
            </div>
            <div className="text-sm text-purple-700">
              상금 {currentRound.prize_amount.toLocaleString()}P &nbsp;•&nbsp;
              티켓 {(currentRound as any).lottery_tickets?.[0]?.count || 0}장
            </div>
            <button
              onClick={handleDraw}
              disabled={!!acting}
              className="mt-3 w-full py-2 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
            >
              {acting === "draw" ? "추첨 중..." : "🎲 지금 추첨하기"}
            </button>
          </div>
        ) : (
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <div className="text-gray-500 text-sm mb-3">진행 중인 회차 없음</div>
            <button
              onClick={handleOpen}
              disabled={!!acting}
              className="px-5 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {acting === "open" ? "오픈 중..." : "📣 새 회차 오픈"}
            </button>
          </div>
        )}

        {/* 최근 결과 */}
        {recentRounds.length > 0 && (
          <div>
            <h3 className="text-sm font-bold text-gray-600 mb-2">최근 결과</h3>
            <div className="space-y-2">
              {recentRounds.map((round) => {
                const winners = round.lottery_winners || [];
                return (
                  <div key={round.id} className="text-sm flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                    <span className="text-gray-500">
                      {new Date(round.round_date).toLocaleDateString("ko-KR", { month: "numeric", day: "numeric" })}
                    </span>
                    <span className="text-gray-700">
                      {winners.length > 0
                        ? winners.sort((a: any, b: any) => a.rank - b.rank).map((w: any) =>
                            `${w.rank}등 ${w.users?.nickname || w.users?.name}(+${w.prize_points}P)`
                          ).join(", ")
                        : "참여자 없음"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 설정 모달 */}
      {showModal && editConfig && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6 space-y-5">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-900">복권 설정</h3>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
              </div>

              {/* 모드 선택 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">분배 방식</label>
                <div className="grid grid-cols-2 gap-3">
                  {(["winner_takes_all", "custom"] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => {
                        const dist = m === "winner_takes_all"
                          ? [{ rank: 1, percentage: 100 }]
                          : editConfig.distribution.length === 1 && editConfig.distribution[0].percentage === 100
                          ? [{ rank: 1, percentage: 60 }, { rank: 2, percentage: 40 }]
                          : editConfig.distribution;
                        setEditConfig({ ...editConfig, mode: m, distribution: dist });
                      }}
                      className={`py-3 rounded-xl font-medium border-2 transition-colors ${
                        editConfig.mode === m
                          ? "border-purple-500 bg-purple-50 text-purple-700"
                          : "border-gray-200 text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      {m === "winner_takes_all" ? "🏆 승자 독식" : "🎯 차등 분배"}
                    </button>
                  ))}
                </div>
              </div>

              {/* 상금 비율 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  상금 풀 사용 비율: <span className="text-purple-600 font-bold">{editConfig.prize_percentage}%</span>
                </label>
                <input
                  type="range" min={1} max={100} value={editConfig.prize_percentage}
                  onChange={(e) => setEditConfig({ ...editConfig, prize_percentage: Number(e.target.value) })}
                  className="w-full accent-purple-600"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1"><span>1%</span><span>100%</span></div>
              </div>

              {/* 차등 분배 설정 */}
              {editConfig.mode === "custom" && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium text-gray-700">등수별 분배 비율</label>
                    <span className={`text-xs font-bold ${totalEditPct === 100 ? "text-green-600" : "text-red-500"}`}>
                      합계 {totalEditPct}%
                    </span>
                  </div>
                  <div className="space-y-2">
                    {editConfig.distribution.map((d, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-600 w-10">{d.rank}등</span>
                        <input
                          type="number" min={0} max={100} value={d.percentage}
                          onChange={(e) => updateDistPct(i, Number(e.target.value))}
                          className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
                        />
                        <span className="text-sm text-gray-400">%</span>
                        {editConfig.distribution.length > 1 && (
                          <button onClick={() => removeDistRow(i)} className="text-red-400 hover:text-red-600 text-lg leading-none">×</button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={addDistRow}
                    className="mt-2 w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-purple-400 hover:text-purple-600 transition-colors"
                  >
                    + 등수 추가
                  </button>
                </div>
              )}

              {/* 버튼 */}
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowModal(false)} className="flex-1 py-3 border border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                  취소
                </button>
                <button
                  onClick={handleSaveConfig}
                  disabled={saving || totalEditPct !== 100}
                  className="flex-1 py-3 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 transition-colors disabled:opacity-50"
                >
                  {saving ? "저장 중..." : "저장"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
