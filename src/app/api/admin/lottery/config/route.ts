import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: { user } } = await supabaseAdmin.auth.getUser(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: userData } = await supabaseAdmin.from("users").select("role").eq("id", user.id).single();
  if (userData?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { mode, prize_percentage, distribution } = await request.json();

  // 유효성 검사
  if (!["winner_takes_all", "custom"].includes(mode)) {
    return NextResponse.json({ error: "잘못된 모드" }, { status: 400 });
  }
  if (prize_percentage < 1 || prize_percentage > 100) {
    return NextResponse.json({ error: "상금 비율은 1~100 사이여야 합니다" }, { status: 400 });
  }
  const totalPct = distribution.reduce((sum: number, d: any) => sum + d.percentage, 0);
  if (totalPct !== 100) {
    return NextResponse.json({ error: "분배 비율 합계가 100%여야 합니다" }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from("lottery_config")
    .update({ mode, prize_percentage, distribution })
    .eq("id", 1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
