"use client";

import { CLOSE_ICON } from "@/lib/media";

type Props = {
  onClose?: () => void;
  className?: string;
};

export default function CloseButton({ onClose, className = "right-3 top-3" }: Props) {
  if (!onClose) return null;
  return (
    <button onClick={onClose} aria-label="Close" className={`absolute z-10 ${className}`} style={{ width: 36, height: 36 }}>
      <span className="absolute inset-[3px] rounded-full bg-white" />
      <img src={CLOSE_ICON} alt="" className="relative h-full w-full" />
    </button>
  );
}
