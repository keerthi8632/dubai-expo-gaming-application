import { BG_VIDEO } from "@/lib/media";

export default function VideoBackground() {
  return (
    <>
      <video
        autoPlay
        muted
        loop
        playsInline
        className="fixed inset-0 -z-20 h-full w-full object-cover blur-sm"
      >
        <source src={BG_VIDEO} type="video/mp4" />
      </video>
      <div className="fixed inset-0 -z-10 from-black/70 via-black/50 to-black/80" />
    </>
  );
}
