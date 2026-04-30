"use client";

import { useState } from "react";
import type { BatchRecord, SellingEntry } from "@/types";
import { fmt, fmtNum } from "@/lib/calculations";
import { deleteBatch, clearBatches } from "@/lib/storage";
import CostBreakdownChart from "./CostBreakdownChart";

interface Props {
  batches: BatchRecord[];
  sales: SellingEntry[];
  onUpdate: () => Promise<void>;
  onDeleteSale: (id: string) => Promise<void>;
  onEditBatch: (batch: BatchRecord) => void;
}

type ReportTab = "summary" | "batches" | "sold";

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
        onClick={onDelete}
        className="w-full text-center text-sm text-red-500 font-medium py-3 rounded-2xl bg-red-50 active:bg-red-100 transition-colors"
      >
        Delete this batch
      </button>
    </div>
  );
}

function SaleCard({
  entry,
  onDelete,
}: {
  entry: SellingEntry;
  onDelete: () => Promise<void>;
}) {
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

  return (
    <div className="border border-amber-100 rounded-2xl overflow-hidden">
      <div
        className={`p-3 ${
          sellCalc.isProfit
            ? "bg-gradient-to-br from-green-500 to-green-600"
            : "bg-gradient-to-br from-red-500 to-red-600"
        } text-white`}
      >
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs font-medium text-white/80">
            {selling.quantity || 1} × {selling.packSize}g pack · {displayDate}
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
            <p className="text-white/70">Selling Price</p>
            <p className="font-semibold">{fmt(selling.sellingPrice)}</p>
          </div>
          <div>
            <p className="text-white/70">Cost per Pack</p>
            <p className="font-semibold">{fmt(sellCalc.costPerPack)}</p>
          </div>
        </div>
      </div>
      <div className="p-3 bg-white">
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
        <div className="pt-2">
          <button
            type="button"
            onClick={onDelete}
            className="w-full text-xs text-red-400 font-medium py-2 rounded-xl bg-red-50 active:bg-red-100 transition-colors"
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Reports({ batches, sales, onUpdate, onDeleteSale, onEditBatch }: Props) {
  const [reportTab, setReportTab] = useState<ReportTab>("summary");
  const [expanded, setExpanded] = useState<string | null>(null);

  const totalYieldGrams = batches.reduce((sum, b) => sum + b.prodCalc.finalYieldGrams, 0);
  const totalProductionCost = batches.reduce((sum, b) => sum + b.prodCalc.totalProductionCost, 0);
  const totalBananaCost = batches.reduce((sum, b) => sum + b.production.bananaCost, 0);
  const totalOilCost = batches.reduce((sum, b) => sum + b.production.oilCost, 0);
  const totalOtherCost = batches.reduce((sum, b) => sum + b.production.otherCost, 0);
  const totalLabourCost = batches.reduce((sum, b) => sum + b.prodCalc.labourCost, 0);
  const totalSoldGrams = sales.reduce((sum, e) => sum + e.selling.packSize * (e.selling.quantity || 1), 0);
  const totalAvailableGrams = Math.max(0, totalYieldGrams - totalSoldGrams);
  const totalNetProfit = sales.reduce((sum, e) => sum + e.sellCalc.profitLoss * (e.selling.quantity || 1), 0);
  const totalRevenue = sales.reduce((sum, e) => sum + e.sellCalc.effectiveSellingPrice * (e.selling.quantity || 1), 0);

  const REPORT_TABS: { id: ReportTab; label: string }[] = [
    { id: "summary", label: "Summary" },
    { id: "batches", label: `Batches${batches.length > 0 ? ` (${batches.length})` : ""}` },
    { id: "sold", label: `Sold${sales.length > 0 ? ` (${sales.length})` : ""}` },
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

          {batches.length > 0 && (
            <div className="space-y-1.5 pt-1 border-t border-amber-100">
              <p className="text-xs font-semibold uppercase tracking-widest text-amber-600 pb-0.5">Production Cost</p>
              <PnLRow label="Banana" value={fmt(totalBananaCost)} />
              <PnLRow label="Oil" value={fmt(totalOilCost)} />
              <PnLRow label="Other" value={fmt(totalOtherCost)} />
              <PnLRow label="Labour" value={fmt(totalLabourCost)} />
              <PnLRow label="Total Production Cost" value={fmt(totalProductionCost)} divider highlight />
            </div>
          )}

          {sales.length > 0 && (
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
                />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
