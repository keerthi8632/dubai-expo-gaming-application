"use client";

import { useEffect, useRef } from "react";

export type AlphorixSubmission = {
  firstName?: string;
  lastName?: string;
  fullName?: string;
  email?: string;
  phone?: string;
};

type Props = {
  formId: string;
  // Fires once on submit. `info` carries whatever field values arrived via
  // postMessage — undefined if the form navigated (see handleLoad below)
  // without ever posting a message we recognized.
  onSubmitted?: (info?: AlphorixSubmission) => void;
};

const ALPHORIX_ORIGIN = "https://alphorix.net";

// Alphorix doesn't publish a formal postMessage contract, so this listens
// broadly for anything from the form's own origin whose type/event/status
// field reads like a submission-success signal, rather than depending on one
// exact shape we can't verify.
function looksLikeSubmitSuccess(data: unknown): boolean {
  if (!data || typeof data !== "object") return false;
  const record = data as Record<string, unknown>;
  const signal = [record.type, record.event, record.eventName, record.name, record.status]
    .filter((v): v is string => typeof v === "string")
    .join(" ")
    .toLowerCase();
  return /submit|success/.test(signal);
}

// Field names are a guess at common conventions (camelCase, snake_case,
// space-separated) since Alphorix doesn't document its message shape —
// pulls from the top level and from a nested `data`/`fields`/`values`
// object, whichever the payload actually uses.
function extractSubmission(data: unknown): AlphorixSubmission | undefined {
  if (!data || typeof data !== "object") return undefined;
  const record = data as Record<string, unknown>;
  const nested = [record.data, record.fields, record.values, record.formData].find(
    (v): v is Record<string, unknown> => !!v && typeof v === "object"
  );
  const source = { ...record, ...(nested ?? {}) };

  const pick = (...keys: string[]) => {
    for (const key of keys) {
      const value = source[key];
      if (typeof value === "string" && value.trim()) return value.trim();
    }
    return undefined;
  };

  const submission: AlphorixSubmission = {
    firstName: pick("firstName", "first_name", "firstname"),
    lastName: pick("lastName", "last_name", "lastname"),
    fullName: pick("fullName", "full_name", "name"),
    email: pick("email", "emailAddress", "email_address"),
    phone: pick("phone", "phoneNumber", "phone_number", "mobile"),
  };

  const hasAnyValue = Object.values(submission).some(Boolean);
  return hasAnyValue ? submission : undefined;
}

export default function AlphorixForm({ formId, onSubmitted }: Props) {
  // Counts iframe navigations. If a submission postMessage never arrives,
  // the form still does a full (non-SPA) submit that navigates the iframe —
  // onLoad firing a second time is the fallback signal that it was
  // submitted, just without field data to pass along.
  const loadCountRef = useRef(0);
  const submittedRef = useRef(false);

  useEffect(() => {
    if (!onSubmitted) return;

    function handleMessage(event: MessageEvent) {
      // TEMPORARY — log EVERY message regardless of origin, so we can see
      // whether Alphorix posts from a different subdomain than expected
      // (in which case the origin check below would silently drop it).
      // eslint-disable-next-line no-console
      console.log("[AlphorixForm] postMessage received — origin:", event.origin, "data:", event.data);

      if (event.origin !== ALPHORIX_ORIGIN) return;
      if (!looksLikeSubmitSuccess(event.data)) return;
      submittedRef.current = true;
      onSubmitted?.(extractSubmission(event.data));
    }

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onSubmitted]);

  function handleLoad() {
    loadCountRef.current += 1;
    // TEMPORARY — log every iframe load with a timestamp, so we can tell
    // whether the "2nd load = submitted" assumption is actually true here,
    // or whether the form reloads early (e.g. an internal redirect) well
    // before the visitor has filled anything in.
    // eslint-disable-next-line no-console
    console.log(`[AlphorixForm] iframe onLoad #${loadCountRef.current} at`, new Date().toISOString());

    // Only fall back to the no-data signal if the postMessage handler above
    // hasn't already fired for this submission.
    if (loadCountRef.current > 1 && !submittedRef.current) {
      // eslint-disable-next-line no-console
      console.log("[AlphorixForm] no submission postMessage was ever received — falling back to no-data signal.");
      onSubmitted?.(undefined);
    }
  }

  return (
    <iframe
      src={`https://alphorix.net/f/${formId}`}
      style={{ width: "100%", minHeight: 950, border: 0, display: "block" }}
      title="Registration form"
      onLoad={handleLoad}
    />
  );
}
