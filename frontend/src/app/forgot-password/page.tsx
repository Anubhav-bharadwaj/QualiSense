"use client";

import React, { useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import {
  FlaskConical,
  Mail,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Loader2,
  KeyRound,
  ExternalLink
} from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    message: string;
    recovery_token?: string;
    reset_url_example?: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.forgotPassword({ email });
      setResult(res);
    } catch (err: any) {
      setError(err.message || "Failed to submit password recovery request.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-8 space-y-6">
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
              <FlaskConical className="w-6 h-6" />
            </div>
            <span className="text-xl font-extrabold text-white tracking-tight">QualiSense AI</span>
          </Link>
          <h1 className="text-xl font-bold text-white pt-2">Password Recovery</h1>
          <p className="text-xs text-slate-400">
            Enter your work email to generate a single-use secure reset token
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
            <div className="leading-relaxed">{error}</div>
          </div>
        )}

        {result ? (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="p-4 rounded-xl bg-teal-950/40 border border-teal-500/30 text-teal-300 text-xs space-y-2">
              <div className="flex items-center gap-2 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-teal-400" />
                <span>Recovery Token Generated</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                {result.message}
              </p>
            </div>

            {result.recovery_token && (
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-3">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-teal-400" /> Prototype Test Action:
                  </span>
                  <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-teal-300">
                    Local Demo Mode
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Because this local prototype runs without an external SMTP relay, the token is provided directly below:
                </p>
                <div className="p-2.5 bg-slate-900 rounded-lg font-mono text-[10px] text-teal-300 break-all border border-slate-800">
                  {result.recovery_token}
                </div>
                <Link
                  href={`/reset-password?token=${result.recovery_token}`}
                  className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-lg font-bold text-xs transition-colors"
                >
                  Proceed to Reset Password
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}

            <div className="pt-2 text-center">
              <Link
                href="/login"
                className="text-xs text-slate-400 hover:text-white inline-flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Return to Login
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">Registered Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="sarah.chen@qualisense-demo.internal"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-hidden transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs tracking-wide shadow-lg shadow-teal-500/20 transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Issuing Recovery Token...</span>
                </>
              ) : (
                <>
                  <span>Send Recovery Instructions</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="pt-2 text-center text-xs text-slate-400">
              Remember your password?{" "}
              <Link href="/login" className="text-teal-400 hover:text-teal-300 font-semibold transition-colors">
                Sign in
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
