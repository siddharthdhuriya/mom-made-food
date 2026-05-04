import * as XLSX from "xlsx";
import type { BatchRecord, SellingEntry } from "@/types";
import { fmtNum } from "@/lib/calculations";

function rupees(n: number): string {
  return `Rs.${fmtNum(n, 2)}`;
}

function dateLabel(d: string): string {
  if (!d) return "";
  return new Date(d + "T00:00:00").toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function autoWidth(ws: XLSX.WorkSheet) {
  const range = XLSX.utils.decode_range(ws["!ref"] ?? "A1");
  const colWidths: number[] = [];
  for (let R = range.s.r; R <= range.e.r; R++) {
    for (let C = range.s.c; C <= range.e.c; C++) {
      const cell = ws[XLSX.utils.encode_cell({ r: R, c: C })];
      const len = cell?.v != null ? String(cell.v).length : 0;
      colWidths[C] = Math.max(colWidths[C] ?? 8, Math.min(len + 2, 40));
    }
  }
  ws["!cols"] = colWidths.map((w) => ({ wch: w }));
}

export function exportReportsExcel(
  filteredBatches: BatchRecord[],
  filteredSales: SellingEntry[],
  filterLabel: string
) {
  const wb = XLSX.utils.book_new();

  // ── Sheet 1: Summary ──────────────────────────────────────────────────────
  const totalYieldGrams = filteredBatches.reduce((s, b) => s + b.prodCalc.finalYieldGrams, 0);
  const totalProductionCost = filteredBatches.reduce((s, b) => s + b.prodCalc.totalProductionCost, 0);
  const totalBananaCost = filteredBatches.reduce((s, b) => s + b.production.bananaCost, 0);
  const totalOilCost = filteredBatches.reduce((s, b) => s + b.production.oilCost, 0);
  const totalOtherCost = filteredBatches.reduce((s, b) => s + b.production.otherCost, 0);
  const totalLabourCost = filteredBatches.reduce((s, b) => s + b.prodCalc.labourCost, 0);
  const totalSoldGrams = filteredSales.reduce((s, e) => s + e.selling.packSize * (e.selling.quantity || 1), 0);
  const totalAvailableGrams = Math.max(0, totalYieldGrams - totalSoldGrams);
  const totalRevenue = filteredSales.reduce((s, e) => s + e.sellCalc.effectiveSellingPrice * (e.selling.quantity || 1), 0);
  const totalNetProfit = filteredSales.reduce((s, e) => s + e.sellCalc.profitLoss * (e.selling.quantity || 1), 0);

  const summaryRows: unknown[][] = [
    ["Mom Made Food — Summary Report"],
    [`Period: ${filterLabel}`],
    [],
    ["INVENTORY", ""],
    ["Total Yield", `${fmtNum(totalYieldGrams, 0)} g`],
    ["Total Sold", `${fmtNum(totalSoldGrams, 0)} g`],
    ["Available", `${fmtNum(totalAvailableGrams, 0)} g`],
    [],
    ["PRODUCTION COSTS", ""],
    ["Banana Cost", rupees(totalBananaCost)],
    ["Oil Cost", rupees(totalOilCost)],
    ["Other Cost", rupees(totalOtherCost)],
    ["Labour Cost", rupees(totalLabourCost)],
    ["Total Production Cost", rupees(totalProductionCost)],
    [],
    ["SALES & PROFIT", ""],
    ["Total Revenue", rupees(totalRevenue)],
    [totalNetProfit >= 0 ? "Net Profit" : "Net Loss", rupees(Math.abs(totalNetProfit))],
    [],
    ["COUNTS", ""],
    ["Batches", filteredBatches.length],
    ["Sale Entries", filteredSales.length],
  ];

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
  autoWidth(wsSummary);
  XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");

  // ── Sheet 2: Batches ──────────────────────────────────────────────────────
  const batchHeaders = [
    "Batch Date",
    "Saved At",
    "Raw Banana (kg)",
    "Banana Cost (Rs.)",
    "Oil Used (mL)",
    "Oil Cost (Rs.)",
    "Other Cost (Rs.)",
    "Labour Hours",
    "Labour Rate (Rs./hr)",
    "Labour Cost (Rs.)",
    "Raw Material Cost (Rs.)",
    "Total Production Cost (Rs.)",
    "Final Yield (g)",
    "Cost / gram (Rs.)",
    "Cost / 100g (Rs.)",
  ];

  const batchRows = filteredBatches.map((b) => [
    dateLabel(b.production.batchDate),
    new Date(b.savedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
    b.production.rawBananaKg,
    b.production.bananaCost,
    b.production.oilUsed,
    b.production.oilCost,
    b.production.otherCost,
    b.production.labourHours,
    b.production.labourRate,
    b.prodCalc.labourCost,
    b.prodCalc.rawMaterialCost,
    b.prodCalc.totalProductionCost,
    b.prodCalc.finalYieldGrams,
    Number(fmtNum(b.prodCalc.costPerGram, 4)),
    Number(fmtNum(b.prodCalc.costPer100g, 2)),
  ]);

  const wsBatches = XLSX.utils.aoa_to_sheet([batchHeaders, ...batchRows]);
  autoWidth(wsBatches);
  XLSX.utils.book_append_sheet(wb, wsBatches, "Batches");

  // ── Sheet 3: Sold ─────────────────────────────────────────────────────────
  const soldHeaders = [
    "Sale Date",
    "Buyer Name",
    "Buyer Phone",
    "Pack Size (g)",
    "Quantity",
    "MRP per Pack (Rs.)",
    "Packaging Cost (Rs.)",
    "Discount Type",
    "Discount Value",
    "Discount Amount (Rs.)",
    "Effective Selling Price (Rs.)",
    "Cost per Pack (Rs.)",
    "Profit / Loss per Pack (Rs.)",
    "Total Profit / Loss (Rs.)",
    "Profit Margin (%)",
    "Result",
  ];

  const soldRows = filteredSales.map((e) => {
    const qty = e.selling.quantity || 1;
    return [
      dateLabel(e.selling.saleDate),
      e.selling.buyerName || "",
      e.selling.buyerPhone || "",
      e.selling.packSize,
      qty,
      e.selling.sellingPrice,
      e.selling.packagingCost,
      e.selling.discountType === "percent" ? "%" : "Fixed (Rs.)",
      e.selling.discount,
      Number(fmtNum(e.sellCalc.discountAmount, 2)),
      Number(fmtNum(e.sellCalc.effectiveSellingPrice, 2)),
      Number(fmtNum(e.sellCalc.costPerPack, 2)),
      Number(fmtNum(e.sellCalc.profitLoss, 2)),
      Number(fmtNum(e.sellCalc.profitLoss * qty, 2)),
      Number(fmtNum(e.sellCalc.profitMargin, 2)),
      e.sellCalc.isProfit ? "Profit" : "Loss",
    ];
  });

  const wsSold = XLSX.utils.aoa_to_sheet([soldHeaders, ...soldRows]);
  autoWidth(wsSold);
  XLSX.utils.book_append_sheet(wb, wsSold, "Sold");

  const filename = `mom-made-food-report-${filterLabel.replace(/[^a-zA-Z0-9]/g, "-")}.xlsx`;
  XLSX.writeFile(wb, filename);
}

export function exportCustomersExcel(sales: SellingEntry[]) {
  const wb = XLSX.utils.book_new();

  // Build customer map
  const customerMap: Record<
    string,
    { name: string; phone: string; entries: SellingEntry[]; totalPacks: number; totalGrams: number; totalRevenue: number; totalProfit: number }
  > = {};

  for (const e of sales) {
    const name = e.selling.buyerName?.trim() || "Unknown";
    const phone = e.selling.buyerPhone?.trim() || "";
    const key = `${name}|${phone}`;
    if (!customerMap[key]) {
      customerMap[key] = { name, phone, entries: [], totalPacks: 0, totalGrams: 0, totalRevenue: 0, totalProfit: 0 };
    }
    const qty = e.selling.quantity || 1;
    customerMap[key].entries.push(e);
    customerMap[key].totalPacks += qty;
    customerMap[key].totalGrams += e.selling.packSize * qty;
    customerMap[key].totalRevenue += e.sellCalc.effectiveSellingPrice * qty;
    customerMap[key].totalProfit += e.sellCalc.profitLoss * qty;
  }

  const customers = Object.values(customerMap).sort((a, b) => b.totalRevenue - a.totalRevenue);

  // ── Sheet 1: Customer Summary ─────────────────────────────────────────────
  const summaryHeaders = [
    "Customer Name",
    "Phone",
    "Last Order",
    "Total Orders",
    "Total Packs",
    "Total Weight (g)",
    "Total Revenue (Rs.)",
    "Total Profit / Loss (Rs.)",
    "Result",
  ];

  const summaryRows = customers.map((c) => {
    const lastOrderDate = c.entries
      .map((e) => e.selling.saleDate || e.savedAt.slice(0, 10))
      .sort()
      .at(-1) ?? "";
    return [
      c.name,
      c.phone,
      dateLabel(lastOrderDate),
      c.entries.length,
      c.totalPacks,
      c.totalGrams,
      Number(fmtNum(c.totalRevenue, 2)),
      Number(fmtNum(c.totalProfit, 2)),
      c.totalProfit >= 0 ? "Profit" : "Loss",
    ];
  });

  const wsSummary = XLSX.utils.aoa_to_sheet([summaryHeaders, ...summaryRows]);
  autoWidth(wsSummary);
  XLSX.utils.book_append_sheet(wb, wsSummary, "All Customers");

  XLSX.writeFile(wb, "mom-made-food-customers.xlsx");
}
