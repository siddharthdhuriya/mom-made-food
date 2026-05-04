"use client";

import { useState, useRef, useEffect } from "react";
import type { BatchRecord, SellingEntry, SellingInput } from "@/types";
import { fmt, fmtNum } from "@/lib/calculations";
import { deleteBatch, clearBatches } from "@/lib/storage";
import { exportReportsExcel, exportCustomersExcel } from "@/lib/export";
import CostBreakdownChart from "./CostBreakdownChart";

interface Props {
  batches: BatchRecord[];
  sales: SellingEntry[];
  onUpdate: () => Promise<void>;
  onDeleteSale: (id: string) => Promise<void>;
  onEditSale: (id: string, selling: SellingInput) => void;
  onEditBatch: (batch: BatchRecord) => void;
}

type ReportTab = "summary" | "batches" | "sold" | "customers";
type FilterType = "all" | "last7" | "last30" | "lastMonth" | "custom";

function getBatchDate(b: BatchRecord): string {
  return b.production.batchDate || b.savedAt.slice(0, 10);
}

function getSaleDate(e: SellingEntry): string {
  return e.selling.saleDate || e.savedAt.slice(0, 10);
}

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function filterByRange(date: string, from: string, to: string): boolean {
  return date >= from && date <= to;
}

function ConfirmModal({
  message,
  confirmLabel = "Delete",
  onConfirm,
  onCancel,
}: {
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 px-4 pb-8">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
        <p className="text-sm text-gray-700 text-center mb-5">{message}</p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-gray-100 text-gray-600 active:bg-gray-200"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-red-500 text-white active:bg-red-600"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function PasswordModal({
  onConfirm,
  onCancel,
}: {
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState("");
  const match = value.toLowerCase() === "delete all";
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 px-4 pb-8">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
        <p className="text-sm font-semibold text-gray-800 mb-1">Clear all batches?</p>
        <p className="text-xs text-gray-500 mb-4">
          This cannot be undone. Type{" "}
          <span className="font-mono font-semibold text-gray-700">delete all</span> to confirm.
        </p>
        <input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="delete all"
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-red-300"
        />
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-gray-100 text-gray-600 active:bg-gray-200"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={!match}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium text-white transition-colors ${
              match ? "bg-red-500 active:bg-red-600" : "bg-red-200 cursor-not-allowed"
            }`}
          >
            Clear All
          </button>
        </div>
      </div>
    </div>
  );
}

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

function BatchDetail({
  b,
  onDelete,
  onEditBatch,
}: {
  b: BatchRecord;
  onDelete: () => Promise<void>;
  onEditBatch: () => void;
}) {
  const [showConfirm, setShowConfirm] = useState(false);
  return (
    <div className="mt-4 space-y-4">
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
      <CostBreakdownChart input={b.production} calc={b.prodCalc} />
      <button
        type="button"
        onClick={() => setShowConfirm(true)}
        className="w-full text-center text-sm text-red-500 font-medium py-3 rounded-2xl bg-red-50 active:bg-red-100 transition-colors"
      >
        Delete this batch
      </button>
      {showConfirm && (
        <ConfirmModal
          message="Delete this batch? This cannot be undone."
          confirmLabel="Delete"
          onConfirm={() => { setShowConfirm(false); onDelete(); }}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </div>
  );
}

const PACK_SIZES_REPORT: Array<100 | 250 | 500 | 1000> = [100, 250, 500, 1000];

function SaleCard({
  entry,
  onDelete,
  onEdit,
}: {
  entry: SellingEntry;
  onDelete: () => Promise<void>;
  onEdit: (selling: SellingInput) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [draft, setDraft] = useState<SellingInput>(entry.selling);
  const [showConfirm, setShowConfirm] = useState(false);
  const { selling, sellCalc } = entry;
  const totalProfit = sellCalc.profitLoss * (selling.quantity || 1);

  const displayDate = selling.saleDate
    ? new Date(selling.saleDate + "T00:00:00").toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : new Date(entry.savedAt).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });

  function startEdit() {
    setDraft(entry.selling);
    setEditMode(true);
  }

  function cancelEdit() {
    setEditMode(false);
  }

  function saveEdit() {
    onEdit(draft);
    setEditMode(false);
  }

  function setNum(field: keyof SellingInput, raw: string) {
    const n = parseFloat(raw);
    setDraft((d) => ({ ...d, [field]: isNaN(n) || n < 0 ? 0 : n }));
  }

  return (
    <div className="border border-amber-100 rounded-2xl overflow-hidden">
      <button
        type="button"
        className={`w-full text-left p-3 ${
          sellCalc.isProfit
            ? "bg-gradient-to-br from-green-500 to-green-600"
            : "bg-gradient-to-br from-red-500 to-red-600"
        } text-white`}
        onClick={() => { setExpanded((v) => !v); if (editMode) setEditMode(false); }}
      >
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs font-medium text-white/80">
            {selling.buyerName ? `${selling.buyerName}${selling.buyerPhone ? ` (${selling.buyerPhone})` : ""} · ` : ""}{selling.quantity || 1} × {selling.packSize}g pack · {displayDate}
          </p>
          <span className={`text-xs transition-transform duration-200 text-white/70 ${expanded ? "rotate-180" : ""}`}>▼</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-extrabold tracking-tight">
              {totalProfit >= 0 ? "+" : ""}{fmt(totalProfit)}
            </p>
            <p className="text-xs text-white/70 mt-0.5">{fmt(sellCalc.profitLoss)} per pack</p>
          </div>
          <span
            className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              sellCalc.isProfit ? "bg-green-400/30" : "bg-red-400/30"
            }`}
          >
            {fmtNum(sellCalc.profitMargin)}% margin
          </span>
        </div>
      </button>

      {expanded && !editMode && (
        <>
          <div
            className={`px-3 pt-2 pb-1 grid grid-cols-2 gap-2 text-xs ${
              sellCalc.isProfit
                ? "bg-gradient-to-br from-green-500 to-green-600"
                : "bg-gradient-to-br from-red-500 to-red-600"
            } text-white`}
          >
            <div>
              <p className="text-white/70">Selling Price</p>
              <p className="font-semibold">{fmt(selling.sellingPrice)}</p>
            </div>
            <div>
              <p className="text-white/70">Cost per Pack</p>
              <p className="font-semibold">{fmt(sellCalc.costPerPack)}</p>
            </div>
          </div>
          <div className="p-3 bg-white">
            {selling.buyerName && (
              <PnLRow label="Buyer" value={selling.buyerPhone ? `${selling.buyerName} · ${selling.buyerPhone}` : selling.buyerName} />
            )}
            <PnLRow label={`Production cost (${selling.packSize}g)`} value={fmt(sellCalc.costPerPack - selling.packagingCost)} />
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
            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={startEdit}
                className="flex-1 text-xs text-blue-500 font-medium py-2 rounded-xl bg-blue-50 active:bg-blue-100 transition-colors"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => setShowConfirm(true)}
                className="flex-1 text-xs text-red-400 font-medium py-2 rounded-xl bg-red-50 active:bg-red-100 transition-colors"
              >
                Remove
              </button>
            </div>
          </div>
        </>
      )}

      {expanded && editMode && (
        <div className="p-3 bg-white space-y-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-amber-600">Edit Entry</p>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">Sale Date</label>
            <input
              type="date"
              value={draft.saleDate}
              onChange={(e) => setDraft((d) => ({ ...d, saleDate: e.target.value }))}
              className="input-field"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Buyer Name</label>
              <input
                type="text"
                value={draft.buyerName}
                placeholder="Optional"
                onChange={(e) => setDraft((d) => ({ ...d, buyerName: e.target.value }))}
                className="input-field"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Buyer Phone</label>
              <input
                type="tel"
                inputMode="tel"
                value={draft.buyerPhone ?? ""}
                placeholder="Optional"
                onChange={(e) => setDraft((d) => ({ ...d, buyerPhone: e.target.value }))}
                className="input-field"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">Pack Size</label>
            <div className="grid grid-cols-4 gap-1.5">
              {PACK_SIZES_REPORT.map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setDraft((d) => ({ ...d, packSize: size }))}
                  className={`py-2 rounded-xl text-xs font-semibold transition-all active:scale-95 ${
                    draft.packSize === size
                      ? "bg-amber-500 text-white"
                      : "bg-amber-50 text-amber-700 border border-amber-200"
                  }`}
                >
                  {size}g
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Quantity</label>
              <input
                type="number"
                inputMode="numeric"
                min="1"
                value={draft.quantity || 1}
                onChange={(e) => { const n = parseInt(e.target.value); setDraft((d) => ({ ...d, quantity: isNaN(n) || n < 1 ? 1 : n })); }}
                className="input-field"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Selling Price (₹)</label>
              <input
                type="number"
                inputMode="decimal"
                min="0"
                value={draft.sellingPrice || ""}
                placeholder="0"
                onChange={(e) => setNum("sellingPrice", e.target.value)}
                className="input-field"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Packaging Cost (₹)</label>
              <input
                type="number"
                inputMode="decimal"
                min="0"
                value={draft.packagingCost || ""}
                placeholder="0"
                onChange={(e) => setNum("packagingCost", e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Discount</label>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setDraft((d) => ({ ...d, discountType: "amount" }))}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${draft.discountType === "amount" ? "bg-amber-500 text-white" : "bg-amber-50 text-amber-700 border border-amber-200"}`}
                >₹</button>
                <button
                  type="button"
                  onClick={() => setDraft((d) => ({ ...d, discountType: "percent" }))}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${draft.discountType === "percent" ? "bg-amber-500 text-white" : "bg-amber-50 text-amber-700 border border-amber-200"}`}
                >%</button>
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">Discount Value</label>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              max={draft.discountType === "percent" ? "100" : undefined}
              value={draft.discount || ""}
              placeholder="0"
              onChange={(e) => setNum("discount", e.target.value)}
              className="input-field"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={cancelEdit}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-gray-100 text-gray-600 active:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={saveEdit}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-amber-500 text-white active:bg-amber-600"
            >
              Save
            </button>
          </div>
        </div>
      )}

      {showConfirm && (
        <ConfirmModal
          message="Remove this sale entry?"
          confirmLabel="Remove"
          onConfirm={() => { setShowConfirm(false); onDelete(); }}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </div>
  );
}

function CustomerCard({
  name,
  phone,
  data,
  onDeleteSale,
}: {
  name: string;
  phone: string;
  data: { totalPacks: number; totalGrams: number; totalRevenue: number; totalProfit: number; entries: SellingEntry[] };
  onDeleteSale: (id: string) => Promise<void>;
}) {
  const [expanded, setExpanded] = useState(false);
  const isProfit = data.totalProfit >= 0;

  return (
    <div className="border border-amber-100 rounded-2xl overflow-hidden">
      <button
        type="button"
        className="w-full text-left p-4 bg-white active:bg-amber-50 transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-sm font-bold text-amber-700 flex-shrink-0">
                {name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-gray-900 text-sm truncate">{name}</p>
                <p className="text-xs text-gray-500">
                  {phone && (
                    <a
                      href={`https://wa.me/${phone.replace(/\D/g, "").replace(/^0/, "91")}?text=${encodeURIComponent("Hi😊\nMaking a fresh batch of banana chips this week in small batches, as always. Let me know if you'd like to order some for you.")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-green-600 font-medium mr-1.5 underline underline-offset-2"
                    >{phone}</a>
                  )}
                  {data.entries.length} {data.entries.length === 1 ? "order" : "orders"} · {fmtNum(data.totalGrams, 0)}g
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0 ml-3">
            <div className="text-right">
              <p className="text-sm font-bold text-gray-900">{fmt(data.totalRevenue)}</p>
              <p className={`text-xs font-semibold ${isProfit ? "text-green-600" : "text-red-500"}`}>
                {isProfit ? "+" : ""}{fmt(data.totalProfit)}
              </p>
            </div>
            <span className={`text-xs text-gray-400 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}>▼</span>
          </div>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-amber-100 bg-amber-50/40 p-3 space-y-2">
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="bg-white rounded-xl p-2.5 text-center">
              <p className="text-xs text-gray-500 mb-0.5">Orders</p>
              <p className="text-sm font-bold text-gray-800">{data.entries.length}</p>
            </div>
            <div className="bg-white rounded-xl p-2.5 text-center">
              <p className="text-xs text-gray-500 mb-0.5">Total Packs</p>
              <p className="text-sm font-bold text-gray-800">{data.totalPacks}</p>
            </div>
            <div className="bg-white rounded-xl p-2.5 text-center">
              <p className="text-xs text-gray-500 mb-0.5">Revenue</p>
              <p className="text-sm font-bold text-amber-700">{fmt(data.totalRevenue)}</p>
            </div>
          </div>
          <p className="text-xs font-semibold uppercase tracking-widest text-amber-600 px-1">Orders</p>
          {data.entries.map((entry) => {
            const displayDate = entry.selling.saleDate
              ? new Date(entry.selling.saleDate + "T00:00:00").toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
              : new Date(entry.savedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
            const entryProfit = entry.sellCalc.profitLoss * (entry.selling.quantity || 1);
            return (
              <div key={entry.id} className="bg-white rounded-xl p-3 flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">{displayDate}</p>
                  <p className="text-sm font-semibold text-gray-800">
                    {entry.selling.quantity || 1} × {entry.selling.packSize}g
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-800">{fmt(entry.sellCalc.effectiveSellingPrice * (entry.selling.quantity || 1))}</p>
                  <p className={`text-xs font-semibold ${entry.sellCalc.isProfit ? "text-green-600" : "text-red-500"}`}>
                    {entryProfit >= 0 ? "+" : ""}{fmt(entryProfit)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function Reports({ batches, sales, onUpdate, onDeleteSale, onEditSale, onEditBatch }: Props) {
  const [reportTab, setReportTab] = useState<ReportTab>("summary");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [showPicker, setShowPicker] = useState(false);
  const [pendingFrom, setPendingFrom] = useState("");
  const [pendingTo, setPendingTo] = useState("");
  const [showClearModal, setShowClearModal] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowPicker(false);
      }
    }
    if (showPicker) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showPicker]);

  function getRange(): { from: string; to: string } | null {
    const today = new Date();
    if (filterType === "last7") {
      const from = new Date(today);
      from.setDate(today.getDate() - 6);
      return { from: toDateStr(from), to: toDateStr(today) };
    }
    if (filterType === "last30") {
      const from = new Date(today);
      from.setDate(today.getDate() - 29);
      return { from: toDateStr(from), to: toDateStr(today) };
    }
    if (filterType === "lastMonth") {
      const from = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const to = new Date(today.getFullYear(), today.getMonth(), 0);
      return { from: toDateStr(from), to: toDateStr(to) };
    }
    if (filterType === "custom" && customFrom && customTo) {
      return { from: customFrom, to: customTo };
    }
    return null;
  }

  const range = getRange();

  const filteredBatches = range
    ? batches.filter((b) => filterByRange(getBatchDate(b), range.from, range.to))
    : batches;

  const filteredSales = range
    ? sales.filter((e) => filterByRange(getSaleDate(e), range.from, range.to))
    : sales;

  function filterLabel(): string {
    if (filterType === "last7") return "Last 7 days";
    if (filterType === "last30") return "Last 30 days";
    if (filterType === "lastMonth") {
      const d = new Date();
      return new Date(d.getFullYear(), d.getMonth() - 1, 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
    }
    if (filterType === "custom" && customFrom && customTo) {
      const fmt = (d: string) => new Date(d + "T00:00:00").toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
      return `${fmt(customFrom)} – ${fmt(customTo)}`;
    }
    return "All time";
  }

  const totalYieldGrams = filteredBatches.reduce((sum, b) => sum + b.prodCalc.finalYieldGrams, 0);
  const totalProductionCost = filteredBatches.reduce((sum, b) => sum + b.prodCalc.totalProductionCost, 0);
  const totalBananaCost = filteredBatches.reduce((sum, b) => sum + b.production.bananaCost, 0);
  const totalOilCost = filteredBatches.reduce((sum, b) => sum + b.production.oilCost, 0);
  const totalOtherCost = filteredBatches.reduce((sum, b) => sum + b.production.otherCost, 0);
  const totalLabourCost = filteredBatches.reduce((sum, b) => sum + b.prodCalc.labourCost, 0);
  const totalSoldGrams = filteredSales.reduce((sum, e) => sum + e.selling.packSize * (e.selling.quantity || 1), 0);
  const totalAvailableGrams = Math.max(0, totalYieldGrams - totalSoldGrams);
  const totalNetProfit = filteredSales.reduce((sum, e) => sum + e.sellCalc.profitLoss * (e.selling.quantity || 1), 0);
  const totalRevenue = filteredSales.reduce((sum, e) => sum + e.sellCalc.effectiveSellingPrice * (e.selling.quantity || 1), 0);

  const customerMap = sales.reduce<Record<string, { name: string; phone: string; totalPacks: number; totalGrams: number; totalRevenue: number; totalProfit: number; entries: SellingEntry[] }>>(
    (acc, e) => {
      const name = e.selling.buyerName?.trim() || "Unknown";
      const phone = e.selling.buyerPhone?.trim() || "";
      const key = `${name}|${phone}`;
      if (!acc[key]) acc[key] = { name, phone, totalPacks: 0, totalGrams: 0, totalRevenue: 0, totalProfit: 0, entries: [] };
      const qty = e.selling.quantity || 1;
      acc[key].totalPacks += qty;
      acc[key].totalGrams += e.selling.packSize * qty;
      acc[key].totalRevenue += e.sellCalc.effectiveSellingPrice * qty;
      acc[key].totalProfit += e.sellCalc.profitLoss * qty;
      acc[key].entries.push(e);
      return acc;
    },
    {}
  );
  const customers = Object.entries(customerMap).sort((a, b) => b[1].totalRevenue - a[1].totalRevenue);

  const REPORT_TABS: { id: ReportTab; label: string }[] = [
    { id: "summary", label: "Summary" },
    { id: "batches", label: `Batches${batches.length > 0 ? ` (${batches.length})` : ""}` },
    { id: "sold", label: `Sold${sales.length > 0 ? ` (${sales.length})` : ""}` },
    { id: "customers", label: `Customers${customers.length > 0 ? ` (${customers.length})` : ""}` },
  ];

  if (batches.length === 0 && sales.length === 0) {
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
      {/* Sub-tab bar */}
      <div className="flex bg-amber-50 rounded-2xl p-1 gap-1">
        {REPORT_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setReportTab(t.id)}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all duration-150 ${
              reportTab === t.id
                ? "bg-white text-amber-700 shadow-sm"
                : "text-gray-500"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Summary tab */}
      {reportTab === "summary" && (
        <div className="bg-white rounded-2xl border border-amber-100 shadow-card p-4 space-y-3">
          {/* Date filter */}
          <div className="relative" ref={pickerRef}>
            <button
              type="button"
              onClick={() => {
                setPendingFrom(customFrom);
                setPendingTo(customTo);
                setShowPicker((v) => !v);
              }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-amber-50 border border-amber-100 text-sm font-medium text-amber-800 active:bg-amber-100"
            >
              <span className="flex items-center gap-2">
                <span className="text-base">📅</span>
                <span>{filterLabel()}</span>
              </span>
              <span className={`text-xs text-amber-500 transition-transform duration-150 ${showPicker ? "rotate-180" : ""}`}>▼</span>
            </button>

            {showPicker && (
              <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-amber-100 rounded-2xl shadow-lg overflow-hidden">
                {/* Quick options */}
                <div className="p-2 space-y-1">
                  {(["all", "last7", "last30", "lastMonth"] as const).map((opt) => {
                    const labels = { all: "All time", last7: "Last 7 days", last30: "Last 30 days", lastMonth: "Last month" };
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => {
                          setFilterType(opt);
                          setShowPicker(false);
                        }}
                        className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                          filterType === opt ? "bg-amber-100 text-amber-800" : "text-gray-700 active:bg-amber-50"
                        }`}
                      >
                        {filterType === opt && <span className="mr-2 text-amber-600">✓</span>}
                        {labels[opt]}
                      </button>
                    );
                  })}
                </div>

                {/* Custom range */}
                <div className="border-t border-amber-100 p-3 space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-widest text-amber-600">Custom Range</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">From</label>
                      <input
                        type="date"
                        value={pendingFrom}
                        onChange={(e) => setPendingFrom(e.target.value)}
                        className="w-full text-sm border border-amber-200 rounded-xl px-2 py-1.5 bg-amber-50 focus:outline-none focus:ring-1 focus:ring-amber-400"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">To</label>
                      <input
                        type="date"
                        value={pendingTo}
                        onChange={(e) => setPendingTo(e.target.value)}
                        className="w-full text-sm border border-amber-200 rounded-xl px-2 py-1.5 bg-amber-50 focus:outline-none focus:ring-1 focus:ring-amber-400"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={!pendingFrom || !pendingTo || pendingFrom > pendingTo}
                    onClick={() => {
                      setCustomFrom(pendingFrom);
                      setCustomTo(pendingTo);
                      setFilterType("custom");
                      setShowPicker(false);
                    }}
                    className="w-full py-2 rounded-xl bg-amber-500 text-white text-sm font-semibold disabled:opacity-40 active:bg-amber-600"
                  >
                    Apply
                  </button>
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => exportReportsExcel(filteredBatches, filteredSales, filterLabel())}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-50 border border-green-200 text-sm font-semibold text-green-700 active:bg-green-100 transition-colors"
          >
            <span>⬇</span> Download Excel
          </button>

          <div className="grid grid-cols-3 gap-2">
            <div className="bg-amber-50 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-500 mb-1">Total Yield</p>
              <p className="text-sm font-bold text-gray-800">{fmtNum(totalYieldGrams, 0)}g</p>
            </div>
            <div className="bg-red-50 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-500 mb-1">Sold</p>
              <p className="text-sm font-bold text-red-600">{fmtNum(totalSoldGrams, 0)}g</p>
            </div>
            <div className={`rounded-xl p-3 text-center ${totalAvailableGrams === 0 && totalYieldGrams > 0 ? "bg-green-50" : "bg-amber-50"}`}>
              <p className="text-xs text-gray-500 mb-1">Available</p>
              <p className={`text-sm font-bold ${totalAvailableGrams === 0 && totalYieldGrams > 0 ? "text-green-600" : "text-amber-700"}`}>
                {totalAvailableGrams === 0 && totalYieldGrams > 0 ? "Sold out" : `${fmtNum(totalAvailableGrams, 0)}g`}
              </p>
            </div>
          </div>

          {filteredBatches.length === 0 && filteredSales.length === 0 && range && (
            <p className="text-sm text-gray-400 text-center py-4">No data in selected range.</p>
          )}

          {filteredBatches.length > 0 && (
            <div className="space-y-1.5 pt-1 border-t border-amber-100">
              <p className="text-xs font-semibold uppercase tracking-widest text-amber-600 pb-0.5">Production Cost</p>
              <PnLRow label="Banana" value={fmt(totalBananaCost)} />
              <PnLRow label="Oil" value={fmt(totalOilCost)} />
              <PnLRow label="Other" value={fmt(totalOtherCost)} />
              <PnLRow label="Labour" value={fmt(totalLabourCost)} />
              <PnLRow label="Total Production Cost" value={fmt(totalProductionCost)} divider highlight />
            </div>
          )}

          {filteredSales.length > 0 && (
            <div className="space-y-1.5 pt-1 border-t border-amber-100">
              <PnLRow label="Total Revenue" value={fmt(totalRevenue)} />
              <PnLRow
                label={totalNetProfit >= 0 ? "Net Profit" : "Net Loss"}
                value={`${totalNetProfit >= 0 ? "+" : ""}${fmt(totalNetProfit)}`}
                divider
                highlight
                green={totalNetProfit >= 0}
                red={totalNetProfit < 0}
              />
            </div>
          )}
        </div>
      )}

      {/* Batches tab */}
      {reportTab === "batches" && (
        <div className="space-y-3">
          {batches.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm">No batches saved yet.</div>
          ) : (
            <>
              <div className="flex items-center justify-between px-1">
                <p className="text-sm text-gray-500">
                  {batches.length} batch{batches.length !== 1 ? "es" : ""}
                </p>
                <button
                  type="button"
                  onClick={() => setShowClearModal(true)}
                  className="text-xs text-red-500 font-medium px-3 py-1.5 rounded-lg bg-red-50 active:bg-red-100"
                >
                  Clear All
                </button>
                {showClearModal && (
                  <PasswordModal
                    onConfirm={async () => {
                      setShowClearModal(false);
                      await clearBatches();
                      setExpanded(null);
                      await onUpdate();
                    }}
                    onCancel={() => setShowClearModal(false)}
                  />
                )}
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
                            <span className="text-xs text-gray-500">Cost {fmt(b.prodCalc.totalProductionCost)}</span>
                            <span className="text-xs text-gray-400">·</span>
                            <span className="text-xs text-gray-500">Yield {fmtNum(b.prodCalc.finalYieldGrams, 0)}g</span>
                            <span className="text-xs text-gray-400">·</span>
                            <span className="text-xs text-amber-600">{fmt(b.prodCalc.costPer100g)}/100g</span>
                          </div>
                        </div>
                        <span className={`text-xs text-gray-400 transition-transform duration-200 flex-shrink-0 ml-2 ${isExpanded ? "rotate-180" : ""}`}>
                          ▼
                        </span>
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
                        onEditBatch={() => onEditBatch(b)}
                      />
                    )}
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}

      {/* Sold tab */}
      {reportTab === "sold" && (
        <div className="space-y-3">
          {sales.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm">No sales recorded yet.</div>
          ) : (
            <>
              <p className="text-sm text-gray-500 px-1">
                {sales.length} {sales.length === 1 ? "entry" : "entries"}
              </p>
              {sales.map((entry) => (
                <SaleCard
                  key={entry.id}
                  entry={entry}
                  onDelete={() => onDeleteSale(entry.id)}
                  onEdit={(selling) => onEditSale(entry.id, selling)}
                />
              ))}
            </>
          )}
        </div>
      )}

      {/* Customers tab */}
      {reportTab === "customers" && (
        <div className="space-y-3">
          {customers.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm">No sales recorded yet.</div>
          ) : (
            <>
              <button
                type="button"
                onClick={() => exportCustomersExcel(sales)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-50 border border-green-200 text-sm font-semibold text-green-700 active:bg-green-100 transition-colors"
              >
                <span>⬇</span> Download Customers Excel
              </button>
              {customers.map(([name, data]) => (
                <CustomerCard key={name} name={data.name} phone={data.phone} data={data} onDeleteSale={onDeleteSale} />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
