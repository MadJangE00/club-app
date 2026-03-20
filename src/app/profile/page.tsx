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
  const [dailyAttendance, setDailyAttendance] = useState<any[]>([]);
  const [purchasedImages, setPurchasedImages] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalAttendance: 0,
    attendingCount: 0,
    maybeCount: 0,
    consecutiveDays: 0,
    todayChecked: false,
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
          consecutiveDays: 0,
          todayChecked: false,
        });
      }

      // 일일 출석 현황 가져오기
      const { data: dailyData } = await supabase
        .from("daily_attendance")
        .select("*")
        .eq("user_id", user.id)
        .order("attended_at", { ascending: false })
        .limit(30);

      if (dailyData) {
        setDailyAttendance(dailyData as any[]);
        
        // 오늘 출석 확인
        const now = new Date();
        const koreaTime = new Date(now.getTime() + (9 * 60 * 60 * 1000));
        const today = koreaTime.toISOString().split('T')[0];
        const todayCheck = dailyData.some((d: any) => d.attended_at === today);
        
        // 연속 출석일 계산
        let consecutive = 0;
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        
        for (let i = 0; i < dailyData.length; i++) {
          const [year, month, day] = dailyData[i].attended_at.split('-').map(Number);
          const checkDate = new Date(year, month - 1, day);
          
          const expectedDate = new Date(todayDate);
          expectedDate.setDate(todayDate.getDate() - i);
          
          if (checkDate.getTime() === expectedDate.getTime()) {
            consecutive++;
          } else {
            break;
          }
        }
        
        setStats(prev => ({
          ...prev,
          consecutiveDays: consecutive,
          todayChecked: todayCheck,
        }));
      }

      // Pixel Market에서 구매한 이미지 가져오기
      const { data: imageData } = await supabase
        .from("images")
        .select("*, creator:users!images_creator_id_fkey(*)")
        .eq("owner_id", user.id)
        .order("sold_at", { ascending: false });

      if (imageData) {
        setPurchasedImages(imageData as any[]);
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
            <div className="text-3xl font-bold text-purple-500">🔥</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">{stats.consecutiveDays}</div>
            <div className="text-gray-600 text-sm">연속 출석</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-500">📋</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">{dailyAttendance.length}</div>
            <div className="text-gray-600 text-sm">총 출석일</div>
          </div>
          <div className="text-center">
            <div className="text-3xl">{stats.todayChecked ? "✅" : "⏰"}</div>
            <div className="text-lg font-bold text-gray-900 mt-1">{stats.todayChecked ? "완료" : "미완료"}</div>
            <div className="text-gray-600 text-sm">오늘 출석</div>
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

      {/* 일일 출석 현황 */}
      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">📅 일일 출석 현황</h3>
        
        {dailyAttendance.length > 0 ? (
          <div>
            <div className="grid grid-cols-7 gap-1 mb-4">
              {Array.from({ length: 28 }).map((_, i) => {
                const date = new Date();
                date.setDate(date.getDate() - (27 - i));
                const dateStr = date.toISOString().split('T')[0];
                const attended = dailyAttendance.some((d: any) => d.attended_at === dateStr);
                
                return (
                  <div
                    key={i}
                    className={`aspect-square rounded-sm flex items-center justify-center text-xs ${
                      attended
                        ? "bg-green-500 text-white"
                        : "bg-gray-100 text-gray-400"
                    }`}
                    title={`${date.toLocaleDateString("ko-KR")} ${attended ? "출석" : "미출석"}`}
                  >
                    {date.getDate()}
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>🔥 연속 {stats.consecutiveDays}일 출석 중!</span>
              <span>총 {dailyAttendance.length}일 출석</span>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-600">
            아직 출석 기록이 없습니다. 매일 출석하고 포인트를 모아보세요!
          </div>
        )}
      </div>

      {/* 모임 출석 현황 */}
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

      {/* Pixel Market 갤러리 */}
      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">🎨 내 갤러리</h3>
          <a
            href="https://pixel-market-omega.vercel.app/market"
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-600 hover:text-purple-700 text-sm font-medium"
          >
            마켓 바로가기 →
          </a>
        </div>
        
        {purchasedImages.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {purchasedImages.map((image: any) => (
              <a
                key={image.id}
                href={`https://pixel-market-omega.vercel.app/market/${image.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative aspect-square rounded-lg overflow-hidden bg-gray-100"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image.image_url}
                  alt={image.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition">
                  <div className="absolute bottom-0 left-0 right-0 p-2 text-white">
                    <p className="font-medium text-sm truncate">{image.title}</p>
                    <p className="text-xs text-gray-300">
                      by {image.creator?.nickname || image.creator?.name || "익명"}
                    </p>
                  </div>
                </div>
              </a>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-600">
            <p className="mb-2">아직 구매한 작품이 없습니다</p>
            <a
              href="https://pixel-market-omega.vercel.app/market"
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-600 hover:text-purple-700 text-sm"
            >
              Pixel Market에서 작품 구경하기 →
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
