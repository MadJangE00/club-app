"use client";

import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function NoticeActions({
  noticeId,
  isActive,
}: {
  noticeId: string;
  isActive: boolean;
}) {
  const router = useRouter();

  async function toggleActive() {
    await supabase
      .from("notices")
      .update({ is_active: !isActive })
      .eq("id", noticeId);
    router.refresh();
  }

  async function deleteNotice() {
    if (!confirm("공지를 삭제하시겠습니까?")) return;
    await supabase.from("notices").delete().eq("id", noticeId);
    router.refresh();
  }

  return (
    <div className="flex gap-2 shrink-0">
      <button
        onClick={toggleActive}
        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
          isActive
            ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
            : "bg-green-100 text-green-700 hover:bg-green-200"
        }`}
      >
        {isActive ? "비활성화" : "활성화"}
      </button>
      <button
        onClick={deleteNotice}
        className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-xs font-medium hover:bg-red-200 transition-colors"
      >
        삭제
      </button>
    </div>
  );
}
