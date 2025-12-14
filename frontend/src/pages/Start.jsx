import React from "react";
import { useNavigate } from "react-router-dom";

export default function StartPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f3f4f6]">
      <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-[0_18px_45px_rgba(15,23,42,0.12)] px-12 py-10 w-full max-w-md text-center border border-gray-100">
        {/* Logo + Title */}
        <div className="flex items-center justify-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-500 via-blue-500 to-purple-500 flex items-center justify-center text-white text-lg font-semibold shadow-sm">
            📚
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Bookstore POS
          </h1>
        </div>

        {/* Subtitle */}
        <p className="text-sm text-gray-500 mb-8">
          Welcome to your bookstore register system.
        </p>

        {/* Buttons */}
        <div className="space-y-4">
          <button
            onClick={() => navigate("/signin")}
            className="w-full py-2.5 rounded-full bg-gradient-to-r from-[#2563eb] to-[#1d4ed8] text-white text-sm font-medium shadow-[0_8px_20px_rgba(37,99,235,0.45)] hover:brightness-105 active:scale-[0.98] transition"
          >
            Sign In
          </button>

          <button
            onClick={() => navigate("/login")}
            className="w-full py-2.5 rounded-full border border-[#cbd5f5] text-[#2563eb] text-sm font-medium bg-white hover:bg-[#f3f6ff] active:scale-[0.98] transition shadow-[0_0_0_1px_rgba(148,163,184,0.15)]"
          >
            Log In
          </button>
        </div>
      </div>
    </div>
  );
}
