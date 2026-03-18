"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalAttendance: 0,
    attendingCount: 0,
    maybeCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push("/login");
        return;
      }
      
      setUser(user);

      // 프로필 정보 가져오기
      const { data: profileData } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileData) {
        setProfile(profileData);
      } else {
        // 프로필이 없으면 생성
        const userName = (user.user_metadata?.name as string) || "사용자";
        const newProfile = {
          id: user.id,
          email: user.email || "",
          name: userName,
          nickname: userName,
        };
        const { data } = await supabase.from("users").insert(newProfile).select().single();
        setProfile(data);
      }

      // 출석 현황 가져오기
      const { data: attendanceData } = await supabase
        .from("attendance")
        .select(`
          id,
          event_id,
          status,
          attended_at,
          events (
            title,
            event_date,
            clubs (
              name
            )
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (attendanceData) {
        setAttendance(attendanceData as any[]);
        setStats({
          totalAttendance: attendanceData.length,
          attendingCount: attendanceData.filter((a: any) => a.status === "attending").length,
          maybeCount: attendanceData.filter((a: any) => a.status === "maybe").length,
        });
      }

      setLoading(false);
    }

    loadProfile();
  }, [router]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto text-center py-20">
        <div className="text-xl text-gray-700">로딩 중...</div>
      </div>
    );
  }

  if (!user || !profile) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 프로필 카드 */}
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-3xl font-bold">
              {(profile.nickname || profile.name || "U")[0].toUpperCase()}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {profile.nickname || profile.name}
              </h2>
              {profile.nickname && (
                <p className="text-gray-600">@{profile.name}</p>
              )}
              <p className="text-gray-500 text-sm mt-1">{profile.email}</p>
              {profile.phone && (
                <p className="text-gray-500 text-sm">📱 {profile.phone}</p>
              )}
            </div>
          </div>
          <button
            onClick={() => router.push("/profile/edit")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            프로필 수정
          </button>
        </div>

        {/* 포인트 & 통계 */}
        <div className="grid grid-cols-4 gap-4 mt-8 pt-8 border-t border-gray-200">
          <div className="text-center">
            <div className="text-3xl font-bold text-yellow-500">⭐</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">{profile.points || 0}</div>
            <div className="text-gray-600 text-sm">포인트</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-500">📋</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">{stats.totalAttendance}</div>
            <div className="text-gray-600 text-sm">전체 출석</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-500">✅</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">{stats.attendingCount}</div>
            <div className="text-gray-600 text-sm">참석 확정</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-500">🤔</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">{stats.maybeCount}</div>
            <div className="text-gray-600 text-sm">참석 고민중</div>
          </div>
        </div>
      </div>

      {/* 가입 정보 */}
      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">📅 가입 정보</h3>
        <div className="text-gray-700">
          가입일: {new Date(profile.created_at).toLocaleDateString("ko-KR", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </div>
      </div>

      {/* 출석 현황 */}
      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">📝 출석 현황</h3>
        
        {attendance.length > 0 ? (
          <div className="space-y-3">
            {attendance.map((record: any) => (
              <div
                key={record.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div>
                  <div className="font-medium text-gray-900">
                    {record.events?.title}
                  </div>
                  <div className="text-sm text-gray-600">
                    {record.events?.clubs?.name} • {new Date(record.events?.event_date).toLocaleDateString("ko-KR")}
                  </div>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    record.status === "attending"
                      ? "bg-green-100 text-green-800"
                      : record.status === "not_attending"
                      ? "bg-red-100 text-red-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {record.status === "attending"
                    ? "참석 ✅"
                    : record.status === "not_attending"
                    ? "불참 ❌"
                    : "고민중 🤔"}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-600">
            아직 출석 기록이 없습니다. 모임에 참여해보세요!
          </div>
        )}
      </div>
    </div>
  );
}
