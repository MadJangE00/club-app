import AdminGuard from "./AdminGuard";
import Link from "next/link";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminGuard>
      <div className="space-y-6">
        {/* 어드민 네비게이션 */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex flex-wrap gap-4 text-sm font-medium">
            <Link href="/admin" className="text-gray-700 hover:text-red-600">
              📊 대시보드
            </Link>
            <Link href="/admin/users" className="text-gray-700 hover:text-red-600">
              👥 사용자
            </Link>
            <Link href="/admin/clubs" className="text-gray-700 hover:text-red-600">
              🏠 동호회
            </Link>
            <Link href="/admin/posts" className="text-gray-700 hover:text-red-600">
              📝 게시글
            </Link>
            <Link href="/admin/photos" className="text-gray-700 hover:text-red-600">
              📷 사진
            </Link>
          </div>
        </div>
        {children}
      </div>
    </AdminGuard>
  );
}
