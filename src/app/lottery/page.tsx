import { supabase } from "@/lib/supabase";
import LotteryClient from "./LotteryClient";

export const revalidate = 0;

async function getCurrentRound() {
  const { data } = await supabase
    .from("lottery_rounds")
    .select(`
      id, round_date, prize_amount, mode, distribution, status,
      lottery_tickets(count),
      lottery_winners(rank, prize_points, users(nickname, name))
    `)
    .eq("status", "open")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();
  return data as any;
}

async function getRecentRounds() {
  const { data } = await supabase
    .from("lottery_rounds")
    .select(`
      id, round_date, prize_amount, mode, status, drawn_at,
      lottery_winners(rank, prize_points, users(nickname, name))
    `)
    .eq("status", "drawn")
    .order("round_date", { ascending: false })
    .limit(5);
  return (data || []) as any[];
}

export default async function LotteryPage() {
  const [currentRound, recentRounds] = await Promise.all([
    getCurrentRound(),
    getRecentRounds(),
  ]);

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold text-gray-900">🎲 복권</h1>
        {currentRound && (
          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">
            진행중
          </span>
        )}
      </div>

      <LotteryClient currentRound={currentRound} recentRounds={recentRounds} />
    </div>
  );
}
