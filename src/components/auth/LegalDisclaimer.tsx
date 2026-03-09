"use client";

interface LegalDisclaimerProps {
  accepted: boolean;
  onToggle: () => void;
}

export default function LegalDisclaimer({
  accepted,
  onToggle,
}: LegalDisclaimerProps) {
  return (
    <div className="flex items-start gap-3">
      <button
        type="button"
        onClick={onToggle}
        className="mt-0.5 flex-shrink-0 w-5 h-5 rounded border border-white/20 bg-casino-dark flex items-center justify-center transition-colors"
        style={{ background: accepted ? "#dc2626" : undefined }}
        aria-checked={accepted}
        role="checkbox"
      >
        {accepted && (
          <svg
            className="w-3 h-3 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        )}
      </button>
      <p className="text-casino-muted text-xs leading-relaxed">
        I agree to the{" "}
        <span className="text-casino-text">Lucky Lance Terms of Service</span>.
        Lucky Lance provides poker analysis tools for educational purposes only.
        We do not guarantee winnings or gambling success. Lucky Lance is not
        responsible for any financial losses incurred while gambling. I confirm
        that I am at least 18 years of age and legally allowed to participate in
        online gaming or poker-related activities in my jurisdiction.
      </p>
    </div>
  );
}
