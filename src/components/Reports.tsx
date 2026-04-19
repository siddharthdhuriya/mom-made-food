"use client";

import { useState } from "react";
import type { BatchRecord, SellingEntry, SellingInput, ProductionCalc } from "@/types";
import { fmt, fmtNum, calculateSelling } from "@/lib/calculations";
import { deleteBatch, deleteSellingEntry, updateSellingEntry, clearBatches } from "@/lib/storage";
import CostBreakdownChart from "./CostBreakdownChart";

interface Props {
  batches: BatchRecord[];
  onUpdate: () => Promise<void>;
  onEditBatch: (batch: BatchRecord) => void;
}

const PACK_SIZES: Array<100 | 250 | 500 | 1000> = [100, 250, 500, 1000];

function PnLRow({
  label,
  value,
  divider = false,
  highlight = false,
  red = false,
  green = false,
}: {
  label: string;
  value: string;
  divider?: boolean;
  highlight?: boolean;
  red?: boolean;
  green?: boolean;
}) {
  return (
    <div
      className={`flex justify-between items-center ${
        divider ? "pt-2.5 mt-1 border-t border-dashed border-amber-200" : ""
      }`}
    >
      <span className={`text-sm ${highlight ? "font-semibold text-gray-800" : "text-gray-500"}`}>
        {label}
      </span>
      <span
        className={`text-sm font-semibold ${
          red ? "text-red-600" : green ? "text-green-600" : highlight ? "text-gray-900" : "text-gray-700"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function SellingEntryCard({
  entry,
  prodCalc,
  batchId,
  onDelete,
  onSaved,
}: {
  entry: SellingEntry;
  prodCalc: ProductionCalc;
  batchId: string;
  onDelete: () => Promise<void>;
  onSaved: () => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<SellingInput>({ ...entry.selling });

  const { selling, sellCalc } = entry;
  const savedDate = new Date(entry.savedAt).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  const setDraftField = (field: keyof SellingInput, raw: string) => {
    if (field === "discountType") return;
    const num = parseFloat(raw);
    setDraft((d) => ({ ...d, [field]: isNaN(num) || num < 0 ? 0 : num }));
  };

  const handleSaveEdit = async () => {
    setSaving(true);
    const newCalc = calculateSelling(prodCalc, draft);
    await updateSellingEntry(batchId, entry.id, draft, newCalc);
    setEditing(false);
    setSaving(false);
    await onSaved();
  };

  const totalProfit = sellCalc.profitLoss * (selling.quantity || 1);

  return (
    <div className="border border-amber-100 rounded-2xl overflow-hidden">
      {/* Hero */}
      <div
        className={`p-3 ${
          sellCalc.isProfit
            ? "bg-gradient-to-br from-green-500 to-green-600"
            : "bg-gradient-to-br from-red-500 to-red-600"
        } text-white`}
      >
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs font-medium text-white/80">
            {selling.quantity || 1} × {selling.packSize}g pack · {savedDate}
          </p>
          <span
            className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              sellCalc.isProfit ? "bg-green-400/30" : "bg-red-400/30"
            }`}
          >
            {fmtNum(sellCalc.profitMargin)}% margin
          </span>
        </div>
        <p className="text-2xl font-extrabold tracking-tight">
          {totalProfit >= 0 ? "+" : ""}
          {fmt(totalProfit)}
        </p>
        <p className="text-xs text-white/70 mt-0.5">{fmt(sellCalc.profitLoss)} per pack</p>
        <div className="mt-2 pt-2 border-t border-white/20 grid grid-cols-2 gap-2 text-xs">
          <div>
            <p className="text-white/70">Effective Price</p>
            <p className="font-semibold">{fmt(sellCalc.effectiveSellingPrice)}</p>
          </div>
          <div>
            <p className="text-white/70">Cost per Pack</p>
            <p className="font-semibold">{fmt(sellCalc.costPerPack)}</p>
          </div>
        </div>
      </div>

      {/* Detail rows or edit form */}
      {editing ? (
        <div className="p-3 space-y-3 bg-white">
          <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Edit Entry</p>

          <div>
            <p className="text-xs text-gray-500 mb-1.5">Pack Size</p>
            <div className="grid grid-cols-4 gap-1.5">
              {PACK_SIZES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setDraft((d) => ({ ...d, packSize: s }))}
                  className={`py-2 rounded-xl text-xs font-semibold transition-all ${
                    draft.packSize === s
                      ? "bg-amber-500 text-white"
                      : "bg-amber-50 text-amber-700 border border-amber-200"
                  }`}
                >
                  {s}g
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs text-gray-500 mb-1.5">Quantity</p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setDraft((d) => ({ ...d, quantity: Math.max(1, (d.quantity || 1) - 1) }))}
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-amber-50 text-amber-700 border border-amber-200 font-bold active:bg-amber-100"
              >−</button>
              <input
                type="number"
                min="1"
                value={draft.quantity || 1}
                onChange={(e) => {
                  const n = parseInt(e.target.value);
                  setDraft((d) => ({ ...d, quantity: isNaN(n) || n < 1 ? 1 : n }));
                }}
                className="input-field text-center flex-1"
              />
              <button
                type="button"
                onClick={() => setDraft((d) => ({ ...d, quantity: (d.quantity || 1) + 1 }))}
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-amber-50 text-amber-700 border border-amber-200 font-bold active:bg-amber-100"
              >+</button>
            </div>
          </div>

          {(["sellingPrice", "packagingCost"] as const).map((field) => (
            <div key={field}>
              <p className="text-xs text-gray-500 mb-1.5">
                {field === "sellingPrice" ? "Selling Price per Pack (₹)" : "Packaging Cost per Pack (₹)"}
              </p>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-600 font-semibold text-sm">₹</span>
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  value={draft[field] || ""}
                  placeholder="0"
                  onChange={(e) => setDraftField(field, e.target.value)}
                  className="input-field pl-7"
                />
              </div>
            </div>
          ))}

          <div>
            <p className="text-xs text-gray-500 mb-1.5">Discount</p>
            <div className="flex bg-amber-50 rounded-xl p-1 gap-1 mb-2">
              {(["amount", "percent"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setDraft((d) => ({ ...d, discountType: t }))}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    draft.discountType === t ? "bg-white text-amber-700 shadow-sm" : "text-gray-500"
                  }`}
                >
                  {t === "amount" ? "₹ Amount" : "% Percent"}
                </button>
              ))}
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-600 font-semibold text-sm">
                {draft.discountType === "percent" ? "%" : "₹"}
              </span>
              <input
                type="number"
                inputMode="decimal"
                min="0"
                value={draft.discount || ""}
                placeholder="0"
                onChange={(e) => setDraftField("discount", e.target.value)}
                className="input-field pl-7"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => { setEditing(false); setDraft({ ...entry.selling }); }}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium text-gray-500 bg-gray-100 active:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveEdit}
              disabled={saving}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-amber-500 active:bg-amber-600 disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      ) : (
        <div className="p-3 space-y-1.5 bg-white">
          <PnLRow label={`Production cost (${selling.packSize}g)`} value={fmt(prodCalc.costPerGram * selling.packSize)} />
          <PnLRow label="Packaging cost" value={fmt(selling.packagingCost)} />
          <PnLRow label="Total cost per pack" value={fmt(sellCalc.costPerPack)} divider highlight />
          <PnLRow label="MRP" value={fmt(selling.sellingPrice)} />
          {sellCalc.discountAmount > 0 && (
            <PnLRow label="Discount" value={`-${fmt(sellCalc.discountAmount)}`} red />
          )}
          <PnLRow label="Effective selling price" value={fmt(sellCalc.effectiveSellingPrice)} divider highlight />
          <PnLRow
            label={sellCalc.isProfit ? "Profit per pack" : "Loss per pack"}
            value={`${sellCalc.isProfit ? "+" : ""}${fmt(Math.abs(sellCalc.profitLoss))}`}
            divider
            green={sellCalc.isProfit}
            red={!sellCalc.isProfit}
          />
          <PnLRow
            label="Profit margin"
            value={`${fmtNum(sellCalc.profitMargin)}%`}
            green={sellCalc.isProfit}
            red={!sellCalc.isProfit}
          />
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => { setDraft({ ...entry.selling }); setEditing(true); }}
              className="flex-1 text-xs text-amber-600 font-medium py-2 rounded-xl bg-amber-50 active:bg-amber-100 transition-colors"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={onDelete}
              className="flex-1 text-xs text-red-400 font-medium py-2 rounded-xl bg-red-50 active:bg-red-100 transition-colors"
            >
              Remove
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function BatchDetail({
  b,
  onDelete,
  onUpdate,
  onEditBatch,
}: {
  b: BatchRecord;
  onDelete: () => Promise<void>;
  onUpdate: () => Promise<void>;
  onEditBatch: () => void;
}) {
  const hasEntries = b.sellingEntries.length > 0;

  return (
    <div className="mt-4 space-y-4">
      {/* Production P&L */}
      <div className="bg-amber-50/60 rounded-2xl p-4 space-y-2">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-amber-600">Production</p>
          <button
            type="button"
            onClick={onEditBatch}
            className="text-xs text-blue-500 font-semibold px-3 py-1 rounded-lg bg-blue-50 active:bg-blue-100"
          >
            Edit
          </button>
        </div>
        <PnLRow label="Banana Cost" value={fmt(b.production.bananaCost)} />
        <PnLRow label="Oil Cost" value={fmt(b.production.oilCost)} />
        <PnLRow label="Other Cost" value={fmt(b.production.otherCost)} />
        <PnLRow label="Labour Cost" value={fmt(b.prodCalc.labourCost)} />
        <PnLRow label="Total Production Cost" value={fmt(b.prodCalc.totalProductionCost)} divider highlight />
        <div className="grid grid-cols-2 gap-2 pt-1">
          <div className="bg-white rounded-xl p-3 text-center">
            <p className="text-xs text-gray-500 mb-1">Final Yield</p>
            <p className="text-sm font-bold text-gray-800">{fmtNum(b.prodCalc.finalYieldGrams, 0)}g</p>
          </div>
          <div className="bg-white rounded-xl p-3 text-center">
            <p className="text-xs text-gray-500 mb-1">Cost / 100g</p>
            <p className="text-sm font-bold text-amber-700">{fmt(b.prodCalc.costPer100g)}</p>
          </div>
        </div>
      </div>

      {/* Cost Breakdown Chart */}
      <CostBreakdownChart input={b.production} calc={b.prodCalc} />

      {/* Selling Entries */}
      {hasEntries ? (
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-amber-600 px-1">
            Selling — {b.sellingEntries.length} {b.sellingEntries.length === 1 ? "Entry" : "Entries"}
          </p>
          {b.sellingEntries.map((entry) => (
            <SellingEntryCard
              key={entry.id}
              entry={entry}
              prodCalc={b.prodCalc}
              batchId={b.id}
              onDelete={async () => {
                await deleteSellingEntry(b.id, entry.id);
                await onUpdate();
              }}
              onSaved={onUpdate}
            />
          ))}
        </div>
      ) : (
        <div className="bg-gray-50 rounded-2xl p-4 text-center">
          <p className="text-sm text-gray-400">No selling data saved with this batch.</p>
          <p className="text-xs text-gray-400 mt-1">Go to Selling tab to calculate profit.</p>
        </div>
      )}

      {/* Delete batch */}
      <button
        type="button"
        onClick={onDelete}
        className="w-full text-center text-sm text-red-500 font-medium py-3 rounded-2xl bg-red-50 active:bg-red-100 transition-colors"
      >
        Delete this batch
      </button>
    </div>
  );
}

export default function Reports({ batches, onUpdate, onEditBatch }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);

  const totalNetProfit = batches.reduce(
    (sum, b) =>
      sum + b.sellingEntries.reduce((s, e) => s + e.sellCalc.profitLoss * (e.selling.quantity || 1), 0),
    0
  );
  const hasAnySelling = batches.some((b) => b.sellingEntries.length > 0);

  if (batches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
        <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mb-4">
          <span className="text-4xl">📊</span>
        </div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">No reports yet</h3>
        <p className="text-sm text-gray-500">
          Save a batch from the Inputs tab and your P&amp;L report will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 pb-8">
      {/* Total P&L banner */}
      {hasAnySelling && (
        <div
          className={`rounded-2xl p-4 ${
            totalNetProfit >= 0
              ? "bg-gradient-to-r from-green-500 to-green-600"
              : "bg-gradient-to-r from-red-500 to-red-600"
          } text-white`}
        >
          <p className="text-xs font-medium text-white/80 mb-1">
            Total Net {totalNetProfit >= 0 ? "Profit" : "Loss"}
          </p>
          <p className="text-3xl font-extrabold tracking-tight">
            {totalNetProfit >= 0 ? "+" : ""}
            {fmt(totalNetProfit)}
          </p>
          <p className="text-xs text-white/70 mt-1">
            across {batches.length} batch{batches.length !== 1 ? "es" : ""} ·{" "}
            {batches.reduce((n, b) => n + b.sellingEntries.length, 0)} selling entries
          </p>
        </div>
      )}

      <div className="flex items-center justify-between px-1">
        <p className="text-sm text-gray-500">
          {batches.length} batch{batches.length !== 1 ? "es" : ""}
        </p>
        <button
          type="button"
          onClick={async () => {
            if (confirm("Clear all saved batches?")) {
              await clearBatches();
              setExpanded(null);
              await onUpdate();
            }
          }}
          className="text-xs text-red-500 font-medium px-3 py-1.5 rounded-lg bg-red-50 active:bg-red-100"
        >
          Clear All
        </button>
      </div>

      {batches.map((b) => {
        const isExpanded = expanded === b.id;
        const batchDate = b.production.batchDate
          ? new Date(b.production.batchDate + "T00:00:00").toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })
          : "—";
        const savedDate = new Date(b.savedAt).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
        });
        const hasEntries = b.sellingEntries.length > 0;

        const soldGrams = b.sellingEntries.reduce(
          (sum, e) => sum + e.selling.packSize * (e.selling.quantity || 1),
          0
        );
        const pendingGrams = Math.max(0, b.prodCalc.finalYieldGrams - soldGrams);

        const batchNetProfit = hasEntries
          ? b.sellingEntries.reduce((sum, e) => sum + e.sellCalc.profitLoss * (e.selling.quantity || 1), 0)
          : null;

        return (
          <div key={b.id} className="card overflow-hidden">
            <button
              type="button"
              className="w-full text-left"
              onClick={() => setExpanded(isExpanded ? null : b.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-gray-900 text-sm">{batchDate}</p>
                    <span className="text-xs text-gray-400">saved {savedDate}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-xs text-gray-500">
                      Cost {fmt(b.prodCalc.totalProductionCost)}
                    </span>
                    <span className="text-xs text-gray-400">·</span>
                    <span className="text-xs text-gray-500">
                      Yield {fmtNum(b.prodCalc.finalYieldGrams, 0)}g
                    </span>
                    <span className="text-xs text-gray-400">·</span>
                    <span className={`text-xs font-medium ${pendingGrams === 0 && hasEntries ? "text-green-600" : "text-amber-600"}`}>
                      {pendingGrams === 0 && hasEntries ? "Sold out" : `${fmtNum(pendingGrams, 0)}g pending`}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                  {batchNetProfit !== null ? (
                    <span
                      className={`profit-badge text-xs ${
                        batchNetProfit >= 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
                      }`}
                    >
                      {batchNetProfit >= 0 ? "▲" : "▼"} {fmt(Math.abs(batchNetProfit))}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                      No selling
                    </span>
                  )}
                  <span className={`text-xs text-gray-400 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}>
                    ▼
                  </span>
                </div>
              </div>
            </button>

            {isExpanded && (
              <BatchDetail
                b={b}
                onDelete={async () => {
                  await deleteBatch(b.id);
                  setExpanded(null);
                  await onUpdate();
                }}
                onUpdate={onUpdate}
                onEditBatch={() => onEditBatch(b)}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
