"use client";

// Logs to the browser console on load, so whoever's at the booth (or
// checking remotely) can confirm which deploy is actually live by opening
// devtools — bump the version string on each deploy.
export default function VersionLog() {
  console.log("Version:", "10.0.0 (2024-06-19)");
  return null;
}
