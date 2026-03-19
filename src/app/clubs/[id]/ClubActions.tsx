"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";

interface ClubActionsProps {
  clubId: string;
  ownerId: string;
}

interface Member {
  user_id: string;
  users: {
    name: string;
    nickname: string;
  } | null;
}

export default function ClubActions({ clubId, ownerId }: ClubActionsProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMember, setSelectedMember] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
  }, []);

  const loadMembers = async () => {
    const { data } = await supabase
      .from("club_members")
      .select(`
        user_id,
        joined_at,
        users (
          name,
          nickname
        )
      `)
      .eq("club_id", clubId)
      .neq("user_id", ownerId)
      .order("joined_at", { ascending: true });
    
    if (data) {
      const memberList = data.map((m: any) => ({
        user_id: m.user_id,
        users: Array.isArray(m.users) ? m.users[0] : m.users
      }));
      setMembers(memberList);
      if (memberList.length > 0) {
        setSelectedMember(memberList[0].user_id);
      }
    }
  };

  const handleTransfer = async () => {
    if (!selectedMember) return;
    
    setLoading(true);
    try {
      // 동호회 소유자 변경
      const { error: clubError } = await supabase
        .from("clubs")
        .update({ owner_id: selectedMember })
        .eq("id", clubId);

      if (clubError) {
        console.error("Club update error:", clubError);
        throw clubError;
      }

      // 새 소유자의 role을 owner로 변경
      const { error: newOwnerError } = await supabase
        .from("club_members")
        .update({ role: "owner" })
        .eq("club_id", clubId)
        .eq("user_id", selectedMember);

      if (newOwnerError) {
        console.error("New owner update error:", newOwnerError);
        throw newOwnerError;
      }

      // 기존 소유자의 role을 member로 변경
      const { error: oldOwnerError } = await supabase
        .from("club_members")
        .update({ role: "member" })
        .eq("club_id", clubId)
        .eq("user_id", ownerId);

      if (oldOwnerError) {
        console.error("Old owner update error:", oldOwnerError);
        throw oldOwnerError;
      }

      setShowTransferModal(false);
      router.refresh();
    } catch (error: any) {
      console.error("Error transferring ownership:", error);
      alert(`위임에 실패했습니다: ${error?.message || JSON.stringify(error) || "알 수 없는 오류"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!user) return;
    
    setDeleting(true);
    try {
      const { error } = await supabase
        .from("clubs")
        .delete()
        .eq("id", clubId);

      if (error) throw error;

      router.push("/clubs");
      router.refresh();
    } catch (error: any) {
      console.error("Error deleting club:", error);
      alert(`삭제에 실패했습니다: ${error.message || "알 수 없는 오류"}`);
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  // 소유자가 아니면 아무것도 표시하지 않음
  if (!user || user.id !== ownerId) {
    return null;
  }

  return (
    <>
      <div className="flex gap-2 items-center">
        <span className="px-3 py-1.5 text-sm bg-yellow-100 text-yellow-800 rounded-lg font-medium">
          👑 동호회장
        </span>
        
        <button
          onClick={() => {
            loadMembers();
            setShowTransferModal(true);
          }}
          className="px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors font-medium"
        >
          회장 위임
        </button>
        
        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-medium"
          >
            동호회 삭제
          </button>
        ) : (
          <div className="flex gap-2 items-center">
            <span className="text-sm text-red-600 font-medium">정말 삭제?</span>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50"
            >
              {deleting ? "삭제 중..." : "확인"}
            </button>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="px-3 py-1.5 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              취소
            </button>
          </div>
        )}
      </div>

      {/* 회장 위임 모달 */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">👑 회장 위임</h3>
            <p className="text-gray-600 mb-4">
              새로운 회장을 선택하세요:
            </p>
            
            {members.length > 0 ? (
              <>
                <select
                  value={selectedMember}
                  onChange={(e) => setSelectedMember(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg mb-4"
                >
                  {members.map((member) => (
                    <option key={member.user_id} value={member.user_id}>
                      {member.users?.nickname || member.users?.name}
                    </option>
                  ))}
                </select>

                <div className="flex gap-3">
                  <button
                    onClick={handleTransfer}
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
                  >
                    {loading ? "위임 중..." : "위임하기"}
                  </button>
                  <button
                    onClick={() => setShowTransferModal(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
                  >
                    취소
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-yellow-600 mb-4">
                  위임할 회원이 없습니다. 다른 회원이 가입한 후에 위임할 수 있습니다.
                </p>
                <button
                  onClick={() => setShowTransferModal(false)}
                  className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
                >
                  닫기
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
