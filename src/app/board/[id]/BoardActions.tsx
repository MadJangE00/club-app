"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function BoardActions({ postId, authorId }: { postId: string; authorId: string }) {
  const router = useRouter();
  const [canEdit, setCanEdit] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user && user.id === authorId) setCanEdit(true);
    });
  }, [authorId]);

  if (!canEdit) return null;

  const handleDelete = async () => {
    if (!confirm("삭제하시겠습니까?")) return;
    const { error } = await supabase.from("board_posts").delete().eq("id", postId);
    if (error) { alert("삭제 실패"); return; }
    router.push("/board");
  };

  return (
    <button
      onClick={handleDelete}
      className="text-sm text-red-500 hover:text-red-700 font-medium shrink-0"
    >
      삭제
    </button>
  );
}
