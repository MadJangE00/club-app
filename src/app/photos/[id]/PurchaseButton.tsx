"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";

interface Props {
  photoId: string;
  price: number;
  sellerId: string;
}

export default function PurchaseButton({ photoId, price, sellerId }: Props) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [purchased, setPurchased] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function check() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUser(user);
      if (user.id === sellerId) { setPurchased(true); return; }
      const { data } = await supabase
        .from("photo_purchases")
        .select("id")
        .eq("photo_id", photoId)
        .eq("buyer_id", user.id)
        .single();
      setPurchased(!!data);
    }
    check();
  }, [photoId, sellerId]);

  const handlePurchase = async () => {
    if (!user) { router.push("/login"); return; }
    setLoading(true);
    try {
      const { data } = await supabase.rpc("purchase_photo", { p_photo_id: photoId });
      if (!data?.success) { alert(data?.message || "구매 실패"); return; }
      setPurchased(true);
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <button onClick={() => router.push("/login")}
        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium text-sm">
        로그인하고 구매하기
      </button>
    );
  }

  if (purchased) {
    return (
      <span className="px-4 py-2 bg-green-100 text-green-700 rounded-lg font-medium text-sm">
        ✅ {user.id === sellerId ? "내 게시물" : "구매완료"}
      </span>
    );
  }

  return (
    <button
      onClick={handlePurchase}
      disabled={loading}
      className="px-4 py-2 bg-pink-600 text-white rounded-lg font-medium text-sm hover:bg-pink-700 disabled:opacity-50 transition-colors"
    >
      {loading ? "처리 중..." : `🛒 구매 (${price}P)`}
    </button>
  );
}
