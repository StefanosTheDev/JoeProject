
import { type ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
}

export default function Button({
  variant = "primary",
  size = "md",
  className = "",
  disabled,
  children,
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center font-medium transition-all duration-200 rounded-[var(--radius)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--foreground)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] disabled:opacity-40 disabled:cursor-not-allowed";

  const variants = {
    primary:
      "bg-[var(--foreground)] text-[var(--background)] hover:opacity-90 active:opacity-80",
    secondary:
      "border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] hover:bg-[var(--fill-subtle)] active:bg-[var(--border)]",
    ghost:
      "text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--fill-subtle)]",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-2.5 text-base",
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
