import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 1. 현재 회차 추첨
  const { data: drawResult, error: drawError } = await supabaseAdmin.rpc("draw_lottery");
  if (drawError) {
    console.error("draw_lottery error:", drawError);
  }

  // 2. 새 회차 오픈
  const { data: openResult, error: openError } = await supabaseAdmin.rpc("open_lottery_round");
  if (openError) {
    console.error("open_lottery_round error:", openError);
  }

  return NextResponse.json({ draw: drawResult, open: openResult });
}
