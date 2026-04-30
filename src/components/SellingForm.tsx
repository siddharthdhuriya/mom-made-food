"use client";

import type { SellingInput } from "@/types";

interface Props {
  data: SellingInput;
  onChange: (data: SellingInput) => void;
  onSaveSelling: () => void;
}

const PACK_SIZES: Array<100 | 250 | 500 | 1000> = [100, 250, 500, 1000];

export default function SellingForm({ data, onChange, onSaveSelling }: Props) {
  const set = (field: keyof SellingInput, raw: string) => {
    const num = parseFloat(raw);
    onChange({ ...data, [field]: isNaN(num) || num < 0 ? 0 : num });
  };

  return (
    <div className="space-y-5 pb-8">
      {/* Sale Date */}
      <div className="card space-y-3">
        <p className="section-title">Sale Date</p>
        <div>
          <label className="label">Date of sale</label>
          <input
            type="date"
            value={data.saleDate}
            onChange={(e) => onChange({ ...data, saleDate: e.target.value })}
            className="input-field"
          />
        </div>
      </div>

      {/* Pack Size & Quantity */}
      <div className="card space-y-4">
        <p className="section-title">Pack Size</p>
        <div className="grid grid-cols-4 gap-2">
          {PACK_SIZES.map((size) => (
            <button
              key={size}
              type="button"
              onClick={() => onChange({ ...data, packSize: size })}
              className={`py-3 rounded-xl text-sm font-semibold transition-all duration-150 active:scale-95 ${
                data.packSize === size
                  ? "bg-amber-500 text-white shadow-md shadow-amber-200"
                  : "bg-amber-50 text-amber-700 border border-amber-200"
              }`}
            >
              {size}g
            </button>
          ))}
        </div>

        <div>
          <label className="label">Number of Packs Sold</label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onChange({ ...data, quantity: Math.max(1, (data.quantity || 1) - 1) })}
              className="w-11 h-11 flex items-center justify-center rounded-xl bg-amber-50 text-amber-700 border border-amber-200 text-xl font-bold active:bg-amber-100 transition-colors"
            >
              −
            </button>
            <input
              type="number"
              inputMode="numeric"
              min="1"
              value={data.quantity || 1}
              onChange={(e) => {
                const n = parseInt(e.target.value);
                onChange({ ...data, quantity: isNaN(n) || n < 1 ? 1 : n });
              }}
              className="input-field text-center flex-1"
            />
            <button
              type="button"
              onClick={() => onChange({ ...data, quantity: (data.quantity || 1) + 1 })}
              className="w-11 h-11 flex items-center justify-center rounded-xl bg-amber-50 text-amber-700 border border-amber-200 text-xl font-bold active:bg-amber-100 transition-colors"
            >
              +
            </button>
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div className="card space-y-4">
        <p className="section-title">Pricing</p>
        <div>
          <label className="label">Selling Price per Pack</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-600 font-semibold">₹</span>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              value={data.sellingPrice || ""}
              placeholder="0.00"
              onChange={(e) => set("sellingPrice", e.target.value)}
              className="input-field pl-8"
            />
          </div>
        </div>

        <div>
          <label className="label">Packaging Cost per Pack</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-600 font-semibold">₹</span>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              value={data.packagingCost || ""}
              placeholder="0.00"
              onChange={(e) => set("packagingCost", e.target.value)}
              className="input-field pl-8"
            />
          </div>
        </div>
      </div>

      {/* Discount */}
      <div className="card space-y-4">
        <p className="section-title">Discount</p>
        <div className="flex bg-amber-50 rounded-xl p-1 gap-1">
          {(["amount", "percent"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => onChange({ ...data, discountType: t })}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                data.discountType === t ? "bg-white text-amber-700 shadow-sm" : "text-gray-500"
              }`}
            >
              {t === "amount" ? "₹ Amount" : "% Percent"}
            </button>
          ))}
        </div>
        <div>
          <label className="label">
            Discount {data.discountType === "percent" ? "(%)" : "(₹)"}
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-600 font-semibold">
              {data.discountType === "percent" ? "%" : "₹"}
            </span>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              max={data.discountType === "percent" ? "100" : undefined}
              value={data.discount || ""}
              placeholder="0"
              onChange={(e) => set("discount", e.target.value)}
              className="input-field pl-8"
            />
          </div>
        </div>
      </div>

      {/* Save */}
      <button
        type="button"
        onClick={onSaveSelling}
        disabled={data.sellingPrice <= 0}
        className={`w-full font-semibold rounded-2xl py-4 text-base transition-all duration-150 shadow-md active:scale-[0.98] select-none ${
          data.sellingPrice > 0
            ? "bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white"
            : "bg-gray-100 text-gray-400 cursor-not-allowed shadow-none"
        }`}
      >
        {data.sellingPrice <= 0
          ? "Enter selling price first"
          : `Save — ${data.quantity || 1} × ${data.packSize}g Pack`}
      </button>
    </div>
  );
}
