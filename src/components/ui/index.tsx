/* ================================================================
   SHARED UI COMPONENTS
   Button, Input, Card, Badge, Progress, Checkbox, Toggle,
   Skeleton, Tooltip, Breadcrumb, Spinner
   ================================================================ */

"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, HelpCircle } from "lucide-react";

/* ======================== BUTTON ======================== */

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const buttonVariants: Record<ButtonVariant, string> = {
  primary:
    "bg-ocean-400 text-white hover:bg-ocean-500 active:bg-ocean-600 shadow-soft hover:shadow-glow focus-visible:ring-2 focus-visible:ring-ocean-300",
  secondary:
    "bg-peach-100 text-ocean-700 hover:bg-peach-200 active:bg-peach-300 dark:bg-peach-300/20 dark:text-peach-200 dark:hover:bg-peach-300/30",
  ghost:
    "bg-transparent text-foreground hover:bg-muted active:bg-card-border dark:hover:bg-muted",
  danger:
    "bg-coral-400 text-white hover:bg-coral-500 active:bg-coral-500 shadow-soft",
  outline:
    "bg-transparent border-2 border-ocean-400 text-ocean-400 hover:bg-ocean-50 dark:hover:bg-ocean-400/10 active:bg-ocean-100",
};

const buttonSizes: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-sm rounded-lg gap-1.5",
  md: "px-5 py-2.5 text-sm rounded-xl gap-2",
  lg: "px-7 py-3.5 text-base rounded-xl gap-2.5",
};

export function Button({
  variant = "primary",
  size = "md",
  isLoading = false,
  leftIcon,
  rightIcon,
  children,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`
        inline-flex items-center justify-center font-body font-medium
        transition-all duration-200 ease-out
        transform active:scale-[0.97] hover:scale-[1.02]
        disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
        ${buttonVariants[variant]}
        ${buttonSizes[size]}
        ${className}
      `}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Spinner size="sm" className="mr-2" />
      ) : leftIcon ? (
        <span className="flex-shrink-0">{leftIcon}</span>
      ) : null}
      {children}
      {rightIcon && !isLoading && (
        <span className="flex-shrink-0">{rightIcon}</span>
      )}
    </button>
  );
}

/* ======================== INPUT ======================== */

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
}

export function Input({
  label,
  error,
  hint,
  leftIcon,
  className = "",
  id,
  ...props
}: InputProps) {
  const inputId = id || label.toLowerCase().replace(/\s/g, "-");

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        {leftIcon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-fg pointer-events-none">
            {leftIcon}
          </span>
        )}
        <input
          id={inputId}
          placeholder=" "
          className={`
            peer w-full bg-input-bg border-2 rounded-xl px-4 py-3 font-body text-foreground
            transition-all duration-200
            placeholder-transparent
            focus:outline-none focus:border-ocean-400 focus:ring-2 focus:ring-ocean-400/20
            hover:border-ocean-300
            ${leftIcon ? "pl-10" : ""}
            ${error ? "border-coral-400 focus:border-coral-400 focus:ring-coral-400/20" : "border-input-border"}
          `}
          aria-invalid={!!error}
          aria-describedby={
            error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined
          }
          {...props}
        />
        <label
          htmlFor={inputId}
          className={`
            absolute top-1/2 -translate-y-1/2 text-muted-fg font-body
            transition-all duration-200 pointer-events-none select-none
            peer-focus:-translate-y-9 peer-focus:scale-[0.85] peer-focus:text-ocean-400 peer-focus:font-medium
            peer-[:not(:placeholder-shown)]:-translate-y-9 peer-[:not(:placeholder-shown)]:scale-[0.85]
            ${leftIcon ? "left-10" : "left-4"}
            ${error ? "peer-focus:text-coral-400" : ""}
          `}
        >
          {label}
        </label>
      </div>
      {error && (
        <p
          id={`${inputId}-error`}
          className="mt-1.5 text-xs text-coral-400 font-body flex items-center gap-1"
          role="alert"
        >
          <span className="inline-block w-1 h-1 rounded-full bg-coral-400" />
          {error}
        </p>
      )}
      {hint && !error && (
        <p
          id={`${inputId}-hint`}
          className="mt-1.5 text-xs text-muted-fg font-body"
        >
          {hint}
        </p>
      )}
    </div>
  );
}

/* ======================== TEXTAREA ======================== */

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
}

export function Textarea({
  label,
  error,
  className = "",
  id,
  ...props
}: TextareaProps) {
  const textareaId = id || label.toLowerCase().replace(/\s/g, "-");

  return (
    <div className={`relative ${className}`}>
      <textarea
        id={textareaId}
        placeholder=" "
        className={`
          peer w-full bg-input-bg border-2 rounded-xl px-4 py-3 font-body text-foreground
          transition-all duration-200 resize-none min-h-[100px]
          placeholder-transparent
          focus:outline-none focus:border-ocean-400 focus:ring-2 focus:ring-ocean-400/20
          ${error ? "border-coral-400" : "border-input-border"}
        `}
        aria-invalid={!!error}
        {...props}
      />
      <label
        htmlFor={textareaId}
        className={`
          absolute left-4 top-3 text-muted-fg font-body
          transition-all duration-200 pointer-events-none
          peer-focus:-translate-y-6 peer-focus:scale-[0.85] peer-focus:text-ocean-400
          peer-[:not(:placeholder-shown)]:-translate-y-6 peer-[:not(:placeholder-shown)]:scale-[0.85]
        `}
      >
        {label}
      </label>
      {error && (
        <p className="mt-1.5 text-xs text-coral-400 font-body" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

/* ======================== CARD ======================== */

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
}

const cardPadding = {
  none: "",
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

export function Card({
  children,
  className = "",
  hover = false,
  padding = "md",
}: CardProps) {
  return (
    <div
      className={`
        bg-card-bg border border-card-border rounded-2xl shadow-soft
        ${hover ? "transition-all duration-300 hover:shadow-soft-lg hover:-translate-y-0.5 cursor-pointer" : ""}
        ${cardPadding[padding]}
        ${className}
      `}
    >
      {children}
    </div>
  );
}

/* ======================== BADGE ======================== */

type BadgeVariant = "success" | "warning" | "error" | "info" | "neutral";

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
}

const badgeStyles: Record<BadgeVariant, string> = {
  success: "bg-sage-100 text-sage-500 dark:bg-sage-500/20 dark:text-sage-300",
  warning:
    "bg-amber-50 text-amber-500 dark:bg-amber-500/20 dark:text-amber-300",
  error: "bg-coral-50 text-coral-500 dark:bg-coral-500/20 dark:text-coral-300",
  info: "bg-ocean-50 text-ocean-400 dark:bg-ocean-400/20 dark:text-ocean-200",
  neutral: "bg-muted text-muted-fg",
};

const dotStyles: Record<BadgeVariant, string> = {
  success: "bg-sage-400",
  warning: "bg-amber-400",
  error: "bg-coral-400",
  info: "bg-ocean-400",
  neutral: "bg-muted-fg",
};

export function Badge({
  variant = "neutral",
  children,
  className = "",
  dot = false,
}: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full
        text-xs font-medium font-body
        ${badgeStyles[variant]}
        ${className}
      `}
    >
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full ${dotStyles[variant]}`} />
      )}
      {children}
    </span>
  );
}

/* ======================== PROGRESS BAR ======================== */

interface ProgressProps {
  value: number; // 0-100
  label?: string;
  showValue?: boolean;
  size?: "sm" | "md" | "lg";
  color?: "ocean" | "sage" | "peach" | "coral" | "amber";
  className?: string;
}

const progressColors = {
  ocean: "bg-ocean-400",
  sage: "bg-sage-400",
  peach: "bg-peach-400",
  coral: "bg-coral-400",
  amber: "bg-amber-400",
};

const progressTrackSize = {
  sm: "h-1.5",
  md: "h-2.5",
  lg: "h-4",
};

export function ProgressBar({
  value,
  label,
  showValue = true,
  size = "md",
  color = "ocean",
  className = "",
}: ProgressProps) {
  const clampedValue = Math.min(100, Math.max(0, value));

  return (
    <div className={className}>
      {(label || showValue) && (
        <div className="flex justify-between items-center mb-1.5">
          {label && (
            <span className="text-sm font-body text-foreground">{label}</span>
          )}
          {showValue && (
            <span className="text-sm font-body font-medium text-muted-fg">
              {clampedValue}%
            </span>
          )}
        </div>
      )}
      <div
        className={`w-full bg-muted rounded-full overflow-hidden ${progressTrackSize[size]}`}
        role="progressbar"
        aria-valuenow={clampedValue}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label || "Progress"}
      >
        <div
          className={`${progressColors[color]} ${progressTrackSize[size]} rounded-full transition-all duration-700 ease-out`}
          style={{
            width: `${clampedValue}%`,
            ["--progress-width" as string]: `${clampedValue}%`,
          }}
        />
      </div>
    </div>
  );
}

/* ======================== CIRCULAR PROGRESS ======================== */

interface CircularProgressProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  className?: string;
  children?: React.ReactNode;
}

export function CircularProgress({
  value,
  size = 80,
  strokeWidth = 6,
  color = "#4A6FA5",
  className = "",
  children,
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset =
    circumference - (Math.min(100, Math.max(0, value)) / 100) * circumference;

  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
    >
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--muted)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      {children && (
        <div className="absolute inset-0 flex items-center justify-center">
          {children}
        </div>
      )}
    </div>
  );
}

/* ======================== CHECKBOX ======================== */

interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  className?: string;
  id?: string;
}

export function Checkbox({
  checked,
  onChange,
  label,
  className = "",
  id,
}: CheckboxProps) {
  const checkboxId =
    id || `checkbox-${Math.random().toString(36).substring(7)}`;

  return (
    <label
      htmlFor={checkboxId}
      className={`inline-flex items-center gap-2.5 cursor-pointer group ${className}`}
    >
      <div className="relative">
        <input
          type="checkbox"
          id={checkboxId}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only peer"
        />
        <div
          className={`
            w-5 h-5 rounded-md border-2 transition-all duration-200
            flex items-center justify-center
            group-hover:border-ocean-300
            peer-focus-visible:ring-2 peer-focus-visible:ring-ocean-400/30
            ${
              checked
                ? "bg-ocean-400 border-ocean-400"
                : "bg-input-bg border-input-border"
            }
          `}
        >
          {checked && (
            <svg
              className="w-3 h-3 text-white animate-check-pop"
              viewBox="0 0 12 12"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M2 6 L5 9 L10 3"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </div>
      </div>
      {label && (
        <span
          className={`text-sm font-body select-none transition-colors ${checked ? "text-foreground" : "text-muted-fg"}`}
        >
          {label}
        </span>
      )}
    </label>
  );
}

/* ======================== TOGGLE SWITCH ======================== */

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  className?: string;
}

export function Toggle({
  checked,
  onChange,
  label,
  className = "",
}: ToggleProps) {
  return (
    <label
      className={`inline-flex items-center gap-3 cursor-pointer ${className}`}
    >
      <div className="relative">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only peer"
          role="switch"
          aria-checked={checked}
        />
        <div
          className={`
            w-11 h-6 rounded-full transition-colors duration-300
            ${checked ? "bg-ocean-400" : "bg-input-border"}
          `}
        />
        <div
          className={`
            absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full
            shadow-sm transition-transform duration-300 ease-out
            ${checked ? "translate-x-5" : "translate-x-0"}
          `}
        />
      </div>
      {label && (
        <span className="text-sm font-body text-foreground">{label}</span>
      )}
    </label>
  );
}

/* ======================== SKELETON ======================== */

interface SkeletonProps {
  className?: string;
  variant?: "text" | "circular" | "rectangular";
  width?: string | number;
  height?: string | number;
}

export function Skeleton({
  className = "",
  variant = "text",
  width,
  height,
}: SkeletonProps) {
  const baseClasses =
    "bg-muted animate-shimmer bg-[length:200%_100%] bg-gradient-to-r from-muted via-card-bg to-muted";

  const variantClasses = {
    text: "rounded-md h-4",
    circular: "rounded-full",
    rectangular: "rounded-xl",
  };

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={{ width, height }}
      aria-hidden="true"
    />
  );
}

/* ======================== TOOLTIP ======================== */

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: "top" | "bottom" | "left" | "right";
}

export function Tooltip({ content, children, position = "top" }: TooltipProps) {
  const [show, setShow] = useState(false);

  const positionClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onFocus={() => setShow(true)}
      onBlur={() => setShow(false)}
    >
      {children}
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={`
              absolute z-50 ${positionClasses[position]}
              bg-ocean-800 dark:bg-ocean-200 text-white dark:text-ocean-800
              text-xs font-body px-3 py-1.5 rounded-lg
              whitespace-nowrap pointer-events-none shadow-lg
            `}
            role="tooltip"
          >
            {content}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ======================== BREADCRUMB ======================== */

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumb({ items, className = "" }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex items-center gap-1.5 text-sm font-body">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-1.5">
            {i > 0 && (
              <ChevronRight
                className="w-3.5 h-3.5 text-muted-fg"
                aria-hidden="true"
              />
            )}
            {item.href && i < items.length - 1 ? (
              <a
                href={item.href}
                className="text-muted-fg hover:text-ocean-400 transition-colors"
              >
                {item.label}
              </a>
            ) : (
              <span
                className={
                  i === items.length - 1
                    ? "text-foreground font-medium"
                    : "text-muted-fg"
                }
              >
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

/* ======================== SPINNER ======================== */

interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const spinnerSizes = {
  sm: "w-4 h-4",
  md: "w-6 h-6",
  lg: "w-10 h-10",
};

export function Spinner({ size = "md", className = "" }: SpinnerProps) {
  return (
    <div
      className={`${spinnerSizes[size]} animate-spinner-rotate ${className}`}
      role="status"
      aria-label="Loading"
    >
      <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          className="opacity-20"
        />
        <path
          d="M12 2 a10 10 0 0 1 10 10"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

/* ======================== HELP TOOLTIP ICON ======================== */

export function HelpTip({ content }: { content: string }) {
  return (
    <Tooltip content={content}>
      <button
        type="button"
        className="text-muted-fg hover:text-ocean-400 transition-colors"
        aria-label="Help"
      >
        <HelpCircle className="w-4 h-4" />
      </button>
    </Tooltip>
  );
}

/* ======================== SELECT DROPDOWN ======================== */

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: { label: string; value: string }[];
  error?: string;
}

export function Select({
  label,
  options,
  error,
  className = "",
  id,
  ...props
}: SelectProps) {
  const selectId = id || label.toLowerCase().replace(/\s/g, "-");

  return (
    <div className={className}>
      <label
        htmlFor={selectId}
        className="block text-sm font-body font-medium text-foreground mb-1.5"
      >
        {label}
      </label>
      <select
        id={selectId}
        className={`
          w-full bg-input-bg border-2 rounded-xl px-4 py-3 font-body text-foreground
          transition-all duration-200 appearance-none
          focus:outline-none focus:border-ocean-400 focus:ring-2 focus:ring-ocean-400/20
          ${error ? "border-coral-400" : "border-input-border"}
        `}
        aria-invalid={!!error}
        {...props}
      >
        <option value="">Select...</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="mt-1.5 text-xs text-coral-400 font-body" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

/* ======================== FILE PILL ======================== */

interface FilePillProps {
  name: string;
  size?: string;
  onRemove?: () => void;
  className?: string;
}

export function FilePill({
  name,
  size,
  onRemove,
  className = "",
}: FilePillProps) {
  return (
    <div
      className={`
        inline-flex items-center gap-2 px-3 py-1.5 rounded-full
        bg-ocean-50 dark:bg-ocean-400/10 border border-ocean-200 dark:border-ocean-400/20
        text-sm font-body text-ocean-600 dark:text-ocean-200
        ${className}
      `}
    >
      <svg
        className="w-4 h-4 flex-shrink-0"
        viewBox="0 0 16 16"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M4 1h5.586L13 4.414V14a1 1 0 01-1 1H4a1 1 0 01-1-1V2a1 1 0 011-1z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path
          d="M9 1v4h4"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
      <span className="truncate max-w-[150px]">{name}</span>
      {size && <span className="text-xs text-muted-fg">{size}</span>}
      {onRemove && (
        <button
          onClick={onRemove}
          className="ml-1 text-muted-fg hover:text-coral-400 transition-colors"
          aria-label={`Remove ${name}`}
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 14 14" fill="none">
            <path
              d="M3 3l8 8M11 3l-8 8"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      )}
    </div>
  );
}
