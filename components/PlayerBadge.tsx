import { NAME_BOARD } from "@/lib/media";

export default function PlayerBadge({ name }: { name: string }) {
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
      <span className="font-orbitron text-center text-[28px] font-black text-white">{name}</span>
    </div>
  );
}
