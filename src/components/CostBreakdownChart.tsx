"use client";

import type { ProductionCalc, ProductionInput } from "@/types";
import { fmt } from "@/lib/calculations";

interface Props {
  input: ProductionInput;
  calc: ProductionCalc;
}

interface Slice {
  label: string;
  value: number;
  color: string;
  light: string;
}

function DonutChart({ slices, total }: { slices: Slice[]; total: number }) {
  const size = 160;
  const r = 58;
  const cx = size / 2;
  const cy = size / 2;
  const stroke = 28;
  const circumference = 2 * Math.PI * r;

  let offset = 0;
  const arcs = slices
    .filter((s) => s.value > 0)
    .map((s) => {
      const fraction = s.value / total;
      const dash = fraction * circumference;
      const gap = circumference - dash;
      const dashoffset = -offset * circumference;
      offset += fraction;
      return { ...s, dash, gap, dashoffset };
    });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="drop-shadow-sm">
      {arcs.map((arc, i) => (
        <circle
          key={i}
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={arc.color}
          strokeWidth={stroke}
          strokeDasharray={`${arc.dash} ${arc.gap}`}
          strokeDashoffset={arc.dashoffset}
          style={{ transition: "stroke-dasharray 0.5s ease, stroke-dashoffset 0.5s ease" }}
          transform={`rotate(-90 ${cx} ${cy})`}
        />
      ))}
      <circle cx={cx} cy={cy} r={r - stroke / 2 - 2} fill="white" />
      <text x={cx} y={cy - 6} textAnchor="middle" className="text-xs" fill="#78350f" fontSize="10" fontWeight="600">
        Total
      </text>
      <text x={cx} y={cy + 9} textAnchor="middle" fill="#b45309" fontSize="11" fontWeight="700">
        {fmt(total)}
      </text>
    </svg>
  );
}

export default function CostBreakdownChart({ input, calc }: Props) {
  const slices: Slice[] = [
    { label: "Banana", value: input.bananaCost, color: "#fbbf24", light: "#fef3c7" },
    { label: "Oil", value: input.oilCost, color: "#fb923c", light: "#ffedd5" },
    { label: "Labour", value: calc.labourCost, color: "#f59e0b", light: "#fef9c3" },
    { label: "Other", value: input.otherCost, color: "#a78bfa", light: "#ede9fe" },
  ];

  const total = calc.totalProductionCost;
  if (total <= 0) return null;

  return (
    <div className="card mt-4">
      <p className="section-title">Cost Breakdown</p>
      <div className="flex items-center gap-6">
        <DonutChart slices={slices} total={total} />
        <div className="flex-1 space-y-2.5">
          {slices.map((s) => {
            const pct = total > 0 ? ((s.value / total) * 100).toFixed(1) : "0";
            return (
              <div key={s.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: s.color }}
                  />
                  <span className="text-sm text-gray-600">{s.label}</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-semibold text-gray-800">{fmt(s.value)}</span>
                  <span className="text-xs text-gray-400 ml-1">({pct}%)</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
