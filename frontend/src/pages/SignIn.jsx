import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function SignIn() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSignIn = (e) => {
    e.preventDefault();
    if (!username || !password) return alert("Please fill in all fields.");

    localStorage.setItem("admin", JSON.stringify({ username, password }));
    alert("Admin account created successfully!");
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gray-100">
      <h1 className="text-3xl font-bold text-blue-700 mb-6">📝 Create Admin Account</h1>
      <form onSubmit={handleSignIn} className="bg-white p-6 rounded-lg shadow-md w-80">
        <label className="block mb-2 font-semibold">Username</label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="border w-full p-2 mb-4 rounded"
          placeholder="Enter new username"
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
          className="bg-green-600 hover:bg-green-700 text-white w-full py-2 rounded font-semibold"
        >
          Sign In
        </button>
      </form>
      <button
        onClick={() => navigate("/")}
        className="mt-4 text-blue-600 hover:underline"
      >
        ← Back to Home
      </button>
    </div>
  );
}
