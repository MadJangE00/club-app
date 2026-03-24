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

  const [resetResult, transferResult] = await Promise.all([
    supabaseAdmin.rpc("midnight_reset"),
    supabaseAdmin.rpc("transfer_completed_event_points"),
  ]);

  if (resetResult.error) {
    console.error("midnight_reset error:", resetResult.error);
    return NextResponse.json({ error: resetResult.error.message }, { status: 500 });
  }

  if (transferResult.error) {
    console.error("transfer_completed_event_points error:", transferResult.error);
  }

  return NextResponse.json({
    reset: resetResult.data,
    transfer: transferResult.data,
  });
}
