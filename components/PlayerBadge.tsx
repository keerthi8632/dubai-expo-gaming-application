import { NAME_BOARD } from "@/lib/media";

export default function PlayerBadge({ name }: { name: string }) {
  // Only the first name fits the board nicely and reads better on a booth
  // screen than a full "First Last" string — the full name is still what's
  // stored on the participant record for admin/reporting purposes.
  const firstName = name.trim().split(/\s+/)[0] || name;
  return (
    <div
      className="mx-auto mt-20 flex w-fit min-w-[260px] items-end justify-center whitespace-nowrap px-14 pb-7 pt-8"
      style={{
        backgroundImage: `url(${NAME_BOARD})`,
        backgroundSize: "100% 100%",
        backgroundRepeat: "no-repeat",
        aspectRatio: "1000 / 600",
      }}
    >
      <span className="font-orbitron text-center text-[28px] font-black text-white">{firstName}</span>
    </div>
  );
}
