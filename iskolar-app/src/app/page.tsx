/* ================================================================
   LOGIN PAGE
   A warm, welcoming login with organic shapes and mascot
   ================================================================ */

"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, GraduationCap, Sun, Moon } from "lucide-react";
import { Mascot, BlobShape, BlobShape2 } from "@/components/illustrations";
import { Button, Checkbox } from "@/components/ui";
import { useTheme } from "@/components/providers/ThemeProvider";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const { theme, toggleTheme } = useTheme();

  const validate = () => {
    const newErrors: typeof errors = {};
    if (!email) newErrors.email = "We need your email to find your account";
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = "That doesn't look like a valid email";
    if (!password) newErrors.password = "Don't forget your password!";
    else if (password.length < 6) newErrors.password = "Password should be at least 6 characters";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsLoading(true);
    // Simulate login delay
    await new Promise((res) => setTimeout(res, 1500));
    setIsLoading(false);
    window.location.href = "/dashboard";
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center p-4">
      {/* Background blobs */}
      <BlobShape
        className="absolute -top-20 -left-20 animate-blob-morph opacity-60"
        size={400}
        color="#4A6FA5"
        opacity={0.08}
      />
      <BlobShape2
        className="absolute -bottom-32 -right-20 animate-blob-morph opacity-60"
        size={500}
        color="#E6B89C"
        opacity={0.1}
      />
      <BlobShape
        className="absolute top-1/3 right-0 animate-float"
        size={200}
        color="#F5C026"
        opacity={0.06}
      />

      {/* Dot pattern overlay */}
      <div className="absolute inset-0 dot-pattern opacity-30 pointer-events-none" aria-hidden="true" />

      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        className="absolute top-4 right-4 z-10 p-2.5 rounded-xl bg-card-bg/80 backdrop-blur border border-card-border text-muted-fg hover:text-foreground transition-all hover:scale-105 shadow-soft"
        aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
      >
        {theme === "light" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
      </button>

      {/* Login Card */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative w-full max-w-md"
      >
        <div className="bg-card-bg/90 backdrop-blur-lg border border-card-border rounded-3xl shadow-soft-lg p-8 md:p-10">
          {/* Header with mascot */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5, type: "spring" }}
              className="inline-block"
            >
              <Mascot size={100} className="mx-auto mb-4 animate-float" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <h1 className="font-heading text-2xl md:text-3xl font-bold text-foreground mb-1">
                Welcome back, Iskolar!
              </h1>
              <p className="font-body text-muted-fg text-sm">
                Sign in to track your scholarship journey
              </p>
            </motion.div>
          </div>

          {/* Login Form */}
          <motion.form
            onSubmit={handleSubmit}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="space-y-5"
            noValidate
          >
            {/* Email */}
            <div>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-fg pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: undefined })); }}
                  placeholder=" "
                  id="login-email"
                  className={`
                    peer w-full bg-input-bg border-2 rounded-xl pl-10 pr-4 py-3.5 font-body text-foreground
                    transition-all duration-200 placeholder-transparent
                    focus:outline-none focus:border-ocean-400 focus:ring-2 focus:ring-ocean-400/20
                    hover:border-ocean-300
                    ${errors.email ? "border-coral-400 focus:border-coral-400 focus:ring-coral-400/20" : "border-input-border"}
                  `}
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? "email-error" : undefined}
                />
                <label
                  htmlFor="login-email"
                  className="absolute left-10 top-1/2 -translate-y-1/2 text-muted-fg font-body text-sm
                    transition-all duration-200 pointer-events-none
                    peer-focus:-translate-y-9 peer-focus:scale-[0.85] peer-focus:text-ocean-400 peer-focus:font-medium
                    peer-[:not(:placeholder-shown)]:-translate-y-9 peer-[:not(:placeholder-shown)]:scale-[0.85]"
                >
                  Email address
                </label>
              </div>
              {errors.email && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  id="email-error"
                  className="mt-1.5 text-xs text-coral-400 font-body flex items-center gap-1"
                  role="alert"
                >
                  <span className="inline-block w-1 h-1 rounded-full bg-coral-400" />
                  {errors.email}
                </motion.p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-fg pointer-events-none" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: undefined })); }}
                  placeholder=" "
                  id="login-password"
                  className={`
                    peer w-full bg-input-bg border-2 rounded-xl pl-10 pr-12 py-3.5 font-body text-foreground
                    transition-all duration-200 placeholder-transparent
                    focus:outline-none focus:border-ocean-400 focus:ring-2 focus:ring-ocean-400/20
                    hover:border-ocean-300
                    ${errors.password ? "border-coral-400 focus:border-coral-400 focus:ring-coral-400/20" : "border-input-border"}
                  `}
                  aria-invalid={!!errors.password}
                  aria-describedby={errors.password ? "password-error" : undefined}
                />
                <label
                  htmlFor="login-password"
                  className="absolute left-10 top-1/2 -translate-y-1/2 text-muted-fg font-body text-sm
                    transition-all duration-200 pointer-events-none
                    peer-focus:-translate-y-9 peer-focus:scale-[0.85] peer-focus:text-ocean-400 peer-focus:font-medium
                    peer-[:not(:placeholder-shown)]:-translate-y-9 peer-[:not(:placeholder-shown)]:scale-[0.85]"
                >
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-fg hover:text-foreground transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  id="password-error"
                  className="mt-1.5 text-xs text-coral-400 font-body flex items-center gap-1"
                  role="alert"
                >
                  <span className="inline-block w-1 h-1 rounded-full bg-coral-400" />
                  {errors.password}
                </motion.p>
              )}
            </div>

            {/* Remember me + Forgot password */}
            <div className="flex items-center justify-between">
              <Checkbox
                checked={rememberMe}
                onChange={setRememberMe}
                label="Remember me"
              />
              <a
                href="#"
                className="text-sm font-body text-ocean-400 hover:text-ocean-500 hover:underline transition-colors"
              >
                Forgot password?
              </a>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              className="w-full"
              size="lg"
              isLoading={isLoading}
            >
              Sign In
            </Button>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-card-border" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-card-bg px-4 text-xs font-body text-muted-fg">
                  or continue with
                </span>
              </div>
            </div>

            {/* School Credentials */}
            <Button
              type="button"
              variant="outline"
              className="w-full"
              size="lg"
              leftIcon={<GraduationCap className="w-5 h-5" />}
            >
              School Credentials
            </Button>
          </motion.form>

          {/* Footer */}
          <p className="text-center mt-8 text-sm font-body text-muted-fg">
            New scholar?{" "}
            <a href="#" className="text-ocean-400 hover:text-ocean-500 font-medium hover:underline transition-colors">
              Create an account
            </a>
          </p>
        </div>

        {/* Hand-drawn decorative element under the card */}
        <svg
          className="mx-auto mt-4 text-muted-fg opacity-20"
          width="120"
          height="8"
          viewBox="0 0 120 8"
          aria-hidden="true"
        >
          <path
            d="M2 4 Q15 1, 30 4 Q45 7, 60 4 Q75 1, 90 4 Q105 7, 118 4"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
        </svg>
      </motion.div>
    </div>
  );
}
