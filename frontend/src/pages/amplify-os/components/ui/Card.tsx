
import { type HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "interactive" | "selected";
  padding?: "sm" | "md" | "lg";
}

export default function Card({
  variant = "default",
  padding = "md",
  className = "",
  children,
  ...props
}: CardProps) {
  const base =
    "rounded-[var(--radius-lg)] border bg-[var(--surface)] transition-all duration-200";

  const variants = {
    default: "border-[var(--border)] shadow-[var(--shadow-sm)]",
    interactive:
      "border-[var(--border)] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] hover:border-[var(--foreground-muted)] cursor-pointer",
    selected:
      "border-[var(--foreground)] shadow-[var(--shadow-md)] ring-1 ring-[var(--foreground)]",
  };

  const paddings = {
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
  };

  return (
    <div
      className={`${base} ${variants[variant]} ${paddings[padding]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
