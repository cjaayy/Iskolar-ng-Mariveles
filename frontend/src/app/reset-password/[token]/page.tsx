"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui";

export default function ResetPasswordPage({
  params,
}: {
  params: { token: string };
}) {
  const { token } = params;

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);
  const [apiError, setApiError] = useState("");

  const [redirectCount, setRedirectCount] = useState(5);

  useEffect(() => {
    if (!success) return;
    if (redirectCount <= 0) {
      window.location.href = "/";
      return;
    }
    const timer = setTimeout(() => setRedirectCount((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [success, redirectCount]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!password) newErrors.password = "Password is required";
    else if (password.length < 6)
      newErrors.password = "Password must be at least 6 characters";
    if (!confirmPassword)
      newErrors.confirmPassword = "Please confirm your password";
    else if (password !== confirmPassword)
      newErrors.confirmPassword = "Passwords do not match";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError("");
    if (!validate()) return;
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setApiError(data.error || "Something went wrong");
        setIsLoading(false);
        return;
      }

      setSuccess(true);
    } catch {
      setApiError("Something went wrong. Please try again.");
      setIsLoading(false);
    }
  };

  if (success) {
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
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative w-full max-w-md"
        >
          <div className="bg-transparent border border-white/20 rounded-3xl p-8 md:p-10 text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle2 className="w-14 h-14 text-green-400" />
            </div>
            <h1 className="font-heading text-2xl font-bold text-white mb-2">
              Password Updated!
            </h1>
            <p className="font-body text-white/70 mb-6 text-sm">
              Your password has been successfully reset. You can now log in with
              your new password.
            </p>
            <p className="font-body text-white/50 text-xs mb-4">
              Redirecting to login in {redirectCount}s...
            </p>
            <Button
              onClick={() => (window.location.href = "/")}
              className="w-full !bg-green-600 hover:!bg-green-700 text-white"
            >
              Go to Login
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

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
              Reset Password
            </h1>
            <p className="text-xs font-body text-white/70 mt-1">
              Iskolar ng Mariveles Scholarship System
            </p>
          </div>

          <motion.form
            onSubmit={handleSubmit}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="space-y-5"
            noValidate
          >
            <p className="text-sm font-body text-white/70 text-center">
              Enter your new password below.
            </p>

            <div className="pt-2">
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-fg pointer-events-none" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrors((p) => ({ ...p, password: "" }));
                  }}
                  placeholder=" "
                  id="new-password"
                  className={`
                    peer w-full bg-input-bg border-2 rounded-xl pl-10 pr-12 py-3.5 font-body text-foreground
                    transition-all duration-200 placeholder-transparent
                    focus:outline-none focus:border-green-600 focus:ring-2 focus:ring-green-600/20
                    hover:border-green-400
                    ${errors.password ? "border-coral-400 focus:border-coral-400 focus:ring-coral-400/20" : "border-green-600"}
                  `}
                />
                <label
                  htmlFor="new-password"
                  className="floating-label absolute left-10 top-1/2 -translate-y-1/2 text-muted-fg font-body text-sm
                    transition-all duration-200 pointer-events-none
                    peer-focus:-translate-y-9 peer-focus:scale-[0.85] peer-focus:text-green-600 peer-focus:font-medium
                    peer-[:not(:placeholder-shown)]:-translate-y-9 peer-[:not(:placeholder-shown)]:scale-[0.85]"
                >
                  New Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-fg hover:text-foreground transition-colors"
                >
                  {showPassword ? (
                    <Eye className="w-4 h-4" />
                  ) : (
                    <EyeOff className="w-4 h-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-1.5 text-xs text-coral-400 font-body flex items-center gap-1"
                  role="alert"
                >
                  <span className="inline-block w-1 h-1 rounded-full bg-coral-400" />
                  {errors.password}
                </motion.p>
              )}
            </div>

            <div className="pt-2">
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-fg pointer-events-none" />
                <input
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setErrors((p) => ({ ...p, confirmPassword: "" }));
                  }}
                  placeholder=" "
                  id="confirm-password"
                  className={`
                    peer w-full bg-input-bg border-2 rounded-xl pl-10 pr-12 py-3.5 font-body text-foreground
                    transition-all duration-200 placeholder-transparent
                    focus:outline-none focus:border-green-600 focus:ring-2 focus:ring-green-600/20
                    hover:border-green-400
                    ${errors.confirmPassword ? "border-coral-400 focus:border-coral-400 focus:ring-coral-400/20" : "border-green-600"}
                  `}
                />
                <label
                  htmlFor="confirm-password"
                  className="floating-label absolute left-10 top-1/2 -translate-y-1/2 text-muted-fg font-body text-sm
                    transition-all duration-200 pointer-events-none
                    peer-focus:-translate-y-9 peer-focus:scale-[0.85] peer-focus:text-green-600 peer-focus:font-medium
                    peer-[:not(:placeholder-shown)]:-translate-y-9 peer-[:not(:placeholder-shown)]:scale-[0.85]"
                >
                  Confirm Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-fg hover:text-foreground transition-colors"
                >
                  {showConfirm ? (
                    <Eye className="w-4 h-4" />
                  ) : (
                    <EyeOff className="w-4 h-4" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-1.5 text-xs text-coral-400 font-body flex items-center gap-1"
                  role="alert"
                >
                  <span className="inline-block w-1 h-1 rounded-full bg-coral-400" />
                  {errors.confirmPassword}
                </motion.p>
              )}
            </div>

            {apiError && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 bg-coral-500/10 border border-coral-500/20 rounded-xl px-4 py-3"
              >
                <AlertCircle className="w-4 h-4 text-coral-400 flex-shrink-0" />
                <p className="text-sm text-coral-400 font-body">{apiError}</p>
              </motion.div>
            )}

            <Button
              type="submit"
              className="w-full !bg-green-600 hover:!bg-green-700 text-white"
              size="lg"
              isLoading={isLoading}
            >
              Reset Password
            </Button>
          </motion.form>
        </div>
      </motion.div>
    </div>
  );
}
