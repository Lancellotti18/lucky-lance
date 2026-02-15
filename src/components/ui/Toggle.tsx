"use client";

import { cn } from "@/utils/cn";

interface ToggleProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
}

export default function Toggle({
  label,
  checked,
  onChange,
  className,
}: ToggleProps) {
  return (
    <label
      className={cn(
        "flex items-center justify-between cursor-pointer",
        className
      )}
    >
      <span className="text-casino-text text-sm">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200",
          checked ? "bg-casino-red" : "bg-casino-grey"
        )}
      >
        <span
          className={cn(
            "inline-block h-4 w-4 rounded-full bg-white transition-transform duration-200",
            checked ? "translate-x-6" : "translate-x-1"
          )}
        />
      </button>
    </label>
  );
}
