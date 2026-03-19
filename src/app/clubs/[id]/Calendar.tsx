"use client";

import { useState } from "react";
import Link from "next/link";

interface Event {
  id: string;
  title: string;
  event_date: string;
}

interface CalendarProps {
  events: Event[];
  clubId: string;
}

export default function Calendar({ events, clubId }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  // 월의 첫 날과 마지막 날
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  
  // 첫 날의 요일 (0: 일요일)
  const firstDayOfWeek = firstDay.getDay();
  
  // 월의 총 일수
  const daysInMonth = lastDay.getDate();
  
  // 이전 월의 마지막 날들
  const prevMonthDays = new Date(year, month, 0).getDate();
  
  // 모임이 있는 날짜 매핑
  const eventsByDate: Record<string, Event[]> = {};
  events.forEach((event) => {
    const date = new Date(event.event_date);
    const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    if (!eventsByDate[key]) {
      eventsByDate[key] = [];
    }
    eventsByDate[key].push(event);
  });
  
  // 달력 그리드 생성
  const days: { date: Date; isCurrentMonth: boolean; events: Event[] }[] = [];
  
  // 이전 월의 날들
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const date = new Date(year, month - 1, prevMonthDays - i);
    const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    days.push({
      date,
      isCurrentMonth: false,
      events: eventsByDate[key] || [],
    });
  }
  
  // 현재 월의 날들
  for (let i = 1; i <= daysInMonth; i++) {
    const date = new Date(year, month, i);
    const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    days.push({
      date,
      isCurrentMonth: true,
      events: eventsByDate[key] || [],
    });
  }
  
  // 다음 월의 날들 (6주 완성)
  const remainingDays = 42 - days.length;
  for (let i = 1; i <= remainingDays; i++) {
    const date = new Date(year, month + 1, i);
    const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    days.push({
      date,
      isCurrentMonth: false,
      events: eventsByDate[key] || [],
    });
  }
  
  const weekDays = ["일", "월", "화", "수", "목", "금", "토"];
  const monthNames = [
    "1월", "2월", "3월", "4월", "5월", "6월",
    "7월", "8월", "9월", "10월", "11월", "12월"
  ];
  
  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };
  
  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };
  
  const today = new Date();
  const isToday = (date: Date) => {
    return date.toDateString() === today.toDateString();
  };

  return (
    <div className="bg-white rounded-xl shadow p-4">
      {/* 헤더 */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-gray-900">📅 모임 일정</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={prevMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            ◀
          </button>
          <span className="font-bold text-gray-900 min-w-[80px] text-center">
            {year}년 {monthNames[month]}
          </span>
          <button
            onClick={nextMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            ▶
          </button>
        </div>
      </div>
      
      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((day, i) => (
          <div
            key={day}
            className={`text-center text-xs font-medium py-2 ${
              i === 0 ? "text-red-500" : i === 6 ? "text-blue-500" : "text-gray-500"
            }`}
          >
            {day}
          </div>
        ))}
      </div>
      
      {/* 달력 그리드 */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, index) => (
          <div
            key={index}
            className={`min-h-[60px] p-1 border rounded-lg ${
              day.isCurrentMonth
                ? "bg-white border-gray-200"
                : "bg-gray-50 border-gray-100"
            } ${isToday(day.date) ? "ring-2 ring-blue-500" : ""}`}
          >
            <div
              className={`text-xs font-medium mb-1 ${
                !day.isCurrentMonth
                  ? "text-gray-400"
                  : day.date.getDay() === 0
                  ? "text-red-500"
                  : day.date.getDay() === 6
                  ? "text-blue-500"
                  : "text-gray-700"
              } ${isToday(day.date) ? "bg-blue-500 text-white rounded px-1" : ""}`}
            >
              {day.date.getDate()}
            </div>
            
            {/* 모임 표시 */}
            <div className="space-y-0.5">
              {day.events.slice(0, 2).map((event) => (
                <Link
                  key={event.id}
                  href={`/events/${event.id}`}
                  className="block text-[10px] bg-green-100 text-green-700 rounded px-1 truncate hover:bg-green-200 transition-colors"
                  title={event.title}
                >
                  {event.title}
                </Link>
              ))}
              {day.events.length > 2 && (
                <div className="text-[9px] text-gray-500 text-center">
                  +{day.events.length - 2}개
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {/* 새 모임 버튼 */}
      <div className="mt-4 text-center">
        <Link
          href={`/events/new?club=${clubId}`}
          className="text-sm text-blue-600 hover:underline"
        >
          + 새 모임 추가
        </Link>
      </div>
    </div>
  );
}
