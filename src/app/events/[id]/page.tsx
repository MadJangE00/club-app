import { supabase } from "@/lib/supabase";
import { notFound } from "next/navigation";
import Link from "next/link";
import AttendButton from "./AttendButton";
import EventActions from "./EventActions";

// ISR: 30초마다 재생성
export const revalidate = 30;

async function getEvent(id: string) {
  const { data } = await supabase
    .from("events")
    .select(`
      *,
      clubs (
        id,
        name
      ),
      users (
        name,
        nickname
      )
    `)
    .eq("id", id)
    .single();
  
  return data as any;
}

async function getAttendance(eventId: string) {
  const { data } = await supabase
    .from("attendance")
    .select(`
      id,
      status,
      attended_at,
      users (
        name,
        nickname
      )
    `)
    .eq("event_id", eventId);
  
  return (data || []) as any[];
}

export default async function EventDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params;
  const event = await getEvent(id);
  
  if (!event) {
    notFound();
  }

  const attendance = await getAttendance(id);
  
  const attending = attendance.filter((a) => a.status === "attending");
  const maybe = attendance.filter((a) => a.status === "maybe");
  const notAttending = attendance.filter((a) => a.status === "not_attending");

  return (
    <div className="space-y-6">
      {/* 모임 헤더 */}
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="flex justify-between items-start">
          <div>
            <Link 
              href={`/clubs/${event.clubs?.id}`}
              className="text-blue-600 hover:underline font-medium"
            >
              {event.clubs?.name}
            </Link>
            <h2 className="text-3xl font-bold text-gray-900 mt-2">{event.title}</h2>
            {event.description && (
              <p className="text-gray-700 mt-3 text-lg">{event.description}</p>
            )}
          </div>
          <div className="flex gap-2 items-center">
            <AttendButton 
              eventId={id} 
              clubId={event.club_id}
              maxParticipants={event.max_participants}
              currentCount={attending.length}
            />
            <EventActions 
              eventId={id} 
              createdBy={event.created_by}
              clubId={event.club_id}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-8 border-t border-gray-200">
          <div>
            <div className="text-sm text-gray-500">일시</div>
            <div className="font-medium text-gray-900">
              {new Date(event.event_date).toLocaleDateString("ko-KR", {
                year: "numeric",
                month: "long",
                day: "numeric",
                weekday: "long",
              })}
            </div>
            <div className="text-gray-700">
              {new Date(event.event_date).toLocaleTimeString("ko-KR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </div>
          
          {event.location && (
            <div>
              <div className="text-sm text-gray-500">장소</div>
              <div className="font-medium text-gray-900">📍 {event.location}</div>
            </div>
          )}
          
          {event.max_participants && (
            <div>
              <div className="text-sm text-gray-500">인원 제한</div>
              <div className="font-medium text-gray-900">
                👥 {attending.length} / {event.max_participants}명
              </div>
            </div>
          )}
          
          <div>
            <div className="text-sm text-gray-500">주최자</div>
            <div className="font-medium text-gray-900">
              {event.users?.nickname || event.users?.name || "사용자"}
            </div>
          </div>
        </div>
      </div>

      {/* 참석 현황 */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* 참석 */}
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            ✅ 참석 ({attending.length})
          </h3>
          {attending.length > 0 ? (
            <div className="space-y-2">
              {attending.map((a) => (
                <div key={a.id} className="flex items-center gap-2 p-2 bg-green-50 rounded-lg">
                  <span className="w-8 h-8 bg-green-200 rounded-full flex items-center justify-center text-sm font-medium text-green-800">
                    {(a.users?.nickname || a.users?.name || "U")[0]}
                  </span>
                  <span className="font-medium text-gray-900">
                    {a.users?.nickname || a.users?.name || "사용자"}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">아직 없습니다</p>
          )}
        </div>

        {/* 고민중 */}
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            🤔 고민중 ({maybe.length})
          </h3>
          {maybe.length > 0 ? (
            <div className="space-y-2">
              {maybe.map((a) => (
                <div key={a.id} className="flex items-center gap-2 p-2 bg-yellow-50 rounded-lg">
                  <span className="w-8 h-8 bg-yellow-200 rounded-full flex items-center justify-center text-sm font-medium text-yellow-800">
                    {(a.users?.nickname || a.users?.name || "U")[0]}
                  </span>
                  <span className="font-medium text-gray-900">
                    {a.users?.nickname || a.users?.name || "사용자"}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">아직 없습니다</p>
          )}
        </div>

        {/* 불참 */}
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            ❌ 불참 ({notAttending.length})
          </h3>
          {notAttending.length > 0 ? (
            <div className="space-y-2">
              {notAttending.map((a) => (
                <div key={a.id} className="flex items-center gap-2 p-2 bg-red-50 rounded-lg">
                  <span className="w-8 h-8 bg-red-200 rounded-full flex items-center justify-center text-sm font-medium text-red-800">
                    {(a.users?.nickname || a.users?.name || "U")[0]}
                  </span>
                  <span className="font-medium text-gray-900">
                    {a.users?.nickname || a.users?.name || "사용자"}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">아직 없습니다</p>
          )}
        </div>
      </div>
    </div>
  );
}
