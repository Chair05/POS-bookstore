import React from "react";
import { useNavigate } from "react-router-dom";

export default function StartPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f3f4f6] px-4">
      <div className="bg-white/90 backdrop-blur-sm rounded-3xl 
        shadow-[0_30px_80px_rgba(15,23,42,0.25)] 
        px-28 py-20 w-full max-w-3xl text-center border border-gray-100">

        {/* Logo + Title */}
        <div className="flex items-center justify-center gap-8 mb-8">
          <div className="w-20 h-20 rounded-2xl 
            bg-gradient-to-br from-green-500 via-blue-500 to-purple-500 
            flex items-center justify-center 
            text-white text-5xl font-bold shadow-xl">
            📚
          </div>
          <h1 className="text-6xl font-bold text-gray-900">
            Bookstore POS
          </h1>
        </div>

        {/* Subtitle */}
        <p className="text-2xl text-gray-500 mb-14">
          Welcome to your bookstore register system.
        </p>

        {/* Buttons */}
        <div className="space-y-8">
          <button
            onClick={() => navigate("/signin")}
            className="w-full py-7 rounded-full 
              bg-gradient-to-r from-[#2563eb] to-[#1d4ed8] 
              text-white text-3xl font-bold 
              shadow-[0_15px_45px_rgba(37,99,235,0.55)] 
              hover:brightness-105 active:scale-[0.98] transition"
          >
            Sign In
          </button>

          <button
            onClick={() => navigate("/login")}
            className="w-full py-7 rounded-full 
              border border-[#cbd5f5] text-[#2563eb] 
              text-3xl font-bold bg-white 
              hover:bg-[#f3f6ff] active:scale-[0.98] transition 
              shadow-[0_0_0_2px_rgba(148,163,184,0.3)]"
          >
            Log In
          </button>
        </div>
      </div>
    </div>
  );
}
