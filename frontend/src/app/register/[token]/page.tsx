/* ================================================================
   PUBLIC REGISTRATION PAGE
   Applicants use a pre-registration link to create their account
   ================================================================ */

"use client";

import React, { useState, useEffect, use } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  GraduationCap,
  Calendar,
  BookOpen,
  Building2,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui";

export default function RegisterPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);

  const [validating, setValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [tokenError, setTokenError] = useState("");
  const [linkLabel, setLinkLabel] = useState("");

  // Form fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [studentNumber, setStudentNumber] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [course, setCourse] = useState("");
  const [college, setCollege] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  // Validate token on mount
  useEffect(() => {
    async function validateToken() {
      try {
        const res = await fetch(
          `/api/auth/register/validate?token=${encodeURIComponent(token)}`,
        );
        const data = await res.json();

        if (data.valid) {
          setTokenValid(true);
          setLinkLabel(data.label || "");
        } else {
          setTokenError(data.error || "Invalid registration link");
        }
      } catch {
        setTokenError("Failed to validate registration link");
      } finally {
        setValidating(false);
      }
    }

    validateToken();
  }, [token]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!fullName.trim()) newErrors.fullName = "Full name is required";
    if (!email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email))
      newErrors.email = "Invalid email format";
    if (!password) newErrors.password = "Password is required";
    else if (password.length < 6)
      newErrors.password = "Password must be at least 6 characters";
    if (password !== confirmPassword)
      newErrors.confirmPassword = "Passwords do not match";
    if (!studentNumber.trim())
      newErrors.studentNumber = "Student number is required";
    if (!dateOfBirth) newErrors.dateOfBirth = "Date of birth is required";
    if (!course.trim()) newErrors.course = "Course is required";
    if (!college.trim()) newErrors.college = "College is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          email,
          password,
          fullName,
          studentNumber,
          dateOfBirth,
          course,
          college,
        }),
      });

      if (res.ok) {
        setSuccess(true);
      } else {
        const err = await res.json().catch(() => ({}));
        setErrors({ submit: err.error || "Registration failed" });
        setIsLoading(false);
      }
    } catch {
      setErrors({ submit: "An error occurred. Please try again." });
      setIsLoading(false);
    }
  };

  // Token validation loading state
  if (validating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="w-10 h-10 border-4 border-ocean-400/30 border-t-ocean-400 rounded-full animate-spin mx-auto mb-4" />
          <p className="font-body text-muted-fg">
            Validating registration link...
          </p>
        </motion.div>
      </div>
    );
  }

  // Invalid token
  if (!tokenValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <div className="w-16 h-16 rounded-full bg-coral-50 dark:bg-coral-500/10 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-coral-400" />
          </div>
          <h1 className="font-heading text-2xl font-bold text-foreground mb-2">
            Invalid Registration Link
          </h1>
          <p className="font-body text-muted-fg mb-6">{tokenError}</p>
          <Button
            variant="outline"
            onClick={() => (window.location.href = "/")}
          >
            Go to Login
          </Button>
        </motion.div>
      </div>
    );
  }

  // Success
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md"
        >
          <div className="w-16 h-16 rounded-full bg-sage-50 dark:bg-sage-400/10 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-sage-500" />
          </div>
          <h1 className="font-heading text-2xl font-bold text-foreground mb-2">
            Account Created!
          </h1>
          <p className="font-body text-muted-fg mb-6">
            Your account has been created successfully. You can now log in with
            your email and password.
          </p>
          <Button onClick={() => (window.location.href = "/")}>
            Go to Login
          </Button>
        </motion.div>
      </div>
    );
  }

  // Registration form
  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
      {/* Background */}
      <Image
        src="/image.png"
        alt=""
        fill
        className="object-cover"
        priority
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-black/50" aria-hidden="true" />

      {/* Registration Card */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative w-full max-w-lg"
      >
        <div className="bg-card-bg/95 backdrop-blur border border-card-border rounded-3xl p-8 md:p-10 shadow-xl">
          {/* Header */}
          <div className="text-center mb-6">
            <Image
              src="/mariveles-seal.png"
              alt="Bayan ng Mariveles seal"
              width={80}
              height={80}
              className="mx-auto mb-3"
              priority
            />
            <h1 className="font-heading text-2xl font-bold text-foreground mb-1">
              Create Your Account
            </h1>
            {linkLabel && (
              <p className="text-sm font-body text-ocean-400">{linkLabel}</p>
            )}
            <p className="text-xs font-body text-muted-fg mt-1">
              Iskolar ng Mariveles Scholarship System
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Full Name */}
            <div>
              <label className="block text-xs font-body text-muted-fg mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-fg" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    setErrors((p) => ({ ...p, fullName: "" }));
                  }}
                  placeholder="Juan Dela Cruz"
                  className={`w-full bg-muted border-2 rounded-xl pl-10 pr-4 py-2.5 text-sm font-body text-foreground placeholder:text-muted-fg focus:outline-none focus:ring-2 transition-all ${
                    errors.fullName
                      ? "border-coral-400 focus:border-coral-400 focus:ring-coral-400/20"
                      : "border-transparent focus:border-ocean-400 focus:ring-ocean-400/20"
                  }`}
                />
              </div>
              {errors.fullName && (
                <p className="text-xs text-coral-400 mt-1">{errors.fullName}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-body text-muted-fg mb-1">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-fg" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setErrors((p) => ({ ...p, email: "" }));
                  }}
                  placeholder="you@email.com"
                  className={`w-full bg-muted border-2 rounded-xl pl-10 pr-4 py-2.5 text-sm font-body text-foreground placeholder:text-muted-fg focus:outline-none focus:ring-2 transition-all ${
                    errors.email
                      ? "border-coral-400 focus:border-coral-400 focus:ring-coral-400/20"
                      : "border-transparent focus:border-ocean-400 focus:ring-ocean-400/20"
                  }`}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-coral-400 mt-1">{errors.email}</p>
              )}
            </div>

            {/* Password row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-body text-muted-fg mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-fg" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setErrors((p) => ({ ...p, password: "" }));
                    }}
                    placeholder="Min. 6 characters"
                    className={`w-full bg-muted border-2 rounded-xl pl-10 pr-10 py-2.5 text-sm font-body text-foreground placeholder:text-muted-fg focus:outline-none focus:ring-2 transition-all ${
                      errors.password
                        ? "border-coral-400 focus:border-coral-400 focus:ring-coral-400/20"
                        : "border-transparent focus:border-ocean-400 focus:ring-ocean-400/20"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-fg hover:text-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-coral-400 mt-1">
                    {errors.password}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs font-body text-muted-fg mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-fg" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setErrors((p) => ({ ...p, confirmPassword: "" }));
                    }}
                    placeholder="Repeat password"
                    className={`w-full bg-muted border-2 rounded-xl pl-10 pr-4 py-2.5 text-sm font-body text-foreground placeholder:text-muted-fg focus:outline-none focus:ring-2 transition-all ${
                      errors.confirmPassword
                        ? "border-coral-400 focus:border-coral-400 focus:ring-coral-400/20"
                        : "border-transparent focus:border-ocean-400 focus:ring-ocean-400/20"
                    }`}
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="text-xs text-coral-400 mt-1">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>
            </div>

            {/* Student Number & DOB */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-body text-muted-fg mb-1">
                  Student Number
                </label>
                <div className="relative">
                  <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-fg" />
                  <input
                    type="text"
                    value={studentNumber}
                    onChange={(e) => {
                      setStudentNumber(e.target.value);
                      setErrors((p) => ({ ...p, studentNumber: "" }));
                    }}
                    placeholder="e.g. 2024-00001"
                    className={`w-full bg-muted border-2 rounded-xl pl-10 pr-4 py-2.5 text-sm font-body text-foreground placeholder:text-muted-fg focus:outline-none focus:ring-2 transition-all ${
                      errors.studentNumber
                        ? "border-coral-400 focus:border-coral-400 focus:ring-coral-400/20"
                        : "border-transparent focus:border-ocean-400 focus:ring-ocean-400/20"
                    }`}
                  />
                </div>
                {errors.studentNumber && (
                  <p className="text-xs text-coral-400 mt-1">
                    {errors.studentNumber}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs font-body text-muted-fg mb-1">
                  Date of Birth
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-fg" />
                  <input
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => {
                      setDateOfBirth(e.target.value);
                      setErrors((p) => ({ ...p, dateOfBirth: "" }));
                    }}
                    className={`w-full bg-muted border-2 rounded-xl pl-10 pr-4 py-2.5 text-sm font-body text-foreground focus:outline-none focus:ring-2 transition-all ${
                      errors.dateOfBirth
                        ? "border-coral-400 focus:border-coral-400 focus:ring-coral-400/20"
                        : "border-transparent focus:border-ocean-400 focus:ring-ocean-400/20"
                    }`}
                  />
                </div>
                {errors.dateOfBirth && (
                  <p className="text-xs text-coral-400 mt-1">
                    {errors.dateOfBirth}
                  </p>
                )}
              </div>
            </div>

            {/* Course & College */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-body text-muted-fg mb-1">
                  Course / Program
                </label>
                <div className="relative">
                  <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-fg" />
                  <input
                    type="text"
                    value={course}
                    onChange={(e) => {
                      setCourse(e.target.value);
                      setErrors((p) => ({ ...p, course: "" }));
                    }}
                    placeholder="e.g. BS Computer Science"
                    className={`w-full bg-muted border-2 rounded-xl pl-10 pr-4 py-2.5 text-sm font-body text-foreground placeholder:text-muted-fg focus:outline-none focus:ring-2 transition-all ${
                      errors.course
                        ? "border-coral-400 focus:border-coral-400 focus:ring-coral-400/20"
                        : "border-transparent focus:border-ocean-400 focus:ring-ocean-400/20"
                    }`}
                  />
                </div>
                {errors.course && (
                  <p className="text-xs text-coral-400 mt-1">{errors.course}</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-body text-muted-fg mb-1">
                  College / School
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-fg" />
                  <input
                    type="text"
                    value={college}
                    onChange={(e) => {
                      setCollege(e.target.value);
                      setErrors((p) => ({ ...p, college: "" }));
                    }}
                    placeholder="e.g. College of Engineering"
                    className={`w-full bg-muted border-2 rounded-xl pl-10 pr-4 py-2.5 text-sm font-body text-foreground placeholder:text-muted-fg focus:outline-none focus:ring-2 transition-all ${
                      errors.college
                        ? "border-coral-400 focus:border-coral-400 focus:ring-coral-400/20"
                        : "border-transparent focus:border-ocean-400 focus:ring-ocean-400/20"
                    }`}
                  />
                </div>
                {errors.college && (
                  <p className="text-xs text-coral-400 mt-1">
                    {errors.college}
                  </p>
                )}
              </div>
            </div>

            {/* Submit error */}
            {errors.submit && (
              <div className="bg-coral-50 dark:bg-coral-500/10 border border-coral-200 dark:border-coral-500/20 rounded-xl px-4 py-3">
                <p className="text-sm text-coral-500 font-body">
                  {errors.submit}
                </p>
              </div>
            )}

            {/* Submit */}
            <Button
              type="submit"
              size="lg"
              isLoading={isLoading}
              className="w-full"
            >
              Create Account
            </Button>

            <p className="text-center text-xs font-body text-muted-fg">
              Already have an account?{" "}
              <a href="/" className="text-ocean-400 hover:underline">
                Log in here
              </a>
            </p>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
