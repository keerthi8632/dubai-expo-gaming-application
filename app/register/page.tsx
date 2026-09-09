"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import RegistrationFlow from "@/components/RegistrationFlow";
import VideoBackground from "@/components/VideoBackground";

function RegisterInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const game = (searchParams.get("game") ?? "TRADE") as "TRADE" | "SPIN";

  return (
    <>
      <VideoBackground />
      <RegistrationFlow
        game={game}
        fullPage
        onComplete={(participantId, fullName) =>
          router.push(`/game/${game.toLowerCase()}?participantId=${participantId}&name=${encodeURIComponent(fullName)}`)
        }
      />
    </>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterInner />
    </Suspense>
  );
}
