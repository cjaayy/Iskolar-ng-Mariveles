"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import {
  Mail,
  User,
  MapPin,
  CheckCircle2,
  Lock,
  Copy,
  Check,
  BookOpen,
  School,
  GraduationCap,
} from "lucide-react";
import { Button } from "@/components/ui";

type EducationLevel = "elementary" | "high_school" | "senior_high";

const EDUCATION_LEVEL_CONFIG: Record<
  EducationLevel,
  { label: string; color: string; bgColor: string; icon: React.ReactNode }
> = {
  elementary: {
    label: "Elementary",
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/20",
    icon: <BookOpen className="w-3.5 h-3.5" />,
  },
  high_school: {
    label: "High School",
    color: "text-blue-400",
    bgColor: "bg-blue-500/20",
    icon: <School className="w-3.5 h-3.5" />,
  },
  senior_high: {
    label: "Senior High",
    color: "text-purple-400",
    bgColor: "bg-purple-500/20",
    icon: <GraduationCap className="w-3.5 h-3.5" />,
  },
};

const MARIVELES_BARANGAYS = [
  "Alas-asin",
  "Alion",
  "Balon-Anito",
  "Baseco Country (Bataan Shipyard)",
  "Batangas II",
  "Biaan",
  "Cabcaben",
  "Camaya",
  "Casili (Cataning)",
  "Ipag",
  "Lucanin",
  "Malaya",
  "Maligaya",
  "Mt. View",
  "Poblacion",
  "San Carlos",
  "San Isidro",
  "Sisiman",
  "Townsite",
];

export default function RegisterPage({
  params,
}: {
  params: { token: string };
}) {
  const { token } = params;

  const [validating, setValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [tokenError, setTokenError] = useState("");
  const [linkLabel, setLinkLabel] = useState("");
  const [educationLevel, setEducationLevel] = useState<EducationLevel | null>(null);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [barangay, setBarangay] = useState("");
  const [street, setStreet] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  const [credentials, setCredentials] = useState<{
    email: string;
    password: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);

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
          setEducationLevel(data.educationLevel || null);
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
    if (!barangay) newErrors.barangay = "Please select your barangay";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsLoading(true);

    const address = street.trim()
      ? `${street.trim()}, ${barangay}, Mariveles, Bataan`
      : `${barangay}, Mariveles, Bataan`;

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          email,
          fullName,
          address,
          barangay,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        setCredentials({
          email: data.credentials?.email || email,
          password: data.credentials?.password || "",
        });
        setSuccess(true);
      } else {
        setErrors({ submit: data.error || "Registration failed" });
        setIsLoading(false);
      }
    } catch {
      setErrors({ submit: "An error occurred. Please try again." });
      setIsLoading(false);
    }
  };

  const copyCredentials = async () => {
    if (!credentials) return;
    const text = `Iskolar ng Mariveles - Account Credentials\nEmail: ${credentials.email}\nPassword: ${credentials.password}`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyEmail = async () => {
    if (!credentials) return;
    await navigator.clipboard.writeText(credentials.email);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const copyPassword = async () => {
    if (!credentials) return;
    await navigator.clipboard.writeText(credentials.password);
    setCopiedPassword(true);
    setTimeout(() => setCopiedPassword(false), 2000);
  };

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

  if (success && credentials) {
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
            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-400" />
            </div>
            <h1 className="font-heading text-2xl font-bold text-white mb-2">
              Registration Successful!
            </h1>
            <p className="font-body text-white/70 mb-6">
              Your account has been created. Below are your login credentials.
              Please save them.
            </p>

            <div className="bg-white/10 backdrop-blur rounded-2xl p-5 text-left mb-6 space-y-3">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-body text-white/50 mb-0.5">
                    Email (Username)
                  </p>
                  <p className="text-sm font-mono font-semibold text-white break-all">
                    {credentials.email}
                  </p>
                </div>
                <button
                  onClick={copyEmail}
                  className="ml-3 flex-shrink-0 p-2 rounded-lg hover:bg-white/10 transition-colors"
                  aria-label="Copy email"
                >
                  {copiedEmail ? (
                    <Check className="w-4 h-4 text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4 text-white/50" />
                  )}
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-body text-white/50 mb-0.5">
                    Password
                  </p>
                  <p className="text-sm font-mono font-semibold text-white">
                    {credentials.password}
                  </p>
                </div>
                <button
                  onClick={copyPassword}
                  className="ml-3 flex-shrink-0 p-2 rounded-lg hover:bg-white/10 transition-colors"
                  aria-label="Copy password"
                >
                  {copiedPassword ? (
                    <Check className="w-4 h-4 text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4 text-white/50" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <Button
                onClick={copyCredentials}
                variant="outline"
                className="w-full"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy All Credentials
                  </>
                )}
              </Button>
              <Button
                onClick={() => (window.location.href = "/")}
                className="w-full !bg-green-600 hover:!bg-green-700 text-white"
              >
                Go to Login
              </Button>
            </div>

            <p className="text-xs font-body text-white/50 mt-4">
              You can change your password after logging in.
            </p>
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
          <div className="text-center mb-6">
            <Image
              src="/mariveles-seal.png"
              alt="Bayan ng Mariveles seal"
              width={80}
              height={80}
              className="mx-auto mb-3"
              priority
            />
            <h1 className="font-heading text-2xl font-bold text-white mb-1">
              Online Registration
            </h1>
            {educationLevel && (
              <div className="flex justify-center mb-2">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${EDUCATION_LEVEL_CONFIG[educationLevel].bgColor} ${EDUCATION_LEVEL_CONFIG[educationLevel].color}`}>
                  {EDUCATION_LEVEL_CONFIG[educationLevel].icon}
                  {EDUCATION_LEVEL_CONFIG[educationLevel].label}
                </span>
              </div>
            )}
            {linkLabel && (
              <p className="text-sm font-body text-ocean-400">{linkLabel}</p>
            )}
            <p className="text-xs font-body text-white/70 mt-1">
              Iskolar ng Mariveles Scholarship System
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
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

            <div>
              <label className="block text-xs font-body text-muted-fg mb-1">
                Barangay{" "}
                <span className="text-ocean-400">(Mariveles, Bataan)</span>
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-fg" />
                <select
                  value={barangay}
                  onChange={(e) => {
                    setBarangay(e.target.value);
                    setErrors((p) => ({ ...p, barangay: "" }));
                  }}
                  className={`w-full bg-muted border-2 rounded-xl pl-10 pr-4 py-2.5 text-sm font-body text-foreground focus:outline-none focus:ring-2 transition-all appearance-none ${
                    errors.barangay
                      ? "border-coral-400 focus:border-coral-400 focus:ring-coral-400/20"
                      : "border-transparent focus:border-ocean-400 focus:ring-ocean-400/20"
                  } ${!barangay ? "text-muted-fg" : ""}`}
                >
                  <option value="">Select your barangay</option>
                  {MARIVELES_BARANGAYS.map((brgy) => (
                    <option key={brgy} value={brgy}>
                      {brgy}
                    </option>
                  ))}
                </select>
              </div>
              {errors.barangay && (
                <p className="text-xs text-coral-400 mt-1">{errors.barangay}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-body text-muted-fg mb-1">
                Street / Purok / Sitio{" "}
                <span className="text-muted-fg/60">(optional)</span>
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-fg" />
                <input
                  type="text"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  placeholder="e.g. Purok 3, Sampaguita St."
                  className="w-full bg-muted border-2 border-transparent rounded-xl pl-10 pr-4 py-2.5 text-sm font-body text-foreground placeholder:text-muted-fg focus:outline-none focus:ring-2 focus:border-ocean-400 focus:ring-ocean-400/20 transition-all"
                />
              </div>
            </div>

            {errors.submit && (
              <div className="bg-coral-50 dark:bg-coral-500/10 border border-coral-200 dark:border-coral-500/20 rounded-xl px-4 py-3">
                <p className="text-sm text-coral-500 font-body">
                  {errors.submit}
                </p>
              </div>
            )}

            <Button
              type="submit"
              size="lg"
              isLoading={isLoading}
              className="w-full"
            >
              Register
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
