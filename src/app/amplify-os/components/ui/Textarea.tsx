"use client";

import { type TextareaHTMLAttributes } from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  charLimit?: number;
  charCount?: number;
}

export default function Textarea({
  label,
  hint,
  charLimit,
  charCount,
  className = "",
  id,
  ...props
}: TextareaProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="space-y-1.5">
      {label && (
        <div className="flex items-center justify-between">
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-[var(--foreground)]"
          >
            {label}
          </label>
          {charLimit !== undefined && charCount !== undefined && (
            <span
              className={`text-xs ${
                charCount > charLimit
                  ? "text-red-500"
                  : "text-[var(--foreground-muted)]"
              }`}
            >
              {charCount}/{charLimit}
            </span>
          )}
        </div>
      )}
      <textarea
        id={inputId}
        className={`
          w-full rounded-[var(--radius)] border border-[var(--border)]
          bg-[var(--surface)] px-3.5 py-2.5 text-sm text-[var(--foreground)]
          placeholder:text-[var(--foreground-muted)]
          transition-colors duration-200 resize-none
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
