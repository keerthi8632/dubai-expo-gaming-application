"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Modal from "./Modal";
import RegisterModal from "./RegisterModal";
import TermsModal from "./TermsModal";

// OTP entry now happens inline inside RegisterModal (email -> Send OTP -> code
// field -> Verify & Continue), so this flow only has two steps.
type Step = "register" | "terms";

type Props = {
  game: "TRADE" | "SPIN";
  open?: boolean;
  onClose?: () => void;
  onComplete: (participantId: string, fullName: string) => void;
  fullPage?: boolean;
};

export default function RegistrationFlow({ game, open = true, onClose, onComplete, fullPage = false }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("register");
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");

  const handleClose = onClose ?? (() => router.push("/"));

  const content = (
    <>
      {step === "register" && (
        <RegisterModal
          game={game}
          onClose={handleClose}
          onSubmitted={(id, name) => {
            setParticipantId(id);
            setFullName(name);
            setStep("terms");
          }}
        />
      )}
      {step === "terms" && (
        <TermsModal
          game={game}
          onAccept={() => participantId && onComplete(participantId, fullName)}
          onDecline={handleClose}
        />
      )}
    </>
  );

  if (fullPage) {
    return <div className="mx-auto flex min-h-screen max-w-sm items-center px-4 py-10">{content}</div>;
  }

  return (
    <Modal open={open} onClose={onClose} contentClassName="w-full max-w-[620px]">
      {content}
    </Modal>
  );
}
