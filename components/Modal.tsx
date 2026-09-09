"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ReactNode, useEffect, useState } from "react";
import { createPortal } from "react-dom";

type Props = {
  open: boolean;
  onClose?: () => void;
  dismissible?: boolean;
  contentClassName?: string;
  children: ReactNode;
};

export default function Modal({ open, onClose, dismissible = false, contentClassName = "w-full max-w-sm", children }: Props) {
  // Portaled straight to <body> so this always covers the real viewport,
  // regardless of nesting depth — a `position: fixed` element is otherwise
  // trapped inside the nearest ancestor with a `transform` (which framer-motion
  // sets inline for scale/slide animations), so a Modal rendered inside
  // another animated Modal would render squashed inside it instead of on top.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-[2px]"
          onClick={() => dismissible && onClose?.()}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 12 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className={contentClassName}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
