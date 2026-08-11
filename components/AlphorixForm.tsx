"use client";

type Props = {
  formId: string;
};

export default function AlphorixForm({ formId }: Props) {
  return (
    <iframe
      src={`https://alphorix.net/f/${formId}`}
      style={{ width: "100%", minHeight: 950, border: 0, display: "block" }}
      title="Registration form"
    />
  );
}
