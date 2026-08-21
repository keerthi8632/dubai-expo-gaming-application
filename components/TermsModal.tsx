"use client";

import { useState } from "react";
import { TERMS_COPY, TermsSection } from "@/lib/termsCopy";
import CloseButton from "./CloseButton";

type Props = {
  game: "TRADE" | "SPIN";
  onAccept: () => void;
  onDecline: () => void;
};

export default function TermsModal({ game, onAccept, onDecline }: Props) {
  const copy = TERMS_COPY[game];
  const [accepted, setAccepted] = useState(false);

  return (
    <div className="relative flex max-h-[90vh] flex-col overflow-hidden rounded-[28px] bg-white font-space-grotesk text-black">
      <div className="flex items-start justify-between gap-4 border-b border-black/10 p-6">
        <div>
          <h2 className="text-[24px] font-semibold">{copy.title}</h2>
          <p className="mt-1 text-[14px] text-[#70757E] font-normal">{copy.subtitle}</p>
        </div>
        <CloseButton onClose={onDecline} className="right-6 top-6" />
      </div>

      <div className="no-scrollbar flex-1 overflow-y-auto px-[30px] py-5">
        {copy.sections.map((section) => (
          <Section key={section.heading} section={section} />
        ))}
      </div>

      <div className="flex flex-col gap-4 border-t border-black/10 px-[30px] py-5">
        <label className="flex font-normal items-start gap-2 text-[12px] text-[#000000]">
          <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} className="mt-0.5" />
          I have read and accept the Prize Terms & Conditions above.
        </label>
        <div className="flex gap-3">
          <button onClick={onDecline} className="flex-1 rounded-lg bg-black/5 py-3 text-[14px] font-semibold text-black">
            Decline
          </button>
          <button
            onClick={onAccept}
            disabled={!accepted}
            className="flex-1 rounded-lg bg-black/20 py-3 text-[14px] font-semibold text-white enabled:bg-brand-red"
          >
            Accept & Continue
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({ section }: { section: TermsSection }) {
  return (
    <div className="flex flex-col self-stretch pt-[18px] first:pt-0">
      <span className="text-[16px] font-semibold leading-[23.1px] text-black">{section.heading}</span>

      {section.intro && (
        <p className="mt-1.5 text-[14px] leading-[23px] text-[#70757e]">{section.intro}</p>
      )}

      {section.facts && (
        <dl className="mt-3 flex flex-col gap-1.5">
          {section.facts.map((fact) => (
            <div key={fact.label} className="text-[14px] leading-[23px] text-[#70757e]">
              <span className="font-semibold text-black">{fact.label}</span> {fact.text}
            </div>
          ))}
        </dl>
      )}

      {section.bullets && (
        <ul className="mt-1.5 flex flex-col gap-1.5">
          {section.bullets.map((bullet, i) => (
            <li key={i} className="flex gap-2 text-[14px] leading-[23px] text-[#70757e]">
              <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[#70757e]" />
              <span>{bullet}</span>
            </li>
          ))}
        </ul>
      )}

      {section.outro && <p className="mt-1.5 text-[14px] leading-[23px] text-[#70757e]">{section.outro}</p>}
    </div>
  );
}
