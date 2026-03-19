import { supabase } from "@/lib/supabase";
import UserActions from "./UserActions";

// 캐싱 비활성화
export const dynamic = "force-dynamic";
export const revalidate = 0;

async function getUsers() {
  const { data } = await supabase
    .from("users")
    .select("id, email, name, nickname, role, phone, created_at")
    .order("created_at", { ascending: false });
  return data || [];
}

export default async function AdminUsersPage() {
  const users = await getUsers();

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">👥 사용자 관리</h2>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left py-3 px-4 font-semibold">이름</th>
              <th className="text-left py-3 px-4 font-semibold">닉네임</th>
              <th className="text-left py-3 px-4 font-semibold">이메일</th>
              <th className="text-left py-3 px-4 font-semibold">전화</th>
              <th className="text-left py-3 px-4 font-semibold">권한</th>
              <th className="text-left py-3 px-4 font-semibold">가입일</th>
              <th className="text-left py-3 px-4 font-semibold">관리</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user: any) => (
              <tr key={user.id} className="border-b hover:bg-gray-50">
                <td className="py-3 px-4">{user.name}</td>
                <td className="py-3 px-4">{user.nickname || "-"}</td>
                <td className="py-3 px-4 text-gray-600">{user.email}</td>
                <td className="py-3 px-4 text-gray-600">{user.phone || "-"}</td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    user.role === "admin" 
                      ? "bg-red-100 text-red-700" 
                      : "bg-gray-100 text-gray-700"
                  }`}>
                    {user.role === "admin" ? "관리자" : "회원"}
                  </span>
                </td>
                <td className="py-3 px-4 text-gray-500">
                  {new Date(user.created_at).toLocaleDateString("ko-KR")}
                </td>
                <td className="py-3 px-4">
                  <UserActions userId={user.id} currentRole={user.role} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
