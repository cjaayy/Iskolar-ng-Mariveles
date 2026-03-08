"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Email is required");
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError("Invalid email format");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || "Something went wrong");
        setIsLoading(false);
        return;
      }

      setSent(true);
    } catch {
      setError("Something went wrong. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
      <Image
        src="/image.png"
        alt=""
        fill
        className="object-cover"
        priority
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-black/50" aria-hidden="true" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative w-full max-w-md"
      >
        <div className="bg-transparent border border-white/20 rounded-3xl p-8 md:p-10">
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5, type: "spring" }}
              className="flex justify-center mb-4"
            >
              <Image
                src="/mariveles-seal.png"
                alt="Bayan ng Mariveles seal"
                width={80}
                height={80}
                className="animate-float"
                priority
              />
            </motion.div>
            <h1 className="font-heading text-2xl md:text-3xl font-bold text-white uppercase">
              {sent ? "Check Your Email" : "Forgot Password"}
            </h1>
            <p className="text-xs font-body text-white/70 mt-1">
              Iskolar ng Mariveles Scholarship System
            </p>
          </div>

          {sent ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center space-y-4"
            >
              <div className="flex justify-center">
                <CheckCircle2 className="w-12 h-12 text-green-400" />
              </div>
              <p className="text-sm font-body text-white/80">
                If an account with{" "}
                <strong className="text-white">{email}</strong> exists,
                we&apos;ve sent a password reset link to your inbox.
              </p>
              <p className="text-xs font-body text-white/50">
                The link will expire in 1 hour. Check your spam folder if you
                don&apos;t see it.
              </p>
              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={() => (window.location.href = "/")}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Login
              </Button>
            </motion.div>
          ) : (
            <motion.form
              onSubmit={handleSubmit}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="space-y-5"
              noValidate
            >
              <p className="text-sm font-body text-white/70 text-center">
                Enter your email address and we&apos;ll send you a link to reset
                your password.
              </p>

              <div className="pt-2">
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-fg pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError("");
                    }}
                    placeholder=" "
                    id="forgot-email"
                    className={`
                      peer w-full bg-input-bg border-2 rounded-xl pl-10 pr-4 py-3.5 font-body text-foreground
                      transition-all duration-200 placeholder-transparent
                      focus:outline-none focus:border-green-600 focus:ring-2 focus:ring-green-600/20
                      hover:border-green-400
                      ${error ? "border-coral-400 focus:border-coral-400 focus:ring-coral-400/20" : "border-green-600"}
                    `}
                  />
                  <label
                    htmlFor="forgot-email"
                    className="floating-label absolute left-10 top-1/2 -translate-y-1/2 text-muted-fg font-body text-sm
                      transition-all duration-200 pointer-events-none
                      peer-focus:-translate-y-9 peer-focus:scale-[0.85] peer-focus:text-green-600 peer-focus:font-medium
                      peer-[:not(:placeholder-shown)]:-translate-y-9 peer-[:not(:placeholder-shown)]:scale-[0.85]"
                  >
                    Email address
                  </label>
                </div>
                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-1.5 text-xs text-coral-400 font-body flex items-center gap-1"
                    role="alert"
                  >
                    <span className="inline-block w-1 h-1 rounded-full bg-coral-400" />
                    {error}
                  </motion.p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full !bg-green-600 hover:!bg-green-700 text-white"
                size="lg"
                isLoading={isLoading}
              >
                Send Reset Link
              </Button>

              <div className="flex items-center justify-center">
                <a
                  href="/"
                  className="text-sm font-body text-green-600 hover:text-green-700 hover:underline transition-colors flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back to Login
                </a>
              </div>
            </motion.form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
