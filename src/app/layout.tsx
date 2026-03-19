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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-100`}
      >
        <nav className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
            <h1 className="text-xl font-bold text-gray-900">🎯 동호회 관리</h1>
            <div className="flex items-center gap-6 text-sm font-medium">
              <a href="/" className="text-gray-700 hover:text-black">홈</a>
              <a href="/clubs" className="text-gray-700 hover:text-black">동호회</a>
              <a href="/events" className="text-gray-700 hover:text-black">모임</a>
              <a href="/posts" className="text-gray-700 hover:text-black">게시판</a>
              <AdminLink />
              <AuthButton />
            </div>
          </div>
        </nav>
        <main className="max-w-6xl mx-auto px-4 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
