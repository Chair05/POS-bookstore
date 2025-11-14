import React from "react";
import { useNavigate } from "react-router-dom";

export default function StartPage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-100 to-blue-300">
      <div className="bg-white shadow-xl rounded-2xl p-10 text-center w-[350px]">
        <h1 className="text-3xl font-bold text-blue-700 mb-6">📚 Bookstore POS</h1>
        <p className="text-gray-600 mb-8">
          Welcome to your bookstore register system.
        </p>

        <div className="space-y-4">
          <button
            onClick={() => navigate("/signin")}
            className="w-full bg-blue-600 text-white py-2 rounded-xl hover:bg-blue-700 transition"
          >
            Sign In
          </button>
          <button
            onClick={() => navigate("/login")}
            className="w-full bg-gray-100 text-blue-700 border border-blue-600 py-2 rounded-xl hover:bg-blue-50 transition"
          >
            Log In
          </button>
        </div>
      </div>
    </div>
  );
}
