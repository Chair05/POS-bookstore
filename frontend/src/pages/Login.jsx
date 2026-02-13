import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/Lccb-logo.jpeg";
import cover from "../assets/gg.jpg";

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
          localStorage.setItem(
            "user",
            JSON.stringify({ name: data.name, role: data.role })
          );

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
    <div className="w-screen h-screen flex overflow-hidden">

      {/* LEFT SIDE IMAGE */}
      <div className="w-1/2 h-full relative">
        <img
          src={cover}
          alt="Login Cover"
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Blue Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/80 via-blue-700/70 to-blue-500/60"></div>

        <div className="absolute inset-0 flex items-center justify-center text-white text-center px-12">
          <div>
            <h2 className="text-4xl font-bold mb-4">
              User Access Portal
            </h2>
            <p className="text-lg opacity-90">
              Securely log in to access the bookstore system.
            </p>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE FORM */}
      <div className="w-1/2 h-full flex items-center justify-center bg-gray-50 px-16">
        <div className="w-full max-w-md">

          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-lg bg-white">
              <img
                src={logo}
                alt="LCCB Logo"
                className="w-full h-full object-contain"
              />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                User Login
              </h1>
              <p className="text-sm text-gray-500">
                Sign in to access your dashboard
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                className="w-full h-12 px-4 rounded-xl border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-600"
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
                className="w-full h-12 px-4 rounded-xl border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <button
              type="submit"
              className="w-full h-12 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold shadow-lg hover:brightness-105 active:scale-[0.98] transition"
            >
              Log In
            </button>
          </form>

          {/* Links */}
          <div className="mt-6 flex flex-col gap-2 text-sm">
            <button
              onClick={() => navigate("/")}
              className="text-blue-600 hover:underline text-left"
            >
              ← Back to Home
            </button>

            <button
              onClick={() => navigate("/signin")}
              className="text-emerald-600 hover:underline text-left"
            >
              Create User Account
            </button>
          </div>

        </div>
      </div>

    </div>
  );
}
