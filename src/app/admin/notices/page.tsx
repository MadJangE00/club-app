import { supabase } from "@/lib/supabase";
import NoticeActions from "./NoticeActions";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function getNotices() {
  const { data } = await supabase
    .from("notices")
    .select("id, title, content, is_active, created_at")
    .order("created_at", { ascending: false });
  return data || [];
}

export default async function AdminNoticesPage() {
  const notices = await getNotices();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">📢 공지사항 관리</h2>
        <Link
          href="/admin/notices/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          + 새 공지 작성
        </Link>
      </div>

      {notices.length === 0 ? (
        <div className="bg-white rounded-xl shadow p-12 text-center text-gray-500">
          등록된 공지사항이 없습니다.
        </div>
      ) : (
        <div className="space-y-4">
          {notices.map((notice: any) => (
            <div key={notice.id} className="bg-white rounded-xl shadow p-6">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      notice.is_active
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-500"
                    }`}>
                      {notice.is_active ? "활성" : "비활성"}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(notice.created_at).toLocaleDateString("ko-KR")}
                    </span>
                  </div>
                  <h3 className="font-bold text-gray-900 text-base truncate">{notice.title}</h3>
                  <p className="text-gray-600 text-sm mt-1 line-clamp-2 whitespace-pre-wrap">
                    {notice.content}
                  </p>
                </div>
                <NoticeActions noticeId={notice.id} isActive={notice.is_active} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
