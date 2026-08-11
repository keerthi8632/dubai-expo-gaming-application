"use client";

import { useEffect, useRef } from "react";

type Props = {
  portalId: string;
  formId: string;
  region: string;
};

declare global {
  interface Window {
    hbspt?: {
      forms: {
        create: (opts: { region: string; portalId: string; formId: string; target: string }) => void;
      };
    };
  }
}

let scriptPromise: Promise<void> | null = null;

function loadHubSpotScript(region: string): Promise<void> {
  if (window.hbspt) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://js-${region}.hsforms.net/forms/embed/v2.js`;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load HubSpot forms script"));
    document.body.appendChild(script);
  });
  return scriptPromise;
}

export default function HubSpotForm({ portalId, formId, region }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const targetId = `hubspot-form-${formId}`;

  useEffect(() => {
    let cancelled = false;
    loadHubSpotScript(region).then(() => {
      if (cancelled || !window.hbspt) return;
      window.hbspt.forms.create({ region, portalId, formId, target: `#${targetId}` });
    });
    return () => {
      cancelled = true;
    };
  }, [portalId, formId, region, targetId]);

  return <div ref={containerRef} id={targetId} className="min-h-[300px] p-6" />;
}
