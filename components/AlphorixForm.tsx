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
  // Fires once on submit, only when we actually received real field data
  // (via postMessage or the /thank-you bridge) — never with a guessed
  // "no-data" signal. See onUncertain below for the alternative case.
  onSubmitted?: (info: AlphorixSubmission) => void;
  // Fires if the iframe reloaded a 2nd time without ever seeing a submission
  // signal — this is ambiguous (could be a real submit whose postMessage we
  // missed, or just an internal form navigation) so instead of guessing we
  // hand back control to the caller to show a "please try again" prompt.
  onUncertain?: () => void;
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

export default function AlphorixForm({ formId, onSubmitted, onUncertain }: Props) {
  // Counts iframe navigations. If a submission postMessage never arrives,
  // the form still does a full (non-SPA) submit that navigates the iframe —
  // onLoad firing a second time is the fallback signal that it was
  // submitted, just without field data to pass along.
  const loadCountRef = useRef(0);
  const submittedRef = useRef(false);
  const uncertainRef = useRef(false);
  const uncertainTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!onSubmitted) return;

    function handleMessage(event: MessageEvent) {
      // TEMPORARY — log EVERY message regardless of origin, so we can see
      // whether Alphorix posts from a different subdomain than expected
      // (in which case the origin check below would silently drop it).
      // eslint-disable-next-line no-console
      console.log("[AlphorixForm] postMessage received — origin:", event.origin, "data:", event.data);

      // Our own /thank-you page posts this explicit bridge message (same
      // origin as this app, not alphorix.net) when Alphorix's own
      // "Thank-you URL" redirect loads it inside this iframe — this is the
      // reliable path since we control its exact shape, so it's checked
      // before the generic alphorix.net heuristic below.
      if (event.origin === window.location.origin) {
        const data = event.data as Record<string, unknown> | null;
        if (data?.type === "alphorix-thank-you") {
          submittedRef.current = true;
          if (uncertainTimerRef.current) {
            clearTimeout(uncertainTimerRef.current);
            uncertainTimerRef.current = null;
          }
          onSubmitted?.({
            firstName: typeof data.firstName === "string" ? data.firstName : undefined,
            lastName: typeof data.lastName === "string" ? data.lastName : undefined,
            email: typeof data.email === "string" ? data.email : undefined,
            phone: typeof data.phone === "string" ? data.phone : undefined,
          });
        }
        return;
      }

      if (event.origin !== ALPHORIX_ORIGIN) return;
      if (!looksLikeSubmitSuccess(event.data)) return;
      submittedRef.current = true;
      if (uncertainTimerRef.current) {
        clearTimeout(uncertainTimerRef.current);
        uncertainTimerRef.current = null;
      }
      onSubmitted?.(extractSubmission(event.data) ?? {});
    }

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onSubmitted]);

  useEffect(() => {
    return () => {
      if (uncertainTimerRef.current) clearTimeout(uncertainTimerRef.current);
    };
  }, []);

  function handleLoad() {
    loadCountRef.current += 1;
    // TEMPORARY — log every iframe load with a timestamp, so we can tell
    // whether the "2nd load = submitted" assumption is actually true here,
    // or whether the form reloads early (e.g. an internal redirect) well
    // before the visitor has filled anything in.
    // eslint-disable-next-line no-console
    console.log(`[AlphorixForm] iframe onLoad #${loadCountRef.current} at`, new Date().toISOString());

    // A 2nd load without ever seeing a submission signal is ambiguous — it
    // could be a real submit whose postMessage we missed, or just an
    // internal form navigation mid-fill. It could also be a REAL submit
    // whose /thank-you bridge page just landed but deliberately delays its
    // postMessage by AUTO_CONTINUE_DELAY_MS (4.5s, so the visitor has time
    // to read the confirmation) — see app/thank-you/page.tsx. So rather than
    // guessing right away, wait longer than that delay for the real signal
    // to arrive before treating it as genuinely uncertain. Must stay ahead
    // of AUTO_CONTINUE_DELAY_MS there — keep both in sync if either changes.
    if (loadCountRef.current > 1 && !submittedRef.current && !uncertainRef.current && !uncertainTimerRef.current) {
      uncertainTimerRef.current = setTimeout(() => {
        uncertainTimerRef.current = null;
        if (submittedRef.current || uncertainRef.current) return;
        uncertainRef.current = true;
        // eslint-disable-next-line no-console
        console.log("[AlphorixForm] no submission postMessage was ever received — flagging as uncertain.");
        onUncertain?.();
      }, 5500);
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
