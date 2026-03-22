"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

interface Settings {
  signup_enabled: boolean;
  club_creation_enabled: boolean;
}

export default function SettingsClient() {
  const [settings, setSettings] = useState<Settings>({
    signup_enabled: true,
    club_creation_enabled: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("site_settings")
        .select("signup_enabled, club_creation_enabled")
        .eq("id", 1)
        .single();

      if (error) throw error;

      if (data) {
        setSettings({
          signup_enabled: data.signup_enabled ?? true,
          club_creation_enabled: data.club_creation_enabled ?? true,
        });
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (key: keyof Settings, value: boolean) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("site_settings")
        .update({ [key]: value })
        .eq("id", 1);

      if (error) throw error;

      setSettings((prev) => ({ ...prev, [key]: value }));
    } catch (error) {
      console.error("Error updating setting:", error);
      alert("설정 저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow p-6">
        <p className="text-gray-500">설정 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <h2 className="text-lg font-bold text-gray-900 mb-6">⚙️ 서비스 설정</h2>
      
      <div className="space-y-6">
        {/* 회원가입 설정 */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <div className="font-semibold text-gray-900">회원가입 허용</div>
            <div className="text-sm text-gray-500 mt-1">
              비활성화하면 새로운 회원가입이 차단됩니다.
            </div>
          </div>
          <button
            onClick={() => updateSetting("signup_enabled", !settings.signup_enabled)}
            disabled={saving}
            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
              settings.signup_enabled ? "bg-green-500" : "bg-gray-300"
            } ${saving ? "opacity-50" : ""}`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                settings.signup_enabled ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        {/* 동호회 개설 설정 */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <div className="font-semibold text-gray-900">동호회 개설 허용</div>
            <div className="text-sm text-gray-500 mt-1">
              비활성화하면 새로운 동호회 개설이 차단됩니다.
            </div>
          </div>
          <button
            onClick={() => updateSetting("club_creation_enabled", !settings.club_creation_enabled)}
            disabled={saving}
            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
              settings.club_creation_enabled ? "bg-green-500" : "bg-gray-300"
            } ${saving ? "opacity-50" : ""}`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                settings.club_creation_enabled ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </div>

      {/* 현재 상태 요약 */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <div className="text-sm font-medium text-blue-800 mb-2">현재 상태</div>
        <div className="flex gap-4">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            settings.signup_enabled 
              ? "bg-green-100 text-green-700" 
              : "bg-red-100 text-red-700"
          }`}>
            회원가입: {settings.signup_enabled ? "허용" : "차단"}
          </span>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            settings.club_creation_enabled 
              ? "bg-green-100 text-green-700" 
              : "bg-red-100 text-red-700"
          }`}>
            동호회 개설: {settings.club_creation_enabled ? "허용" : "차단"}
          </span>
        </div>
      </div>
    </div>
  );
}
