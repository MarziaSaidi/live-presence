"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async () => {
    setError("");

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) return setError(error.message);
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) return setError(error.message);
    }

    router.push("/dashboard");
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        fontFamily: "sans-serif",
        gap: "12px",
      }}
    >
      <h1>{isSignUp ? "Create Account" : "Welcome Back"}</h1>

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{ padding: "10px", width: "300px", fontSize: "16px" }}
      />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{ padding: "10px", width: "300px", fontSize: "16px" }}
      />

      {error && <p style={{ color: "red" }}>{error}</p>}

      <button
        onClick={handleSubmit}
        style={{
          padding: "10px 20px",
          backgroundColor: "#000",
          color: "#fff",
          border: "none",
          cursor: "pointer",
          fontSize: "16px",
          width: "300px",
        }}
      >
        {isSignUp ? "Sign Up" : "Log In"}
      </button>

      <p
        onClick={() => setIsSignUp(!isSignUp)}
        style={{
          cursor: "pointer",
          color: "blue",
          textDecoration: "underline",
        }}
      >
        {isSignUp
          ? "Already have an account? Log in"
          : "Don't have an account? Sign up"}
      </p>
    </div>
  );
}
