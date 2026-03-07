
import { type InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
}

export default function Input({
  label,
  hint,
  className = "",
  id,
  ...props
}: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="space-y-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-[var(--foreground)]"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`
          w-full rounded-[var(--radius)] border border-[var(--border)]
          bg-[var(--surface)] px-3.5 py-2.5 text-sm text-[var(--foreground)]
          placeholder:text-[var(--foreground-muted)]
          transition-colors duration-200
          focus:border-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--foreground)]
          disabled:opacity-50 disabled:cursor-not-allowed
          ${className}
        `}
        {...props}
      />
      {hint && (
        <p className="text-xs text-[var(--foreground-muted)]">{hint}</p>
      )}
    </div>
  );
}
