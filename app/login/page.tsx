"use client";

import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleLogin = async () => {
    try {
      const res = await fetch("http://localhost:5000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (data.success) {
        setMessage(data.message);
        if (data.role === "admin") {
          window.location.href = "/admin-dashboard";
        } else {
          window.location.href = "/";
        }
      } else {
        setMessage(data.message);
      }
    } catch {
      setMessage("⚠️ Gagal koneksi ke server");
    }
  };

  return (
    <div className="min-h-screen bg-[#0E1116] flex items-center justify-center">
      <div className="bg-[#152030] p-8 rounded-md w-[380px]">
        <h2 className="bg-[#274056] text-white text-center py-2 font-medium mb-5">
          Login
        </h2>
        <label className="text-white text-sm block mb-1">Email</label>
        <input
          type="email"
          className="w-full px-3 py-2 mb-4 bg-[#0E1116] text-white rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <label className="text-white text-sm block mb-1">Password</label>
        <input
          type="password"
          className="w-full px-3 py-2 mb-4 bg-[#0E1116] text-white rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button
          onClick={handleLogin}
          className="bg-[#0E1116] text-white px-4 py-2 rounded-full hover:bg-[#1c2027]"
        >
          Login
        </button>
        {message && <p className="mt-4 text-white">{message}</p>}
      </div>
    </div>
  );
}
