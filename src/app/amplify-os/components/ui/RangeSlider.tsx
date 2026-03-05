"use client";

import * as Slider from "@radix-ui/react-slider";

interface RangeSliderProps {
  label: string;
  min: number;
  max: number;
  step?: number;
  value: number[];
  onValueChange: (value: number[]) => void;
  formatValue?: (value: number) => string;
}

export default function RangeSlider({
  label,
  min,
  max,
  step = 1,
  value,
  onValueChange,
  formatValue = (v) => String(v),
}: RangeSliderProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-[var(--foreground)]">
          {label}
        </span>
        <span className="text-sm text-[var(--foreground-muted)]">
          {value.length === 2
            ? `${formatValue(value[0])} – ${formatValue(value[1])}`
            : formatValue(value[0])}
        </span>
      </div>
      <Slider.Root
        className="relative flex h-5 w-full touch-none select-none items-center"
        min={min}
        max={max}
        step={step}
        value={value}
        onValueChange={onValueChange}
      >
        <Slider.Track className="relative h-1 w-full grow rounded-full bg-[var(--border)]">
          <Slider.Range className="absolute h-full rounded-full bg-[var(--foreground)]" />
        </Slider.Track>
        {value.map((_, i) => (
          <Slider.Thumb
            key={i}
            className="block h-4 w-4 rounded-full border-2 border-[var(--foreground)] bg-[var(--background)] transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--foreground)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]"
          />
        ))}
      </Slider.Root>
    </div>
  );
}
