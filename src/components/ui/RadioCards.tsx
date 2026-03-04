"use client";

interface RadioOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

interface RadioCardsProps {
  label?: string;
  options: RadioOption[];
  value: string;
  onChange: (value: string) => void;
}

export default function RadioCards({
  label,
  options,
  value,
  onChange,
}: RadioCardsProps) {
  return (
    <div className="space-y-2">
      {label && (
        <span className="block text-sm font-medium text-[var(--foreground)]">
          {label}
        </span>
      )}
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {options.map((option) => {
          const isSelected = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => !option.disabled && onChange(option.value)}
              disabled={option.disabled}
              className={`
                w-full text-left rounded-[var(--radius)] border px-4 py-3
                transition-all duration-200
                ${
                  isSelected
                    ? "border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)]"
                    : option.disabled
                      ? "border-[var(--border)] bg-[var(--fill-subtle)] text-[var(--foreground-muted)] opacity-50 cursor-not-allowed"
                      : "border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] hover:border-[var(--foreground-muted)] hover:bg-[var(--fill-subtle)] cursor-pointer"
                }
              `}
            >
              <span className="text-sm font-medium">{option.label}</span>
              {option.description && (
                <span
                  className={`mt-0.5 block text-xs ${
                    isSelected ? "opacity-70" : "text-[var(--foreground-muted)]"
                  }`}
                >
                  {option.description}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
