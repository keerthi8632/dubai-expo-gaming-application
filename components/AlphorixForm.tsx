"use client";

import { useEffect } from "react";

type Props = {
  formId: string;
  onSubmitted?: () => void;
};

const ALPHORIX_ORIGIN = "https://alphorix.net";

// Alphorix doesn't publish a postMessage contract for its embedded forms, so
// this listens broadly for anything from the form's own origin whose
// type/event/status field reads like a submission-success signal, rather
// than depending on one exact shape we can't verify.
function looksLikeSubmitSuccess(data: unknown): boolean {
  if (!data || typeof data !== "object") return false;
  const record = data as Record<string, unknown>;
  const signal = [record.type, record.event, record.eventName, record.name, record.status]
    .filter((v): v is string => typeof v === "string")
    .join(" ")
    .toLowerCase();
  return /submit|success/.test(signal);
}

export default function AlphorixForm({ formId, onSubmitted }: Props) {
  useEffect(() => {
    if (!onSubmitted) return;

    function handleMessage(event: MessageEvent) {
      if (event.origin !== ALPHORIX_ORIGIN) return;
      if (looksLikeSubmitSuccess(event.data)) onSubmitted?.();
    }

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onSubmitted]);

  return (
    <iframe
      src={`https://alphorix.net/f/${formId}`}
      style={{ width: "100%", minHeight: 950, border: 0, display: "block" }}
      title="Registration form"
    />
  );
}
