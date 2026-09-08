"use client";

import { Fragment, useState } from "react";
import { TERMS_COPY, TermsBullet, TermsCopy, TermsSection, TermsTable } from "@/lib/termsCopy";
import CloseButton from "./CloseButton";

type ConsentProps = {
  mode?: "consent";
  game: "TRADE" | "SPIN";
  onAccept: () => void | Promise<void>;
  onDecline: () => void;
};

// Read-only mode — shown to reference specific copy (e.g. the Funded Account
// reward terms from the Spin & Win result screen) without an accept/decline
// gate, since the relevant action (playing, winning) already happened.
type InfoProps = {
  mode: "info";
  copy: TermsCopy;
  onClose: () => void;
};

type Props = ConsentProps | InfoProps;

export default function TermsModal(props: Props) {
  const isInfo = props.mode === "info";
  const copy = isInfo ? props.copy : TERMS_COPY[props.game];
  const [accepted, setAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const dismiss = isInfo ? props.onClose : props.onDecline;

  async function handleAccept() {
    if (isInfo) return;
    setSubmitting(true);
    try {
      await props.onAccept();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative flex h-[50vh] max-h-[80vh] flex-col overflow-hidden rounded-[28px] bg-white font-sans text-black">
      <div className="flex items-start justify-between gap-4 border-b border-black/10 p-6">
        <div>
          <h2 className="text-[16px] font-semibold leading-snug">{copy.title}</h2>
          {copy.subtitle && <p className="mt-1 text-[13px] font-semibold text-[#70757e]">{copy.subtitle}</p>}
        </div>
        <CloseButton onClose={dismiss} className="right-6 top-6" />
      </div>

      <div className="terms-scroll flex-1 overflow-y-auto px-[30px] py-5">
        {copy.sections.map((section) => (
          <Section key={section.number} section={section} />
        ))}
      </div>

      {!isInfo && (
        <div className="flex flex-col gap-4 border-t border-black/10 px-[30px] py-5">
          <label className="flex items-start gap-2 text-[12px] font-normal text-black">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              disabled={submitting}
              className="mt-0.5"
            />
            I have read and accept the Terms &amp; Conditions above.
          </label>
          <div className="flex gap-3">
            <button
              onClick={props.onDecline}
              disabled={submitting}
              className="flex-1 rounded-lg bg-black/5 py-3 text-[14px] font-semibold text-black disabled:opacity-50"
            >
              Decline
            </button>
            <button
              onClick={handleAccept}
              disabled={!accepted || submitting}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-black/20 py-3 text-[14px] font-semibold text-white enabled:bg-brand-red"
            >
              {submitting && (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              )}
              {submitting ? "Please wait…" : "Accept & Continue"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Bullet/paragraph copy uses a lightweight **bold** span syntax (see
// lib/termsCopy.ts) instead of hand-authored JSX for every inline emphasis.
function renderRichText(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={i} className="font-semibold text-black">
        {part.slice(2, -2)}
      </strong>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    )
  );
}

function Bullets({ bullets }: { bullets: TermsBullet[] }) {
  return (
    <ul className="mt-2 flex flex-col gap-2">
      {bullets.map((bullet, i) => (
        <li key={i} className="flex gap-2 text-[14px] leading-[23px] text-[#70757e]">
          <span className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-[#70757e]" />
          <div className="flex-1">
            <span>{renderRichText(bullet.text)}</span>
            {bullet.subBullets && (
              <ul className="mt-2 flex flex-col gap-2 pl-1">
                {bullet.subBullets.map((sub, j) => (
                  <li key={j} className="flex gap-2 text-[14px] leading-[23px] text-[#70757e]">
                    <span className="mt-[1px] shrink-0 text-black/40">○</span>
                    <span>{renderRichText(sub)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

function TableView({ table }: { table: TermsTable }) {
  return (
    <div className="mt-3 overflow-hidden rounded-xl border border-black/10">
      <table className="w-full border-collapse text-left text-[13px]">
        <thead>
          <tr className="bg-brand-red">
            <th className="px-4 py-3 font-semibold text-white">{table.headers[0]}</th>
            <th className="px-4 py-3 font-semibold text-white">{table.headers[1]}</th>
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, i) => (
            <tr key={i} className={i !== table.rows.length - 1 ? "border-b border-black/10" : ""}>
              <td className="px-4 py-3 text-black">{row[0]}</td>
              <td className="px-4 py-3 text-[#70757e]">{row[1]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Section({ section }: { section: TermsSection }) {
  return (
    <div className="pt-5 first:pt-0">
      {section.headingInline ? (
        <p className="text-[14px] leading-[23px] text-[#70757e]">
          <span className="font-semibold text-black">
            {section.number}. {section.heading}
          </span>{" "}
          {section.intro && renderRichText(section.intro)}
        </p>
      ) : (
        <>
          <h3 className="text-[15px] font-semibold text-black">
            {section.unnumbered ? section.heading : `${section.number}. ${section.heading}`}
          </h3>
          {section.intro && <p className="mt-2 text-[14px] leading-[23px] text-[#70757e]">{renderRichText(section.intro)}</p>}
        </>
      )}

      {section.table && <TableView table={section.table} />}

      {section.bullets && <Bullets bullets={section.bullets} />}

      {section.outro && <p className="mt-3 text-[14px] leading-[23px] text-[#70757e]">{renderRichText(section.outro)}</p>}
    </div>
  );
}
