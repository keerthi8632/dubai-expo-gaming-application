"use client";

import { motion } from "framer-motion";

export default function SpinAgainModal({ onContinue }: { onContinue: () => void }) {
  return (
    <motion.div
      initial={{ scale: 0.7, rotate: -8, opacity: 0 }}
      animate={{ scale: 1, rotate: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 14 }}
      className="flex w-[500px] max-w-[400px] flex-col items-center gap-2 overflow-hidden rounded-[28px] bg-white px-8 py-10 text-center"
    >
      <div className="text-6xl">🔄</div>
      <span className="pt-2 text-center text-[30px] font-bold text-[#1a1a1a]">Spin Again!</span>
      <span className="pt-2 text-center text-[14px] font-normal leading-[21.75px] text-[#70757e]">
        You landed on Spin Again — no win or loss yet. Take another spin!
      </span>
      <button
        onClick={onContinue}
        className="mt-9 flex w-full items-center justify-center gap-4 self-stretch rounded-[14px] bg-black p-4"
      >
        <span className="text-center text-[16px] font-bold text-white">Spin Again</span>
      </button>
    </motion.div>
  );
}
