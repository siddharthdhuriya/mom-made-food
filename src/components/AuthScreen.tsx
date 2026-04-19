"use client";

import { useState } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabase";

const ALLOWED_EMAILS = ["siddharthdhuriya@gmail.com", "neharawat2306@gmail.com"];

export default function AuthScreen() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!email || !password) return;
    setLoading(true);
    setError(null);
    setMessage(null);

    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
    } else {
      if (!ALLOWED_EMAILS.includes(email.toLowerCase().trim())) {
        setError("Account creation is not allowed for this email.");
        setLoading(false);
        return;
      }
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setError(error.message);
      else setMessage("Check your email to confirm your account, then sign in.");
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 bg-amber-50">
      <div className="mb-8 flex flex-col items-center">
        <Image
          src="/logo.png"
          alt="Mom Made Food"
          width={80}
          height={80}
          className="rounded-full object-cover mb-3 shadow-md"
          priority
        />
        <h1 className="text-2xl font-bold text-gray-900">
          Mom Made <span className="text-amber-500">Food</span>
        </h1>
        <p className="text-sm text-gray-400 mt-1">Production Cost Calculator</p>
      </div>

      <div className="w-full max-w-sm bg-white rounded-3xl shadow-sm border border-amber-100 p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-800 text-center">
          {mode === "signin" ? "Sign in" : "Create account"}
        </h2>

        <div>
          <label className="label">Email</label>
          <input
            type="email"
            inputMode="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            placeholder="you@example.com"
            className="input-field"
          />
        </div>

        <div>
          <label className="label">Password</label>
          <input
            type="password"
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            placeholder="••••••••"
            className="input-field"
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2">{error}</p>
        )}
        {message && (
          <p className="text-sm text-green-700 bg-green-50 rounded-xl px-3 py-2">{message}</p>
        )}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading || !email || !password}
          className={`w-full font-semibold rounded-2xl py-4 text-base transition-all duration-150 active:scale-[0.98] shadow-md ${
            !loading && email && password
              ? "bg-amber-500 hover:bg-amber-600 text-white"
              : "bg-gray-100 text-gray-400 cursor-not-allowed shadow-none"
          }`}
        >
          {loading ? "Please wait…" : mode === "signin" ? "Sign In" : "Create Account"}
        </button>

        <button
          type="button"
          onClick={() => {
            setMode(mode === "signin" ? "signup" : "signin");
            setError(null);
            setMessage(null);
          }}
          className="w-full text-center text-sm text-amber-600 font-medium py-1"
        >
          {mode === "signin" ? "New here? Create an account" : "Already have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}
