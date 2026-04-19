"use client";

import { type ChangeEvent } from "react";
import type { ProductionInput, ProductionCalc } from "@/types";
import { fmt } from "@/lib/calculations";

interface Props {
  data: ProductionInput;
  onChange: (data: ProductionInput) => void;
  calc: ProductionCalc;
  onSave: () => void;
  isEditing?: boolean;
  onCancelEdit?: () => void;
}

function Field({
  label,
  name,
  value,
  onChange,
  type = "number",
  placeholder,
  suffix,
}: {
  label: string;
  name: keyof ProductionInput;
  value: number | string;
  onChange: (name: keyof ProductionInput, value: string) => void;
  type?: string;
  placeholder?: string;
  suffix?: string;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <div className="relative">
        <input
          type={type}
          inputMode={type === "number" ? "decimal" : undefined}
          value={value}
          min={type === "number" ? "0" : undefined}
          placeholder={placeholder}
          onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(name, e.target.value)}
          className={`input-field ${suffix ? "pr-14" : ""}`}
        />
        {suffix && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-amber-600 font-medium pointer-events-none">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

function CalcRow({
  label,
  value,
  highlight = false,
  indent = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  indent?: boolean;
}) {
  return (
    <div className={`flex justify-between items-center ${highlight ? "pt-2 mt-1 border-t border-amber-200" : ""}`}>
      <span className={`text-sm ${indent ? "pl-3 text-gray-400" : highlight ? "font-semibold text-gray-800" : "text-gray-500"}`}>
        {indent && <span className="mr-1 text-amber-300">·</span>}
        {label}
      </span>
      <span className={`text-sm ${highlight ? "font-bold text-amber-700" : "font-medium text-gray-700"}`}>
        {value}
      </span>
    </div>
  );
}

export default function ProductionForm({ data, onChange, calc, onSave, isEditing = false, onCancelEdit }: Props) {
  const set = (name: keyof ProductionInput, raw: string) => {
    if (name === "batchDate") {
      onChange({ ...data, batchDate: raw });
      return;
    }
    const num = parseFloat(raw);
    onChange({ ...data, [name]: isNaN(num) || num < 0 ? 0 : num });
  };

  const hasCalc = calc.totalProductionCost > 0;
  const hasCostPer100g = calc.finalYieldGrams > 0;

  return (
    <div className="space-y-5 pb-8">
      {isEditing && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl px-4 py-3 flex items-center justify-between">
          <p className="text-sm font-medium text-blue-700">Editing saved batch</p>
          <button
            type="button"
            onClick={onCancelEdit}
            className="text-xs text-blue-500 font-semibold underline"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Batch Info */}
      <div className="card">
        <p className="section-title">Batch Details</p>
        <Field label="Batch Date" name="batchDate" type="date" value={data.batchDate} onChange={set} />
      </div>

      {/* Raw Materials */}
      <div className="card space-y-4">
        <p className="section-title">Raw Materials</p>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Raw Banana" name="rawBananaKg" value={data.rawBananaKg || ""} onChange={set} placeholder="0" suffix="kg" />
          <Field label="Banana Cost" name="bananaCost" value={data.bananaCost || ""} onChange={set} placeholder="0" suffix="₹" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Oil Used" name="oilUsed" value={data.oilUsed || ""} onChange={set} placeholder="0" suffix="mL" />
          <Field label="Oil Cost" name="oilCost" value={data.oilCost || ""} onChange={set} placeholder="0" suffix="₹" />
        </div>
        <Field label="Other Costs (Gas, misc)" name="otherCost" value={data.otherCost || ""} onChange={set} placeholder="0" suffix="₹" />
      </div>

      {/* Labour */}
      <div className="card space-y-4">
        <p className="section-title">Labour</p>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Labour Hours" name="labourHours" value={data.labourHours || ""} onChange={set} placeholder="0" suffix="hrs" />
          <Field label="Rate per Hour" name="labourRate" value={data.labourRate || ""} onChange={set} placeholder="0" suffix="₹" />
        </div>
      </div>

      {/* Chips Yield */}
      <div className="card space-y-3">
        <p className="section-title">Chips Yield</p>
        <Field
          label="Final Yield (grams)"
          name="finalYieldGrams"
          value={data.finalYieldGrams || ""}
          onChange={set}
          placeholder="e.g. 3200"
          suffix="g"
        />
        {data.rawBananaKg > 0 && data.finalYieldGrams > 0 && (
          <p className="text-xs text-amber-600 font-medium">
            Yield ratio: {((data.finalYieldGrams / (data.rawBananaKg * 1000)) * 100).toFixed(1)}% of raw banana weight
          </p>
        )}
      </div>

      {/* Auto-calculated Summary */}
      {hasCalc && (
        <div className="card space-y-2.5">
          <p className="section-title">Calculated Summary</p>

          <div className="space-y-2">
            <CalcRow label="Raw Material Cost" value={fmt(calc.rawMaterialCost)} />
            {data.bananaCost > 0 && <CalcRow label="Banana" value={fmt(data.bananaCost)} indent />}
            {data.oilCost > 0 && <CalcRow label="Oil" value={fmt(data.oilCost)} indent />}
            {data.otherCost > 0 && <CalcRow label="Other" value={fmt(data.otherCost)} indent />}

            <CalcRow label="Labour Cost" value={fmt(calc.labourCost)} />
            {calc.labourCost > 0 && (
              <CalcRow
                label={`${data.labourHours}h × ₹${data.labourRate}/hr`}
                value=""
                indent
              />
            )}
          </div>

          <div className="space-y-2 pt-1">
            <CalcRow label="Total Production Cost" value={fmt(calc.totalProductionCost)} highlight />
            {hasCostPer100g && (
              <div className="flex justify-between items-center bg-amber-50 rounded-xl px-3 py-2.5 mt-2">
                <span className="text-sm font-semibold text-amber-800">Cost per 100g</span>
                <span className="text-sm font-bold text-amber-700">{fmt(calc.costPer100g)}</span>
              </div>
            )}
          </div>

          {!hasCostPer100g && (
            <p className="text-xs text-gray-400 text-center pt-1">
              Enter chips yield above to see cost per 100g
            </p>
          )}
        </div>
      )}

      {/* Save / Update Batch */}
      <button
        type="button"
        onClick={onSave}
        disabled={!hasCalc}
        className={`w-full font-semibold rounded-2xl py-4 text-base transition-all duration-150 shadow-md active:scale-[0.98] select-none ${
          hasCalc
            ? isEditing
              ? "bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white"
              : "bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white"
            : "bg-gray-100 text-gray-400 cursor-not-allowed shadow-none"
        }`}
      >
        {isEditing ? "Update Batch" : "Save Batch"}
      </button>
    </div>
  );
}
