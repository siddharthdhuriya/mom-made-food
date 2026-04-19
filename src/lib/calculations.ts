import type { ProductionInput, SellingInput, ProductionCalc, SellingCalc } from "@/types";

export function calculateProduction(input: ProductionInput): ProductionCalc {
  const labourCost = input.labourHours * input.labourRate;
  const rawMaterialCost = input.bananaCost + input.oilCost + input.otherCost;
  const totalProductionCost = rawMaterialCost + labourCost;
  const { finalYieldGrams } = input;
  const costPerGram = finalYieldGrams > 0 ? totalProductionCost / finalYieldGrams : 0;
  const costPer100g = costPerGram * 100;

  return { labourCost, rawMaterialCost, totalProductionCost, finalYieldGrams, costPerGram, costPer100g };
}

export function calculateSelling(prodCalc: ProductionCalc, input: SellingInput): SellingCalc {
  const costPerPack = prodCalc.costPerGram * input.packSize + input.packagingCost;

  const discountAmount =
    input.discountType === "percent"
      ? (input.sellingPrice * input.discount) / 100
      : input.discount;

  const effectiveSellingPrice = Math.max(0, input.sellingPrice - discountAmount);
  const profitLoss = effectiveSellingPrice - costPerPack;
  const profitMargin =
    effectiveSellingPrice > 0 ? (profitLoss / effectiveSellingPrice) * 100 : 0;

  return {
    costPerPack,
    discountAmount,
    effectiveSellingPrice,
    profitLoss,
    profitMargin,
    isProfit: profitLoss >= 0,
  };
}

export function fmt(amount: number): string {
  const abs = Math.abs(amount);
  const formatted = abs.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${amount < 0 ? "-" : ""}₹${formatted}`;
}

export function fmtNum(num: number, d = 1): string {
  return num.toFixed(d);
}
