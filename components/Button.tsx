"use client";

import clsx from "clsx";
import { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary";
  size?: "md" | "lg";
};

export default function Button({ variant = "primary", size = "md", className, children, ...props }: Props) {
  return (
    <button
      {...props}
      className={clsx(
        "rounded-full font-semibold tracking-wide transition-transform active:scale-95 disabled:opacity-50 disabled:active:scale-100",
        variant === "primary" && "bg-brand-red text-white shadow-[0_0_20px_rgba(179,18,23,0.5)]",
        variant === "secondary" && "bg-black text-white",
        size === "md" && "px-6 py-2.5 text-sm",
        size === "lg" && "px-8 py-4 text-base",
        className
      )}
    >
      {children}
    </button>
  );
}
