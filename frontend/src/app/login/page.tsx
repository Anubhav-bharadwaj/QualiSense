"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  FlaskConical,
  Lock,
  Mail,
  ArrowRight,
  Loader2,
  AlertCircle,
  Eye,
  EyeOff
} from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/dashboard";

  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, password, rememberMe);
      router.push(redirect);
    } catch (err: any) {
      setError(err.message || "Failed to sign in. Please verify your email and password.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
  };

  return (
    <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-8 space-y-6">
      {/* Brand & Header */}
      <div className="text-center space-y-2">
        <Link href="/" className="inline-flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
            <FlaskConical className="w-6 h-6" />
          </div>
          <span className="text-xl font-extrabold text-white tracking-tight">QualiSense AI</span>
        </Link>
        <h1 className="text-xl font-bold text-white pt-2">Sign In to Plant Console</h1>
        <p className="text-xs text-slate-400">
          Access defect prevention workflows, rule alerts & root-cause dossiers
        </p>
      </div>

      {/* Error alert */}
      {error && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
          <div className="leading-relaxed">{error}</div>
        </div>
      )}

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300 block">Work Email</label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="operator@qualisense.internal"
              className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-hidden transition-colors"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-300 block">Password</label>
            <Link
              href="/forgot-password"
              className="text-[11px] text-teal-400 hover:text-teal-300 font-medium transition-colors"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-hidden transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 focus:outline-hidden"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs pt-1">
          <label className="flex items-center gap-2 text-slate-400 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="rounded border-slate-700 bg-slate-950 text-teal-500 focus:ring-0 focus:ring-offset-0"
            />
            <span>Remember this device (7 days)</span>
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs tracking-wide shadow-lg shadow-teal-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Authenticating...</span>
            </>
          ) : (
            <>
              <span>Sign In to Plant Console</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Quick-Pick Demo Credentials */}
      <div className="pt-2 border-t border-slate-800 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Quick-Fill Demo Roles
          </span>
          <span className="text-[10px] text-teal-400 font-mono">1-Click Auto Fill</span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-left">
          <button
            type="button"
            onClick={() => handleQuickFill("admin@qualisense.internal", "AdminPass@2026!")}
            className="p-2.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-teal-500/40 text-left transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">Administrator</span>
              <span className="text-[9px] bg-rose-500/20 text-rose-300 px-1 rounded">Admin</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5 truncate">admin@qualisense.internal</p>
          </button>

          <button
            type="button"
            onClick={() => handleQuickFill("sarah.chen@qualisense-demo.internal", "QualityEng@2026!")}
            className="p-2.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-teal-500/40 text-left transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">Quality Engineer</span>
              <span className="text-[9px] bg-teal-500/20 text-teal-300 px-1 rounded">QE</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5 truncate">sarah.chen@qualisense-demo...</p>
          </button>

          <button
            type="button"
            onClick={() => handleQuickFill("marc.dupont@qualisense-demo.internal", "ProdMgr@2026!")}
            className="p-2.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-teal-500/40 text-left transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">Production Mgr</span>
              <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1 rounded">Prod</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5 truncate">marc.dupont@qualisense-demo...</p>
          </button>

          <button
            type="button"
            onClick={() => handleQuickFill("elena.rossi@qualisense-demo.internal", "ViewerPass@2026!")}
            className="p-2.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-teal-500/40 text-left transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">Viewer</span>
              <span className="text-[9px] bg-slate-700 text-slate-300 px-1 rounded">Read</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5 truncate">elena.rossi@qualisense-demo...</p>
          </button>
        </div>
      </div>

      {/* Register redirect */}
      <div className="pt-2 text-center text-xs text-slate-400 border-t border-slate-800">
        Need plant access?{" "}
        <Link href="/register" className="text-teal-400 hover:text-teal-300 font-semibold transition-colors">
          Register new account
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex items-center justify-center p-4">
      <Suspense fallback={<div className="text-slate-400 text-xs">Loading login portal...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
