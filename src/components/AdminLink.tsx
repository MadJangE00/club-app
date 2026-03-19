"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AdminLink() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    async function checkAdmin() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();

      setIsAdmin(data?.role === "admin");
    }

    checkAdmin();
  }, []);

  if (!isAdmin) return null;

  return (
    <a href="/admin" className="text-red-600 hover:text-red-800 font-bold">
      🔧 관리자
    </a>
  );
}
