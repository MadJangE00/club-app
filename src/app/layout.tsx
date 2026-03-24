import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AuthButton from "@/components/AuthButton";
import AdminLink from "@/components/AdminLink";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "동호회 관리 시스템",
  description: "동호회 모임, 출석, 게시판을 관리하세요",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "동호회 관리",
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-100`}
      >
        <nav className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
            <h1 className="text-lg md:text-xl font-bold text-gray-900 shrink-0">🎯 동호회 관리</h1>

            {/* 데스크톱 메뉴 (md 이상) */}
            <div className="hidden md:flex items-center gap-4 lg:gap-6 text-sm font-medium">
              <a href="/" className="text-gray-700 hover:text-black">홈</a>
              <a href="/clubs" className="text-gray-700 hover:text-black">동호회</a>
              <a href="/events" className="text-gray-700 hover:text-black">모임</a>
              <a href="/posts" className="text-gray-700 hover:text-black">게시판</a>
              <a href="/board" className="text-gray-700 hover:text-black">전체게시판</a>
              <a href="/lottery" className="text-gray-700 hover:text-black">복권</a>
              <AdminLink />
              <AuthButton />
            </div>

            {/* 모바일: 인증 버튼만 표시 */}
            <div className="md:hidden flex items-center">
              <AuthButton />
            </div>
          </div>

          {/* 모바일 메뉴 (md 미만) */}
          <div className="md:hidden border-t border-gray-100 px-4 py-2 flex flex-wrap gap-x-4 gap-y-2 text-sm font-medium">
            <a href="/" className="text-gray-700 hover:text-black">홈</a>
            <a href="/clubs" className="text-gray-700 hover:text-black">동호회</a>
            <a href="/events" className="text-gray-700 hover:text-black">모임</a>
            <a href="/posts" className="text-gray-700 hover:text-black">게시판</a>
            <a href="/board" className="text-gray-700 hover:text-black">전체게시판</a>
            <a href="/lottery" className="text-gray-700 hover:text-black">복권</a>
            <AdminLink />
          </div>
        </nav>
        <main className="max-w-6xl mx-auto px-4 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
