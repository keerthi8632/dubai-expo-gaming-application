import { SelectHTMLAttributes } from "react";
import { ChevronDown } from "./icons";

type Props = SelectHTMLAttributes<HTMLSelectElement> & { wrapperClassName?: string };

// Native <select> arrows render flush against the right edge with no way to
// reposition them — appearance-none plus our own ChevronDown lets it sit a
// little further in from the edge instead.
export default function AdminSelect({ wrapperClassName = "", className = "", children, ...props }: Props) {
  return (
    <div className={`relative ${wrapperClassName}`}>
      <select
        {...props}
        className={`w-full appearance-none rounded-lg border bg-white px-3 py-2 pr-9 text-sm ${className}`}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-black/50" />
    </div>
  );
}
