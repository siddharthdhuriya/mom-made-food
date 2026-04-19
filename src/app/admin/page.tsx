"use client";

import Image from "next/image";
import { useState, useEffect, useCallback } from "react";
import type { Session } from "@supabase/supabase-js";
import type { ProductionInput, SellingInput, ProductionCalc, SellingCalc, BatchRecord } from "@/types";
import { calculateProduction, calculateSelling } from "@/lib/calculations";
import { getBatches, saveBatch, addSellingEntry, updateBatch } from "@/lib/storage";
import { supabase } from "@/lib/supabase";
import AuthScreen from "@/components/AuthScreen";
import ProductionForm from "@/components/ProductionForm";
import SellingForm from "@/components/SellingForm";
import Reports from "@/components/Reports";

const DEFAULT_PRODUCTION: ProductionInput = {
  batchDate: new Date().toISOString().split("T")[0],
  rawBananaKg: 0,
  bananaCost: 0,
  oilUsed: 0,
  oilCost: 0,
  otherCost: 0,
  labourHours: 0,
  labourRate: 0,
  finalYieldGrams: 0,
};

const DEFAULT_SELLING: SellingInput = {
  packSize: 100,
  quantity: 1,
  sellingPrice: 0,
  packagingCost: 0,
  discount: 0,
  discountType: "amount",
};

const ZERO_PROD_CALC: ProductionCalc = {
  labourCost: 0,
  rawMaterialCost: 0,
  totalProductionCost: 0,
  finalYieldGrams: 0,
  costPerGram: 0,
  costPer100g: 0,
};

const ZERO_SELL_CALC: SellingCalc = {
  costPerPack: 0,
  discountAmount: 0,
  effectiveSellingPrice: 0,
  profitLoss: 0,
  profitMargin: 0,
  isProfit: true,
};

type Tab = "production" | "selling" | "reports";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "production", label: "Inputs", icon: "🥬" },
  { id: "selling", label: "Selling", icon: "🏷️" },
  { id: "reports", label: "Reports", icon: "📊" },
];

export default function Home() {
  // undefined = checking session, null = not signed in, Session = signed in
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  const [tab, setTab] = useState<Tab>("production");
  const [production, setProduction] = useState<ProductionInput>(DEFAULT_PRODUCTION);
  const [selling, setSelling] = useState<SellingInput>(DEFAULT_SELLING);
  const [prodCalc, setProdCalc] = useState<ProductionCalc>(ZERO_PROD_CALC);
  const [sellCalc, setSellCalc] = useState<SellingCalc>(ZERO_SELL_CALC);
  const [batches, setBatches] = useState<BatchRecord[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [editingBatchId, setEditingBatchId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Stable helpers — declared before useEffects that reference them
  const refreshBatches = useCallback(async (): Promise<void> => {
    const updated = await getBatches();
    setBatches(updated);
  }, []);

  const loadBatches = useCallback(async (): Promise<BatchRecord[]> => {
    const updated = await getBatches();
    setBatches(updated);
    return updated;
  }, []);

  // Auth session tracking
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setSession(session);
      if (!session) {
        setBatches([]);
        setSelectedBatchId(null);
        setEditingBatchId(null);
        setProduction({ ...DEFAULT_PRODUCTION, batchDate: new Date().toISOString().split("T")[0] });
        setSelling(DEFAULT_SELLING);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load batches once authenticated
  useEffect(() => {
    if (!session) return;
    loadBatches().then((loaded) => {
      if (loaded.length > 0) setSelectedBatchId(loaded[0].id);
    });
  }, [session, loadBatches]);

  const selectedBatch = selectedBatchId ? batches.find((b) => b.id === selectedBatchId) ?? null : null;
  const activeProdCalc = selectedBatch ? selectedBatch.prodCalc : prodCalc;

  useEffect(() => {
    setProdCalc(calculateProduction(production));
  }, [production]);

  useEffect(() => {
    setSellCalc(calculateSelling(activeProdCalc, selling));
  }, [activeProdCalc, selling]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const handleSave = useCallback(async () => {
    if (prodCalc.totalProductionCost <= 0) {
      showToast("Add production costs before saving.");
      return;
    }
    if (prodCalc.finalYieldGrams <= 0) {
      showToast("Enter chips yield before saving.");
      return;
    }

    if (editingBatchId) {
      const existingBatch = batches.find((b) => b.id === editingBatchId);
      const updatedEntries = (existingBatch?.sellingEntries ?? []).map((e) => ({
        ...e,
        sellCalc: calculateSelling(prodCalc, e.selling),
      }));
      await updateBatch(editingBatchId, production, prodCalc, updatedEntries);
      setEditingBatchId(null);
      await refreshBatches();
      setProduction({ ...DEFAULT_PRODUCTION, batchDate: new Date().toISOString().split("T")[0] });
      showToast("Batch updated!");
      return;
    }

    const record: BatchRecord = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      savedAt: new Date().toISOString(),
      production,
      prodCalc,
      sellingEntries: [],
    };
    await saveBatch(record);
    const updated = await loadBatches();
    setSelectedBatchId(updated[0]?.id ?? null);
    setProduction({ ...DEFAULT_PRODUCTION, batchDate: new Date().toISOString().split("T")[0] });
    showToast("Batch saved! View in Reports ›");
  }, [production, prodCalc, editingBatchId, batches, refreshBatches, loadBatches]);

  const handleCancelEdit = useCallback(() => {
    setEditingBatchId(null);
    setProduction({ ...DEFAULT_PRODUCTION, batchDate: new Date().toISOString().split("T")[0] });
  }, []);

  const handleEditBatch = useCallback((batch: BatchRecord) => {
    setProduction(batch.production);
    setEditingBatchId(batch.id);
    setTab("production");
  }, []);

  const handleSaveSelling = useCallback(async () => {
    if (!selectedBatchId) return;
    await addSellingEntry(selectedBatchId, selling, sellCalc);
    await loadBatches();
    setSelling(DEFAULT_SELLING);
    showToast("Selling info saved!");
  }, [selectedBatchId, selling, sellCalc, loadBatches]);

  const showBadge = activeProdCalc.totalProductionCost > 0 && activeProdCalc.finalYieldGrams > 0 && selling.sellingPrice > 0;

  // Loading state while checking session
  if (session === undefined) {
    return (
      <div className="flex items-center justify-center h-[100dvh] bg-amber-50">
        <div className="text-center">
          <Image src="/logo.png" alt="Mom Made Food" width={60} height={60} className="rounded-full mx-auto mb-3 opacity-70" priority />
          <p className="text-sm text-gray-400">Loading…</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!session) return <AuthScreen />;

  return (
    <div className="flex flex-col h-[100dvh] max-w-lg mx-auto relative">
      {/* Header */}
      <header className="bg-white border-b border-amber-100 px-4 pt-3 pb-3 flex-shrink-0 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="Mom Made Food"
              width={44}
              height={44}
              className="rounded-full object-cover"
              priority
            />
            <div>
              <h1 className="text-xl font-bold text-gray-900 leading-none">
                Mom Made <span className="text-amber-500">Food</span>
              </h1>
              <p className="text-xs text-gray-400 mt-0.5">Production Cost Calculator</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {showBadge && (
              <div
                className={`profit-badge text-xs ${
                  sellCalc.isProfit ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
                }`}
              >
                {sellCalc.isProfit ? "▲ Profit" : "▼ Loss"}{" "}
                <span className="font-bold">{Math.abs(sellCalc.profitLoss).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")} ₹</span>
              </div>
            )}
            <button
              type="button"
              onClick={() => supabase.auth.signOut()}
              className="text-xs text-gray-400 px-2 py-1 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors"
              title="Sign out"
            >
              ⏏
            </button>
          </div>
        </div>
      </header>

      {/* Scrollable content */}
      <main className="flex-1 overflow-y-auto px-4 pt-4">
        {tab === "production" && (
          <ProductionForm
            data={production}
            onChange={setProduction}
            calc={prodCalc}
            onSave={handleSave}
            isEditing={!!editingBatchId}
            onCancelEdit={handleCancelEdit}
          />
        )}
        {tab === "selling" && (
          <SellingForm
            data={selling}
            onChange={setSelling}
            batches={batches}
            selectedBatchId={selectedBatchId}
            onSelectBatch={setSelectedBatchId}
            onSaveSelling={handleSaveSelling}
          />
        )}
        {tab === "reports" && (
          <Reports
            batches={batches}
            onUpdate={refreshBatches}
            onEditBatch={handleEditBatch}
          />
        )}
      </main>

      {/* Bottom Nav */}
      <nav className="flex-shrink-0 bg-white border-t border-amber-100 px-2 pb-2 pt-1">
        <div className="flex">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-xl transition-all duration-150 ${
                tab === t.id ? "text-amber-600" : "text-gray-400"
              }`}
            >
              <span className="text-xl leading-none">{t.icon}</span>
              <span className={`text-xs font-medium ${tab === t.id ? "text-amber-600" : "text-gray-400"}`}>
                {t.label}
              </span>
              {tab === t.id && (
                <span className="block w-4 h-0.5 rounded-full bg-amber-500 mt-0.5" />
              )}
              {t.id === "production" && editingBatchId && (
                <span className="block w-1.5 h-1.5 rounded-full bg-blue-500 mt-0.5" />
              )}
            </button>
          ))}
        </div>
      </nav>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white text-sm font-medium px-5 py-3 rounded-2xl shadow-xl animate-fade-in whitespace-nowrap">
          {toast}
        </div>
      )}
    </div>
  );
}
