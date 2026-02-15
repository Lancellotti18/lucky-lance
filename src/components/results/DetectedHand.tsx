"use client";

import { motion } from "motion/react";
import type { Card } from "@/engine/types";
import CardIcon from "@/components/cards/CardIcon";

interface DetectedHandProps {
  holeCards: Card[];
  boardCards: Card[];
}

export default function DetectedHand({
  holeCards,
  boardCards,
}: DetectedHandProps) {
  return (
    <div className="space-y-4">
      {/* Hole Cards */}
      <div>
        <h4 className="text-casino-muted text-xs uppercase tracking-wider mb-2">
          Your Hand
        </h4>
        <div className="flex gap-2">
          {holeCards.map((card, i) => (
            <motion.div
              key={card}
              initial={{ opacity: 0, rotateY: 180 }}
              animate={{ opacity: 1, rotateY: 0 }}
              transition={{ delay: i * 0.15, duration: 0.4 }}
            >
              <CardIcon card={card} size="md" />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Board Cards */}
      {boardCards.length > 0 && (
        <div>
          <h4 className="text-casino-muted text-xs uppercase tracking-wider mb-2">
            Board
          </h4>
          <div className="flex gap-2">
            {boardCards.map((card, i) => (
              <motion.div
                key={card}
                initial={{ opacity: 0, rotateY: 180 }}
                animate={{ opacity: 1, rotateY: 0 }}
                transition={{
                  delay: holeCards.length * 0.15 + i * 0.1,
                  duration: 0.4,
                }}
              >
                <CardIcon card={card} size="md" />
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
