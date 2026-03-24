import { supabase } from "@/lib/supabase";
import { notFound } from "next/navigation";
import Link from "next/link";
import PrintButton from "./PrintButton";

export const revalidate = 0;

async function getEventWithAttendance(id: string) {
  const [eventRes, attendanceRes] = await Promise.all([
    supabase
      .from("events")
      .select(`*, clubs(id, name), users(name, nickname)`)
      .eq("id", id)
      .single(),
    supabase
      .from("attendance")
      .select(`status, attended_at, users(name, nickname)`)
      .eq("event_id", id)
      .order("status"),
  ]);
  return { event: eventRes.data as any, attendance: (attendanceRes.data || []) as any[] };
}

export default async function EventReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { event, attendance } = await getEventWithAttendance(id);
  if (!event) notFound();

  const isEventPast = new Date(event.event_date) < new Date();

  const attending = attendance.filter((a) => a.status === "attending");
  const maybe = attendance.filter((a) => a.status === "maybe");
  const notAttending = attendance.filter((a) => a.status === "not_attending");
  const attendanceRate = attendance.length > 0
    ? Math.round((attending.length / attendance.length) * 100)
    : 0;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link href={`/events/${id}`} className="text-blue-600 hover:underline text-sm">
          ← 모임으로 돌아가기
        </Link>
        <PrintButton />
      </div>

      {/* 레포트 본문 (인쇄 영역) */}
      <div id="report" className="bg-white rounded-xl shadow-lg p-8 space-y-6">
        {/* 헤더 */}
        <div className="border-b border-gray-200 pb-6">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-blue-600 font-medium">{event.clubs?.name}</span>
            <span className={`px-2 py-1 rounded text-xs font-bold ${isEventPast ? "bg-gray-100 text-gray-500" : "bg-green-100 text-green-700"}`}>
              {isEventPast ? "종료" : "진행중"}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">{event.title}</h1>
          {event.description && (
            <p className="text-gray-600 mt-2">{event.description}</p>
          )}
          <div className="grid grid-cols-2 gap-4 mt-4 text-sm text-gray-600">
            <div>
              <span className="font-medium">📅 일시: </span>
              {new Date(event.event_date).toLocaleDateString("ko-KR", {
                year: "numeric", month: "long", day: "numeric", weekday: "long",
              })}{" "}
              {new Date(event.event_date).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}
            </div>
            {event.location && (
              <div>
                <span className="font-medium">📍 장소: </span>{event.location}
              </div>
            )}
            <div>
              <span className="font-medium">👤 주최자: </span>
              {event.users?.nickname || event.users?.name}
            </div>
            <div>
              <span className="font-medium">📋 작성일: </span>
              {new Date().toLocaleDateString("ko-KR")}
            </div>
          </div>
        </div>

        {/* 요약 통계 */}
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-3">📊 참여 현황 요약</h2>
          <div className="grid grid-cols-4 gap-3">
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{attendance.length}</div>
              <div className="text-xs text-gray-500 mt-1">전체 응답</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{attending.length}</div>
              <div className="text-xs text-gray-500 mt-1">✅ 참석</div>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">{maybe.length}</div>
              <div className="text-xs text-gray-500 mt-1">🤔 고민중</div>
            </div>
            <div className="bg-red-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-red-500">{notAttending.length}</div>
              <div className="text-xs text-gray-500 mt-1">❌ 불참</div>
            </div>
          </div>
          {attendance.length > 0 && (
            <div className="mt-3">
              <div className="flex justify-between text-sm text-gray-500 mb-1">
                <span>참석률</span>
                <span className="font-medium text-green-600">{attendanceRate}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: `${attendanceRate}%` }} />
              </div>
            </div>
          )}
        </div>

        {/* 참석자 명단 */}
        {attending.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-3">✅ 참석자 명단 ({attending.length}명)</h2>
            <div className="grid grid-cols-3 gap-2">
              {attending.map((a, i) => (
                <div key={i} className="flex items-center gap-2 bg-green-50 rounded-lg px-3 py-2">
                  <span className="w-6 h-6 bg-green-200 rounded-full flex items-center justify-center text-xs font-bold text-green-700">
                    {i + 1}
                  </span>
                  <span className="text-sm font-medium text-gray-800 truncate">
                    {a.users?.nickname || a.users?.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 고민중 명단 */}
        {maybe.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-3">🤔 고민중 ({maybe.length}명)</h2>
            <div className="grid grid-cols-3 gap-2">
              {maybe.map((a, i) => (
                <div key={i} className="flex items-center gap-2 bg-yellow-50 rounded-lg px-3 py-2">
                  <span className="text-sm font-medium text-gray-700 truncate">
                    {a.users?.nickname || a.users?.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 불참 명단 */}
        {notAttending.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-3">❌ 불참 ({notAttending.length}명)</h2>
            <div className="grid grid-cols-3 gap-2">
              {notAttending.map((a, i) => (
                <div key={i} className="flex items-center gap-2 bg-red-50 rounded-lg px-3 py-2">
                  <span className="text-sm font-medium text-gray-700 truncate">
                    {a.users?.nickname || a.users?.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {attendance.length === 0 && (
          <div className="text-center py-8 text-gray-400">응답한 참여자가 없습니다</div>
        )}

        <div className="text-xs text-gray-300 text-right border-t border-gray-100 pt-4">
          {event.clubs?.name} · {new Date().toLocaleDateString("ko-KR")} 출력
        </div>
      </div>
    </div>
  );
}
