"use client";

import { motion, AnimatePresence } from "motion/react";
import { useUIStore } from "@/stores/ui-store";
import { useGameStore } from "@/stores/game-store";
import { useAuthStore } from "@/stores/auth-store";
import { useTheme } from "@/components/ui/ThemeProvider";
import Select from "@/components/ui/Select";
import Toggle from "@/components/ui/Toggle";
import { VARIANT_LABELS } from "@/engine/types";
import type { PokerVariant } from "@/engine/types";
import Image from "next/image";

const VARIANT_OPTIONS = Object.entries(VARIANT_LABELS).map(
  ([value, label]) => ({
    value,
    label,
  })
);

interface SideNavProps {
  onSignOut?: () => void;
}

export default function SideNav({ onSignOut }: SideNavProps) {
  const { isNavOpen, closeNav, setScreen } = useUIStore();
  const { variant, setVariant, gtoMode, setGtoMode, resetHand } = useGameStore();
  const { user } = useAuthStore();
  const { theme, toggle: toggleTheme } = useTheme();

  return (
    <AnimatePresence>
      {isNavOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeNav}
            className="fixed inset-0 bg-black/50 z-40"
          />

          {/* Nav Panel */}
          <motion.nav
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed left-0 top-0 bottom-0 w-72 bg-casino-grey z-50 safe-area-top safe-area-bottom"
          >
            <div className="flex flex-col h-full p-6">
              {/* Nav Header */}
              <div className="flex items-center gap-3 mb-8 pt-2">
                <Image
                  src="/images/crown-logo.svg"
                  alt="Lucky Lance"
                  width={32}
                  height={26}
                />
                <span className="text-casino-red font-display text-xl font-bold">
                  Lucky Lance
                </span>
              </div>

              {/* Poker Variant */}
              <div className="mb-6">
                <Select
                  label="Poker Variant"
                  value={variant}
                  onChange={(v) => setVariant(v as PokerVariant)}
                  options={VARIANT_OPTIONS}
                />
              </div>

              {/* Toggles */}
              <div className="space-y-4 mb-6">
                <Toggle
                  label="GTO Explanation Mode"
                  checked={gtoMode}
                  onChange={setGtoMode}
                />
                <Toggle
                  label="Dark Mode"
                  checked={theme === "dark"}
                  onChange={toggleTheme}
                />
              </div>

              {/* Divider */}
              <div className="border-t border-white/10 my-4" />

              {/* User Info */}
              {user && (
                <div className="bg-casino-dark rounded-xl p-3 mb-4 border border-white/10">
                  <p className="text-casino-text text-sm font-semibold">{user.firstName}</p>
                  <p className="text-casino-muted text-xs mt-0.5">{user.email}</p>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/10">
                    <span className="text-casino-muted text-xs capitalize">
                      {user.founderStatus ? "👑 Founder" : user.subscriptionPlan.replace("_", " ")}
                    </span>
                    <span className="text-casino-muted text-xs">
                      {user.monthlyUploadLimit === null
                        ? "∞ uploads"
                        : `${user.uploadCount}/${user.monthlyUploadLimit}`}
                    </span>
                  </div>
                </div>
              )}

              {/* Menu Items */}
              <div className="space-y-1">
                <button
                  className="w-full text-left px-3 py-2.5 text-casino-red text-sm font-semibold rounded-lg hover:bg-casino-red/10 transition-colors"
                  onClick={() => {
                    resetHand();
                    useUIStore.getState().reset();
                    closeNav();
                  }}
                >
                  Reset Hand
                </button>
                {user && user.subscriptionPlan !== "founder" && (
                  <button
                    className="w-full text-left px-3 py-2.5 text-casino-gold text-sm font-semibold rounded-lg hover:bg-casino-gold/10 transition-colors"
                    onClick={() => {
                      useUIStore.getState().setScreen("pricing");
                      closeNav();
                    }}
                  >
                    Upgrade Plan
                  </button>
                )}
                {onSignOut && (
                  <button
                    className="w-full text-left px-3 py-2.5 text-casino-muted text-sm rounded-lg hover:bg-white/5 hover:text-casino-text transition-colors"
                    onClick={() => {
                      closeNav();
                      onSignOut();
                    }}
                  >
                    Sign Out
                  </button>
                )}
              </div>

              {/* Footer */}
              <div className="mt-auto pt-4 border-t border-white/10">
                <p className="text-casino-muted text-xs">
                  Lucky Lance v0.1.0
                </p>
                <p className="text-casino-muted text-xs mt-1">
                  Lucky Lance provides analysis for educational purposes only.
                  Not responsible for gambling losses. 18+ only.
                </p>
              </div>
            </div>
          </motion.nav>
        </>
      )}
    </AnimatePresence>
  );
}
