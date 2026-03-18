import { supabase } from "@/lib/supabase";
import Link from "next/link";

async function getEvents() {
  const { data } = await supabase
    .from("events")
    .select(`
      id,
      title,
      event_date,
      location,
      max_participants,
      created_at,
      clubs (
        id,
        name
      )
    `)
    .order("event_date", { ascending: true });
  return data || [];
}

async function getAttendanceCount(eventIds: string[]) {
  if (eventIds.length === 0) return {};
  
  const { data } = await supabase
    .from("attendance")
    .select("event_id, status")
    .in("event_id", eventIds)
    .eq("status", "attending");

  const counts: Record<string, number> = {};
  data?.forEach((a) => {
    counts[a.event_id] = (counts[a.event_id] || 0) + 1;
  });
  
  return counts;
}

export default async function EventsPage() {
  const events = await getEvents();
  const eventIds = events.map((e) => e.id);
  const attendanceCounts = await getAttendanceCount(eventIds);

  const now = new Date();
  const upcomingEvents = events.filter((e) => new Date(e.event_date) >= now);
  const pastEvents = events.filter((e) => new Date(e.event_date) < now);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">📅 모임 목록</h2>
        <Link
          href="/events/new"
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
        >
          + 새 모임
        </Link>
      </div>

      {/* 다가오는 모임 */}
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-4">다가오는 모임</h3>
        {upcomingEvents.length > 0 ? (
          <div className="space-y-4">
            {upcomingEvents.map((event) => (
              <Link
                key={event.id}
                href={`/events/${event.id}`}
                className="block bg-white rounded-xl shadow p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-sm text-green-600 font-medium">
                      {event.clubs?.name || "동호회"}
                    </span>
                    <h4 className="text-xl font-bold text-gray-900 mt-1">
                      {event.title}
                    </h4>
                  </div>
                  <span className="px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                    {new Date(event.event_date).toLocaleDateString("ko-KR", {
                      month: "long",
                      day: "numeric",
                      weekday: "short",
                    })}
                    {" "}
                    {new Date(event.event_date).toLocaleTimeString("ko-KR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>

                <div className="flex gap-4 mt-4 text-sm text-gray-600">
                  {event.location && (
                    <span>📍 {event.location}</span>
                  )}
                  <span>
                    👥 {attendanceCounts[event.id] || 0}명 참석
                    {event.max_participants && ` / ${event.max_participants}명 제한`}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow p-8 text-center">
            <p className="text-gray-600">다가오는 모임이 없습니다</p>
          </div>
        )}
      </div>

      {/* 지난 모임 */}
      {pastEvents.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-gray-500 mb-4">지난 모임</h3>
          <div className="space-y-3">
            {pastEvents.map((event) => (
              <Link
                key={event.id}
                href={`/events/${event.id}`}
                className="block bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-sm text-gray-500">{event.clubs?.name}</span>
                    <h4 className="font-medium text-gray-700">{event.title}</h4>
                  </div>
                  <span className="text-sm text-gray-500">
                    {new Date(event.event_date).toLocaleDateString("ko-KR")}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
