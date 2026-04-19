"use client";

import { useState, useEffect } from "react";
import type { SellingInput, BatchRecord } from "@/types";
import { fmt } from "@/lib/calculations";

interface Props {
  data: SellingInput;
  onChange: (data: SellingInput) => void;
  batches: BatchRecord[];
  selectedBatchId: string | null;
  onSelectBatch: (id: string | null) => void;
  onSaveSelling: () => void;
}

const PACK_SIZES: Array<100 | 250 | 500 | 1000> = [100, 250, 500, 1000];

export default function SellingForm({
  data,
  onChange,
  batches,
  selectedBatchId,
  onSelectBatch,
  onSaveSelling,
}: Props) {
  const selectedBatch = batches.find((b) => b.id === selectedBatchId) ?? null;
  const entryCount = selectedBatch?.sellingEntries.length ?? 0;

  const [dateValue, setDateValue] = useState(
    selectedBatch?.production.batchDate ?? ""
  );

  useEffect(() => {
    if (selectedBatch) setDateValue(selectedBatch.production.batchDate);
  }, [selectedBatch]);

  const handleDateChange = (dateStr: string) => {
    setDateValue(dateStr);
    const match = batches.find((b) => b.production.batchDate === dateStr);
    onSelectBatch(match?.id ?? null);
  };

  const set = (field: keyof SellingInput, raw: string) => {
    const num = parseFloat(raw);
    onChange({ ...data, [field]: isNaN(num) || num < 0 ? 0 : num });
  };

  if (batches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
        <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mb-4">
          <span className="text-4xl">🏷️</span>
        </div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">No batches yet</h3>
        <p className="text-sm text-gray-500">
          Save a batch from the <strong>Inputs</strong> tab first, then enter selling details here.
        </p>
      </div>
    );
  }

  const noBatchForDate = dateValue !== "" && !selectedBatch;

  return (
    <div className="space-y-5 pb-8">
      {/* Batch Date Selector */}
      <div className="card space-y-3">
        <p className="section-title">Batch Date</p>
        <div>
          <label className="label">Select batch date</label>
          <input
            type="date"
            value={dateValue}
            onChange={(e) => handleDateChange(e.target.value)}
            className="input-field"
          />
        </div>

        {selectedBatch && (
          <div className="bg-amber-50 rounded-xl px-4 py-3 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Production Cost</span>
              <span className="font-semibold text-gray-800">
                {fmt(selectedBatch.prodCalc.totalProductionCost)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Chips Yield</span>
              <span className="font-semibold text-gray-800">
                {selectedBatch.prodCalc.finalYieldGrams.toFixed(0)}g
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Cost per 100g</span>
              <span className="font-semibold text-amber-700">
                {fmt(selectedBatch.prodCalc.costPer100g)}
              </span>
            </div>
            {entryCount > 0 && (
              <div className="flex justify-between text-sm pt-1 border-t border-amber-200 mt-1">
                <span className="text-gray-500">Selling entries saved</span>
                <span className="font-semibold text-amber-700">{entryCount}</span>
              </div>
            )}
          </div>
        )}

        {noBatchForDate && (
          <div className="bg-red-50 rounded-xl px-4 py-3 flex items-center gap-2">
            <span className="text-red-400">⚠</span>
            <p className="text-sm text-red-600">No batch found for this date.</p>
          </div>
        )}

        {!dateValue && (
          <p className="text-xs text-gray-400 text-center">
            Enter a date to load a saved batch
          </p>
        )}
      </div>

      {/* Pack Size */}
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

        {/* Quantity */}
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

      {/* Save Selling */}
      <button
        type="button"
        onClick={onSaveSelling}
        disabled={!selectedBatch || data.sellingPrice <= 0}
        className={`w-full font-semibold rounded-2xl py-4 text-base transition-all duration-150 shadow-md active:scale-[0.98] select-none ${
          selectedBatch && data.sellingPrice > 0
            ? "bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white"
            : "bg-gray-100 text-gray-400 cursor-not-allowed shadow-none"
        }`}
      >
        {!selectedBatch ? "Select a batch date first" : data.sellingPrice <= 0 ? "Enter selling price first" : `Save — ${data.quantity || 1} × ${data.packSize}g Pack`}
      </button>
    </div>
  );
}
