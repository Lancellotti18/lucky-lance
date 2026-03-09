"use client";

import { cn } from "@/utils/cn";

interface CardInputProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  error?: string;
  maxLength?: number;
  inputMode?: "numeric" | "text";
}

export default function CardInput({
  label,
  value,
  onChange,
  placeholder,
  error,
  maxLength,
  inputMode = "text",
}: CardInputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-casino-muted text-xs uppercase tracking-wider">
        {label}
      </label>
      <input
        type="text"
        inputMode={inputMode}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        className={cn(
          "w-full bg-casino-dark border rounded-lg px-4 py-3 text-casino-text text-base font-mono",
          "placeholder:text-casino-muted/50 placeholder:font-sans",
          "focus:outline-none focus:ring-2 transition-all duration-150",
          error
            ? "border-casino-red focus:ring-casino-red/40"
            : "border-white/10 focus:ring-casino-red/40 focus:border-casino-red/60"
        )}
      />
      {error && <p className="text-casino-red text-xs mt-0.5">{error}</p>}
    </div>
  );
}
