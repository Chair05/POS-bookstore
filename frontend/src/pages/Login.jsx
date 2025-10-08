import React, { useState } from "react";

export default function LogIn() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();
    const admin = JSON.parse(localStorage.getItem("admin"));

    if (admin && username === admin.username && password === admin.password) {
      localStorage.setItem("user", JSON.stringify({ name: username }));
      window.location.href = "/dashboard";
    } else {
      alert("Invalid credentials. Please check your username or password.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gray-100">
      <h1 className="text-3xl font-bold text-blue-700 mb-6">🔑 Admin Login</h1>
      <form onSubmit={handleLogin} className="bg-white p-6 rounded shadow-md w-80">
        <label className="block mb-2 font-semibold">Username</label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="border w-full p-2 mb-4 rounded"
          placeholder="Enter username"
        />

        <label className="block mb-2 font-semibold">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border w-full p-2 mb-4 rounded"
          placeholder="Enter password"
        />

        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white w-full py-2 rounded font-semibold"
        >
          Log In
        </button>
      </form>
      <button
        onClick={() => (window.location.href = "/")}
        className="mt-4 text-blue-600 hover:underline"
      >
        ← Back to Start
      </button>
    </div>
  );
}
