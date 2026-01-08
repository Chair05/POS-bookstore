import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function LogIn() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();

    if (!username || !password) {
      alert("Please fill in all fields.");
      return;
    }

    fetch("http://localhost:5000/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          // ✅ Save both name AND role in localStorage
          localStorage.setItem(
            "user",
            JSON.stringify({ name: data.name, role: data.role })
          );

          // Redirect to dashboard
          window.location.href = "/dashboard";
        } else {
          alert(data.message);
        }
      })
      .catch(() => {
        alert("Server error. Try again later.");
      });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f3f4f6] px-4">
      <div
        className="
          bg-white/90 backdrop-blur-sm
          rounded-2xl shadow-md border border-gray-100
          w-full max-w-2xl
          px-6 py-8 sm:px-10 sm:py-10
        "
      >
        {/* Header */}
        <div className="flex items-center justify-center gap-4 mb-6 text-center">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 via-blue-500 to-purple-500 flex items-center justify-center text-white text-lg">
            🔑
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              Admin Login
            </h1>
            <p className="text-sm text-gray-500">
              Sign in to access the dashboard
            </p>
          </div>
        </div>

        {/* Login Form */}
        <form
          onSubmit={handleLogin}
          className="space-y-4 max-w-xl mx-auto text-left"
        >
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              className="
                w-full h-11 px-4
                text-sm rounded-lg
                border border-gray-300 bg-gray-50
                focus:outline-none focus:ring-2 focus:ring-blue-600
              "
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
              placeholder="Enter password"
              className="
                w-full h-11 px-4
                text-sm rounded-lg
                border border-gray-300 bg-gray-50
                focus:outline-none focus:ring-2 focus:ring-blue-600
              "
            />
          </div>

          <button
            type="submit"
            className="
              w-full h-11 rounded-full
              bg-gradient-to-r from-blue-600 to-blue-700
              text-white text-sm font-semibold
              shadow hover:brightness-105 active:scale-95 transition
            "
          >
            Log In
          </button>
        </form>

        {/* Links */}
        <div className="mt-6 flex flex-col items-center gap-2 text-sm">
          <button
            onClick={() => navigate("/")}
            className="text-blue-600 hover:underline"
          >
            ← Back to Home
          </button>

          <button
            onClick={() => navigate("/signin")}
            className="text-emerald-600 hover:underline"
          >
            Create Admin Account
          </button>
        </div>
      </div>
    </div>
  );
}
