"use client";

type Props = {
  price: number;
  onPredict: (direction: "BUY" | "SELL") => void;
  disabled?: boolean;
};

export default function PredictionModal({ price, onPredict, disabled }: Props) {
  return (
    <div className="flex w-[500px] max-w-[800px] flex-col items-center gap-4 rounded-2xl bg-white p-6 text-black">
      <p className="text-center text-[14px] font-medium uppercase tracking-wide text-black/50">Market frozen</p>
      <h2 className="text-center font-space-grotesk text-[30px] font-bold text-[#d81618]">Which way will it move?</h2>
      <p className="text-center text-3xl font-bold">{price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>

      <div className="flex w-full gap-3">
        <button
          onClick={() => onPredict("BUY")}
          disabled={disabled}
          className="flex flex-1 flex-col items-center gap-1 rounded-xl bg-[#34C759] py-4 text-white transition-transform active:scale-95 disabled:opacity-60"
        >
          <span className="text-xl">↑</span>
          <span className="text-sm font-bold uppercase  font-space-grotesk">Buy</span>
          <span className="text-[11px] font-medium opacity-90">Price goes up</span>
        </button>
        <button
          onClick={() => onPredict("SELL")}
          disabled={disabled}
          className="flex flex-1 flex-col items-center gap-1 rounded-xl bg-[#FF3B30] py-4 text-white transition-transform active:scale-95 disabled:opacity-60"
        >
          <span className="text-xl">↓</span>
          <span className="text-sm font-bold  font-space-grotesk uppercase">Sell</span>
          <span className="text-[11px] font-medium opacity-90">Price goes down</span>
        </button>
      </div>
    </div>
  );
}
