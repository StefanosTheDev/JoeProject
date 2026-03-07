
interface ToggleCardProps {
  label: string;
  description?: string;
  selected: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

export default function ToggleCard({
  label,
  description,
  selected,
  onToggle,
  disabled = false,
}: ToggleCardProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      className={`
        w-full text-left rounded-[var(--radius)] border px-4 py-3
        transition-all duration-200
        ${
          selected
            ? "border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)]"
            : "border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] hover:border-[var(--foreground-muted)] hover:bg-[var(--fill-subtle)]"
        }
        ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}
      `}
    >
      <span className="text-sm font-medium">{label}</span>
      {description && (
        <span
          className={`mt-0.5 block text-xs ${
            selected ? "opacity-70" : "text-[var(--foreground-muted)]"
          }`}
        >
          {description}
        </span>
      )}
    </button>
  );
}
