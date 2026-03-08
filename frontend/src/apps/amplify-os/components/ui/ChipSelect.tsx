
interface ChipSelectProps {
  label?: string;
  options: string[];
  selected: string[];
  onToggle: (option: string) => void;
  multiSelect?: boolean;
}

export default function ChipSelect({
  label,
  options,
  selected,
  onToggle,
  multiSelect = true,
}: ChipSelectProps) {
  function handleClick(option: string) {
    if (!multiSelect && !selected.includes(option)) {
      onToggle(option);
    } else {
      onToggle(option);
    }
  }

  return (
    <div className="space-y-2">
      {label && (
        <span className="block text-sm font-medium text-[var(--foreground)]">
          {label}
        </span>
      )}
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const isSelected = selected.includes(option);
          return (
            <button
              key={option}
              type="button"
              onClick={() => handleClick(option)}
              className={`
                rounded-full px-3.5 py-1.5 text-sm font-medium
                transition-all duration-200
                ${
                  isSelected
                    ? "bg-[var(--foreground)] text-[var(--background)]"
                    : "border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground-muted)] hover:border-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                }
              `}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}
