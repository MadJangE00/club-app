"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface Notice {
  id: string;
  title: string;
  content: string;
}

export default function NoticePopup() {
  const [notice, setNotice] = useState<Notice | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("notices")
        .select("id, title, content")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (!data) return;

      const key = `notice_dismissed_${data.id}`;
      if (sessionStorage.getItem(key)) return;

      setNotice(data);
      setVisible(true);
    }
    load();
  }, []);

  function dismiss() {
    if (notice) sessionStorage.setItem(`notice_dismissed_${notice.id}`, "1");
    setVisible(false);
  }

  if (!visible || !notice) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="bg-blue-600 rounded-t-2xl px-6 py-4">
          <h2 className="text-white text-lg font-bold">📢 공지사항</h2>
        </div>
        <div className="px-6 py-5">
          <h3 className="text-gray-900 font-bold text-base mb-3">{notice.title}</h3>
          <p className="text-gray-700 text-sm whitespace-pre-wrap leading-relaxed">{notice.content}</p>
        </div>
        <div className="px-6 pb-5 flex justify-end">
          <button
            onClick={dismiss}
            className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}
