export type Country = { name: string; dialCode: string; iso2: string };

export const COUNTRIES: Country[] = [
  { name: "United Arab Emirates", dialCode: "+971", iso2: "AE" },
  { name: "Saudi Arabia", dialCode: "+966", iso2: "SA" },
  { name: "Qatar", dialCode: "+974", iso2: "QA" },
  { name: "Kuwait", dialCode: "+965", iso2: "KW" },
  { name: "Bahrain", dialCode: "+973", iso2: "BH" },
  { name: "Oman", dialCode: "+968", iso2: "OM" },
  { name: "Egypt", dialCode: "+20", iso2: "EG" },
  { name: "Jordan", dialCode: "+962", iso2: "JO" },
  { name: "Lebanon", dialCode: "+961", iso2: "LB" },
  { name: "India", dialCode: "+91", iso2: "IN" },
  { name: "Pakistan", dialCode: "+92", iso2: "PK" },
  { name: "United Kingdom", dialCode: "+44", iso2: "GB" },
  { name: "United States", dialCode: "+1", iso2: "US" },
  { name: "Other", dialCode: "+", iso2: "OT" },
];

export const DEFAULT_COUNTRY = COUNTRIES[0];

export function flagEmoji(iso2: string): string {
  if (iso2 === "OT") return "🌐";
  return iso2
    .toUpperCase()
    .replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt(0)));
}
