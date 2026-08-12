"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

type Props = {
  from?: number;
  onComplete: () => void;
};

export default function CountdownModal({ from = 3, onComplete }: Props) {
  const [count, setCount] = useState(from);

  useEffect(() => {
    if (count <= 0) {
      onComplete();
      return;
    }
    const t = setTimeout(() => setCount((c) => c - 1), 800);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count]);

  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-center text-[14px] font-medium uppercase tracking-wide text-white/70">Locking it in…</p>
      <AnimatePresence mode="wait">
        <motion.div
          key={count}
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 1.4, opacity: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="flex h-40 w-40 items-center justify-center rounded-full"
        >
          <span className="text-[80px] font-black text-white">{count > 0 ? count : "GO"}</span>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
