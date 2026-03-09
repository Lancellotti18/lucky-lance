"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/utils/cn";
import AuthInput from "./AuthInput";
import LegalDisclaimer from "./LegalDisclaimer";
import type { AuthUser } from "@/stores/auth-store";

interface AuthScreenProps {
  onSuccess: (user: AuthUser) => void;
}

export default function AuthScreen({ onSuccess }: AuthScreenProps) {
  const [tab, setTab] = useState<"login" | "signup">("login");

  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // Signup state
  const [firstName, setFirstName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [signupError, setSignupError] = useState("");
  const [signupLoading, setSignupLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLoginError(data.error || "Login failed.");
      } else {
        onSuccess(data);
      }
    } catch {
      setLoginError("Something went wrong. Please try again.");
    } finally {
      setLoginLoading(false);
    }
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    if (!disclaimerAccepted) {
      setSignupError("You must accept the terms to create an account.");
      return;
    }
    setSignupError("");
    setSignupLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          email: signupEmail,
          password: signupPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSignupError(data.error || "Signup failed.");
      } else {
        onSuccess(data);
      }
    } catch {
      setSignupError("Something went wrong. Please try again.");
    } finally {
      setSignupLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-casino-black flex flex-col items-center justify-center px-6 py-12">
      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 text-center"
      >
        <h1 className="lucky-lance-title text-4xl mb-1">Lucky Lance</h1>
        <p className="text-casino-muted text-sm">
          Professional Poker Analysis
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="w-full max-w-sm"
      >
        {/* Tabs */}
        <div className="flex bg-casino-dark rounded-xl p-1 mb-6 border border-white/10">
          {(["login", "signup"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200",
                tab === t
                  ? "bg-casino-red text-white shadow-lg"
                  : "text-casino-muted hover:text-casino-text"
              )}
            >
              {t === "login" ? "Sign In" : "Create Account"}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {tab === "login" ? (
            <motion.form
              key="login"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.15 }}
              onSubmit={handleLogin}
              className="flex flex-col gap-4"
            >
              <AuthInput
                label="Email"
                type="email"
                value={loginEmail}
                onChange={setLoginEmail}
                placeholder="you@example.com"
                autoComplete="email"
              />
              <AuthInput
                label="Password"
                type="password"
                value={loginPassword}
                onChange={setLoginPassword}
                placeholder="••••••••"
                autoComplete="current-password"
              />
              {loginError && (
                <p className="text-casino-red text-sm text-center">
                  {loginError}
                </p>
              )}
              <button
                type="submit"
                disabled={loginLoading}
                className="w-full bg-casino-red text-white font-bold py-3 rounded-xl shadow-lg shadow-casino-red/30 hover:bg-casino-red-glow active:scale-95 transition-all duration-150 disabled:opacity-60 mt-2"
              >
                {loginLoading ? "Signing in…" : "Sign In"}
              </button>
            </motion.form>
          ) : (
            <motion.form
              key="signup"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.15 }}
              onSubmit={handleSignup}
              className="flex flex-col gap-4"
            >
              <AuthInput
                label="First Name"
                value={firstName}
                onChange={setFirstName}
                placeholder="Your first name"
                autoComplete="given-name"
              />
              <AuthInput
                label="Email"
                type="email"
                value={signupEmail}
                onChange={setSignupEmail}
                placeholder="you@example.com"
                autoComplete="email"
              />
              <AuthInput
                label="Password"
                type="password"
                value={signupPassword}
                onChange={setSignupPassword}
                placeholder="At least 8 characters"
                autoComplete="new-password"
              />
              <LegalDisclaimer
                accepted={disclaimerAccepted}
                onToggle={() => setDisclaimerAccepted((v) => !v)}
              />
              {signupError && (
                <p className="text-casino-red text-sm text-center">
                  {signupError}
                </p>
              )}
              <button
                type="submit"
                disabled={signupLoading}
                className="w-full bg-casino-red text-white font-bold py-3 rounded-xl shadow-lg shadow-casino-red/30 hover:bg-casino-red-glow active:scale-95 transition-all duration-150 disabled:opacity-60 mt-2"
              >
                {signupLoading ? "Creating account…" : "Create Account"}
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Footer disclaimer */}
      <p className="text-casino-muted text-xs text-center max-w-xs mt-10 leading-relaxed">
        Lucky Lance provides poker analysis for educational purposes only. We
        are not responsible for any financial losses incurred while gambling.
      </p>
    </div>
  );
}
