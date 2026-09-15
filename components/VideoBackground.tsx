import { BG_VIDEO } from "@/lib/media";

export default function VideoBackground({ blurred = false }: { blurred?: boolean }) {
  return (
    <>
      <video
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        className={`fixed inset-0 -z-20 h-full w-full bg-black object-contain ${blurred ? "blur-sm" : ""}`}
      >
        <source src={BG_VIDEO} type="video/mp4" />
      </video>
      {blurred && (
        <div className="fixed inset-0 -z-10 bg-gradient-to-b from-black/70 via-black/50 to-black/80 bg-black/40" />
      )}
    </>
  );
}
