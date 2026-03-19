"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";

interface PhotoActionsProps {
  photoId: string;
  authorId: string;
}

export default function PhotoActions({ photoId, authorId }: PhotoActionsProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
  }, []);

  const handleDelete = async () => {
    if (!user) return;
    
    setDeleting(true);
    try {
      // 먼저 이미지 URL에서 파일 경로 추출
      const { data: photo } = await supabase
        .from("photo_posts")
        .select("image_url")
        .eq("id", photoId)
        .single();

      // DB에서 삭제
      const { error } = await supabase
        .from("photo_posts")
        .delete()
        .eq("id", photoId);

      if (error) throw error;

      // Storage에서 이미지 삭제 (선택적)
      if (photo?.image_url) {
        const urlParts = photo.image_url.split('/');
        const fileName = urlParts.slice(-2).join('/'); // userId/filename.ext
        await supabase.storage.from('photos').remove([fileName]);
      }

      router.push("/photos");
      router.refresh();
    } catch (error: any) {
      console.error("Error deleting photo:", error);
      alert(`삭제에 실패했습니다: ${error.message || "알 수 없는 오류"}`);
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  // 작성자가 아니면 아무것도 표시하지 않음
  if (!user || user.id !== authorId) {
    return null;
  }

  return (
    <div className="flex gap-2">
      {!showDeleteConfirm ? (
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-medium"
        >
          삭제
        </button>
      ) : (
        <div className="flex gap-2 items-center">
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
  );
}
