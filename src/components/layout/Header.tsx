"use client";

import { cn } from "@/utils/cn";
import Image from "next/image";
import { useUIStore } from "@/stores/ui-store";

export default function Header() {
  const { toggleNav, isNavOpen } = useUIStore();

  return (
    <header className="fixed top-0 left-0 right-0 z-40 safe-area-top">
      <div className="flex items-center justify-between px-4 py-3 bg-casino-black/80 backdrop-blur-md border-b border-white/5">
        {/* Hamburger Menu */}
        <button
          onClick={toggleNav}
          className="w-10 h-10 flex flex-col items-center justify-center gap-1.5 rounded-lg hover:bg-white/5 transition-colors"
          aria-label="Toggle navigation menu"
        >
          <span
            className={cn(
              "w-5 h-0.5 bg-casino-text transition-all duration-300",
              isNavOpen && "rotate-45 translate-y-2"
            )}
          />
          <span
            className={cn(
              "w-5 h-0.5 bg-casino-text transition-all duration-300",
              isNavOpen && "opacity-0"
            )}
          />
          <span
            className={cn(
              "w-5 h-0.5 bg-casino-text transition-all duration-300",
              isNavOpen && "-rotate-45 -translate-y-2"
            )}
          />
        </button>

        {/* Crown Logo */}
        <div className="flex items-center gap-2">
          <Image
            src="/images/crown-logo.svg"
            alt="Lucky Lance"
            width={28}
            height={22}
          />
        </div>

        {/* Spacer for symmetry */}
        <div className="w-10 h-10" />
      </div>
    </header>
  );
}
