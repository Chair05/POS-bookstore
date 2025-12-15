import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function SignIn() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSignIn = (e) => {
    e.preventDefault();
    if (!username || !password) return alert("Please fill in all fields.");

    fetch("http://localhost:5000/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          alert("Admin account created successfully!");
          navigate("/login");
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
      <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-[0_18px_50px_rgba(15,23,42,0.15)] px-20 py-16 w-full max-w-3xl text-center border border-gray-100">
        {/* Header */}
        <div className="flex items-center justify-center gap-5 mb-10">
          <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-green-500 via-blue-500 to-purple-500 flex items-center justify-center text-white text-4xl font-bold shadow-sm">
            🔑
          </div>
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Create Admin Account</h1>
            <p className="text-lg text-gray-500">
              Set up your bookstore admin account.
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSignIn} className="space-y-8 text-left">
          <div>
            <label className="block mb-3 text-lg font-medium text-gray-700">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-6 py-5 text-xl rounded-3xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#2563eb] focus:border-[#2563eb] placeholder:text-gray-400 bg-gray-50"
              placeholder="Enter new username"
            />
          </div>

          <div>
            <label className="block mb-3 text-lg font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-6 py-5 text-xl rounded-3xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#2563eb] focus:border-[#2563eb] placeholder:text-gray-400 bg-gray-50"
              placeholder="Enter password"
            />
          </div>

          <button
            type="submit"
            className="w-full mt-4 py-5 rounded-full bg-gradient-to-r from-[#2563eb] to-[#1d4ed8] text-white text-xl font-bold shadow-[0_10px_30px_rgba(37,99,235,0.45)] hover:brightness-105 active:scale-[0.97] transition"
          >
            Create Account
          </button>
        </form>

        {/* Links */}
        <div className="mt-10 flex flex-col items-center gap-5">
          <button
            onClick={() => navigate("/")}
            className="text-lg md:text-xl text-[#2563eb] hover:text-[#1d4ed8] hover:underline transition"
          >
            ← Back to Home
          </button>
          <button
            onClick={() => navigate("/login")}
            className="text-lg md:text-xl text-emerald-600 hover:text-emerald-700 hover:underline transition"
          >
            ➕ Already have an account? Log In
          </button>
        </div>
      </div>
    </div>
  );
}
