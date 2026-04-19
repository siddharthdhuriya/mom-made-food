export interface ProductionInput {
  batchDate: string;
  rawBananaKg: number;
  bananaCost: number;
  oilUsed: number;
  oilCost: number;
  otherCost: number;
  labourHours: number;
  labourRate: number;
  finalYieldGrams: number;
}

export interface SellingInput {
  packSize: 100 | 250 | 500 | 1000;
  quantity: number;
  sellingPrice: number;
  packagingCost: number;
  discount: number;
  discountType: "amount" | "percent";
}

export interface ProductionCalc {
  labourCost: number;
  rawMaterialCost: number;
  totalProductionCost: number;
  finalYieldGrams: number;
  costPerGram: number;
  costPer100g: number;
}

export interface SellingCalc {
  costPerPack: number;
  discountAmount: number;
  effectiveSellingPrice: number;
  profitLoss: number;
  profitMargin: number;
  isProfit: boolean;
}

export interface SellingEntry {
  id: string;
  savedAt: string;
  selling: SellingInput;
  sellCalc: SellingCalc;
}

export interface BatchRecord {
  id: string;
  savedAt: string;
  production: ProductionInput;
  prodCalc: ProductionCalc;
  sellingEntries: SellingEntry[];
}
