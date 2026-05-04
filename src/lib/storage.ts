import { supabase } from "./supabase";
import type { BatchRecord, SellingEntry, ProductionInput, ProductionCalc, SellingInput, SellingCalc } from "@/types";

const IS_LOCAL = process.env.NODE_ENV === "development";
const LOCAL_BATCHES_KEY = "mmf_batches_local";

// --- Local batch helpers (development only) ---

function readLocalBatches(): BatchRecord[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(LOCAL_BATCHES_KEY) ?? "[]"); } catch { return []; }
}

function writeLocalBatches(batches: BatchRecord[]): void {
  localStorage.setItem(LOCAL_BATCHES_KEY, JSON.stringify(batches));
}

// --- DB helpers ---

type DbRow = {
  id: string;
  saved_at: string;
  production: ProductionInput;
  prod_calc: ProductionCalc;
  selling_entries: SellingEntry[];
};

function toRecord(row: DbRow): BatchRecord {
  return {
    id: row.id,
    savedAt: row.saved_at,
    production: row.production,
    prodCalc: row.prod_calc,
    sellingEntries: row.selling_entries ?? [],
  };
}

export async function getBatches(): Promise<BatchRecord[]> {
  if (IS_LOCAL) return readLocalBatches();
  const { data, error } = await supabase
    .from("batches")
    .select("id, saved_at, production, prod_calc, selling_entries")
    .order("saved_at", { ascending: false })
    .limit(50);
  if (error) { console.error("getBatches:", error.message); return []; }
  return (data as DbRow[]).map(toRecord);
}

export async function saveBatch(batch: BatchRecord): Promise<void> {
  if (IS_LOCAL) {
    writeLocalBatches([batch, ...readLocalBatches()]);
    return;
  }
  const { data: { user } } = await supabase.auth.getUser();
  const { error } = await supabase.from("batches").insert({
    id: batch.id,
    saved_at: batch.savedAt,
    production: batch.production,
    prod_calc: batch.prodCalc,
    selling_entries: batch.sellingEntries,
    user_id: user!.id,
  });
  if (error) console.error("saveBatch:", error.message);
}

export async function updateBatch(
  id: string,
  production: ProductionInput,
  prodCalc: ProductionCalc,
  sellingEntries?: SellingEntry[]
): Promise<void> {
  if (IS_LOCAL) {
    const batches = readLocalBatches().map((b) => {
      if (b.id !== id) return b;
      return { ...b, production, prodCalc, ...(sellingEntries !== undefined ? { sellingEntries } : {}) };
    });
    writeLocalBatches(batches);
    return;
  }
  const patch: Record<string, unknown> = { production, prod_calc: prodCalc };
  if (sellingEntries !== undefined) patch.selling_entries = sellingEntries;
  const { error } = await supabase.from("batches").update(patch).eq("id", id);
  if (error) console.error("updateBatch:", error.message);
}

export async function deleteBatch(id: string): Promise<void> {
  if (IS_LOCAL) {
    writeLocalBatches(readLocalBatches().filter((b) => b.id !== id));
    return;
  }
  const { error } = await supabase.from("batches").delete().eq("id", id);
  if (error) console.error("deleteBatch:", error.message);
}

async function fetchSellingEntries(batchId: string): Promise<SellingEntry[]> {
  if (IS_LOCAL) {
    return readLocalBatches().find((b) => b.id === batchId)?.sellingEntries ?? [];
  }
  const { data } = await supabase
    .from("batches")
    .select("selling_entries")
    .eq("id", batchId)
    .single<{ selling_entries: SellingEntry[] }>();
  return data?.selling_entries ?? [];
}

export async function addSellingEntry(batchId: string, selling: SellingInput, sellCalc: SellingCalc): Promise<void> {
  const entry: SellingEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    savedAt: new Date().toISOString(),
    selling,
    sellCalc,
  };
  if (IS_LOCAL) {
    const batches = readLocalBatches().map((b) =>
      b.id === batchId ? { ...b, sellingEntries: [...b.sellingEntries, entry] } : b
    );
    writeLocalBatches(batches);
    return;
  }
  const entries = await fetchSellingEntries(batchId);
  const { error } = await supabase
    .from("batches")
    .update({ selling_entries: [...entries, entry] })
    .eq("id", batchId);
  if (error) console.error("addSellingEntry:", error.message);
}

export async function updateSellingEntry(batchId: string, entryId: string, selling: SellingInput, sellCalc: SellingCalc): Promise<void> {
  if (IS_LOCAL) {
    const batches = readLocalBatches().map((b) => {
      if (b.id !== batchId) return b;
      return { ...b, sellingEntries: b.sellingEntries.map((e) => e.id === entryId ? { ...e, selling, sellCalc } : e) };
    });
    writeLocalBatches(batches);
    return;
  }
  const entries = await fetchSellingEntries(batchId);
  const updated = entries.map((e) => e.id === entryId ? { ...e, selling, sellCalc } : e);
  const { error } = await supabase
    .from("batches")
    .update({ selling_entries: updated })
    .eq("id", batchId);
  if (error) console.error("updateSellingEntry:", error.message);
}

export async function deleteSellingEntry(batchId: string, entryId: string): Promise<void> {
  if (IS_LOCAL) {
    const batches = readLocalBatches().map((b) => {
      if (b.id !== batchId) return b;
      return { ...b, sellingEntries: b.sellingEntries.filter((e) => e.id !== entryId) };
    });
    writeLocalBatches(batches);
    return;
  }
  const entries = await fetchSellingEntries(batchId);
  const updated = entries.filter((e) => e.id !== entryId);
  const { error } = await supabase
    .from("batches")
    .update({ selling_entries: updated })
    .eq("id", batchId);
  if (error) console.error("deleteSellingEntry:", error.message);
}

export async function clearBatches(): Promise<void> {
  if (IS_LOCAL) {
    writeLocalBatches([]);
    return;
  }
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const { error } = await supabase.from("batches").delete().eq("user_id", user.id);
  if (error) console.error("clearBatches:", error.message);
}

// --- Local (localStorage) sales — not tied to any batch ---

const SALES_KEY = "mmf_sales";

export function getLocalSales(): SellingEntry[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(SALES_KEY) ?? "[]"); } catch { return []; }
}

export function addLocalSale(selling: SellingInput, sellCalc: SellingCalc): void {
  const entry: SellingEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    savedAt: new Date().toISOString(),
    selling,
    sellCalc,
  };
  localStorage.setItem(SALES_KEY, JSON.stringify([entry, ...getLocalSales()]));
}

export function updateLocalSale(id: string, selling: SellingInput, sellCalc: SellingCalc): void {
  localStorage.setItem(SALES_KEY, JSON.stringify(
    getLocalSales().map((e) => e.id === id ? { ...e, selling, sellCalc } : e)
  ));
}

export function deleteLocalSale(id: string): void {
  localStorage.setItem(SALES_KEY, JSON.stringify(getLocalSales().filter((e) => e.id !== id)));
}
