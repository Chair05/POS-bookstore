import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function LogIn() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();
    if (!username || !password) return alert("Please fill in all fields.");

    fetch("http://localhost:5000/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          localStorage.setItem("user", JSON.stringify({ name: data.name }));
          window.location.href = "/dashboard";
        } else {
          alert(data.message);
        }
      })
      .catch((err) => {
        console.error(err);
        alert("Server error. Try again later.");
      });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f3f4f6]">
      <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-[0_18px_45px_rgba(15,23,42,0.12)] px-10 py-9 w-full max-w-md border border-gray-100">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-500 via-blue-500 to-purple-500 flex items-center justify-center text-white text-lg font-semibold shadow-sm">
            🔑
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              Admin Login
            </h1>
            <p className="text-xs text-gray-500">
              Sign in to access the bookstore dashboard.
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#2563eb] focus:border-[#2563eb] placeholder:text-gray-400 bg-gray-50"
              placeholder="Enter username"
            />
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#2563eb] focus:border-[#2563eb] placeholder:text-gray-400 bg-gray-50"
              placeholder="Enter password"
            />
          </div>

          {/* Primary button – same style as StartPage / SignIn */}
          <button
            type="submit"
            className="w-full mt-2 py-2.5 rounded-full bg-gradient-to-r from-[#2563eb] to-[#1d4ed8] text-white text-sm font-semibold shadow-[0_8px_20px_rgba(37,99,235,0.45)] hover:brightness-105 active:scale-[0.98] transition"
          >
            Log In
          </button>
        </form>

        {/* Links */}
        <div className="mt-5 flex flex-col items-center gap-2">
          <button
            onClick={() => navigate("/")}
            className="text-sm text-[#2563eb] hover:text-[#1d4ed8] hover:underline transition"
          >
            ← Back to Home
          </button>
          <button
            onClick={() => navigate("/signin")}
            className="text-sm text-emerald-600 hover:text-emerald-700 hover:underline transition"
          >
            ➕ Create Admin Account
          </button>
        </div>
      </div>
    </div>
  );
}
