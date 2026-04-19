"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

type PricingRow = {
  id: string;
  weight: string;
  price_rs: number;
  popular: boolean;
  sort_order: number;
};

const DEFAULTS: PricingRow[] = [
  { id: "100g", weight: "100g", price_rs: 150, popular: false, sort_order: 1 },
  { id: "250g", weight: "250g", price_rs: 250, popular: true,  sort_order: 2 },
  { id: "500g", weight: "500g", price_rs: 480, popular: true,  sort_order: 3 },
  { id: "1kg",  weight: "1kg",  price_rs: 960, popular: false, sort_order: 4 },
];

export default function UnitPricing() {
  const [rows, setRows] = useState<PricingRow[]>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");

  useEffect(() => {
    supabase
      .from("unit_pricing")
      .select("*")
      .order("sort_order")
      .then(({ data, error }) => {
        if (!error && data && data.length > 0) setRows(data);
        setLoading(false);
      });
  }, []);

  const handleChange = (id: string, value: string) => {
    const num = parseInt(value, 10);
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, price_rs: isNaN(num) ? 0 : num } : r))
    );
    setStatus("idle");
  };

  const handleSave = async () => {
    setSaving(true);
    setStatus("idle");
    const results = await Promise.all(
      rows.map((r) =>
        supabase.from("unit_pricing").upsert({
          id: r.id,
          weight: r.weight,
          price_rs: r.price_rs,
          popular: r.popular,
          sort_order: r.sort_order,
        })
      )
    );
    setSaving(false);
    const hasError = results.some(({ error }) => error);
    setStatus(hasError ? "error" : "saved");
    if (!hasError) setTimeout(() => setStatus("idle"), 3000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-gray-400">Loading pricing…</p>
      </div>
    );
  }

  return (
    <div className="pb-8">
      <div className="bg-white rounded-2xl border border-amber-100 overflow-hidden shadow-sm mb-4">
        <div className="px-4 py-3 bg-amber-50 border-b border-amber-100">
          <p className="text-xs font-semibold uppercase tracking-widest text-amber-700">Unit Pricing</p>
          <p className="text-xs text-gray-400 mt-0.5">Changes will reflect on the public website</p>
        </div>
        <div className="divide-y divide-amber-50">
          {rows.map((row) => (
            <div key={row.id} className="flex items-center gap-4 px-4 py-3.5">
              <div className="flex-1">
                <p className="font-semibold text-gray-800">{row.weight}</p>
                {row.popular && (
                  <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full">
                    Popular
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-gray-400 text-sm font-medium">₹</span>
                <input
                  type="number"
                  value={row.price_rs}
                  onChange={(e) => handleChange(row.id, e.target.value)}
                  className="input-field w-24 text-right text-base font-bold"
                  min={0}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="btn-primary"
      >
        {saving ? "Saving…" : "Save Pricing"}
      </button>

      {status === "saved" && (
        <p className="text-sm text-green-600 text-center mt-3 font-medium">
          Pricing updated on website
        </p>
      )}
      {status === "error" && (
        <p className="text-sm text-red-500 text-center mt-3">
          Failed to save. Try again.
        </p>
      )}
    </div>
  );
}
