import React from "react";
import { LucideIcon } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string | number;
  subValue?: string;
  subtitle?: string;
  icon: LucideIcon;
  badge?: string;
  accent?: "teal" | "emerald" | "amber" | "rose" | "blue" | "slate";
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  subValue,
  subtitle,
  icon: Icon,
  badge,
  accent = "teal"
}) => {
  const accentStyles = {
    teal: "bg-teal-50 text-teal-600 border-teal-200",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-200",
    amber: "bg-amber-50 text-amber-600 border-amber-200",
    rose: "bg-rose-50 text-rose-600 border-rose-200",
    blue: "bg-blue-50 text-blue-600 border-blue-200",
    slate: "bg-slate-100 text-slate-600 border-slate-300"
  };

  let displayValue = value;
  let displaySubValue = subValue;

  // Auto-split values that contain embedded parenthesized percentages like "1463 (93.36%)"
  if (!displaySubValue && typeof value === "string") {
    const match = value.match(/^(.*?)\s*\((.*?)\)$/);
    if (match) {
      displayValue = match[1].trim();
      displaySubValue = match[2].trim();
    }
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all min-h-[148px]">
      {/* Row 1: Full-width Heading with complete words (no truncation) */}
      <div className="w-full">
        <p className="text-[11px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider leading-snug">
          {title}
        </p>
      </div>

      {/* Row 2: Number & percentage/badge on Left, Colored Icon Box shifted down on Right */}
      <div className="mt-2.5 flex items-center justify-between gap-2">
        <div className="flex flex-col items-start gap-1 min-w-0">
          <span className="text-2xl font-bold text-slate-900 tracking-tight whitespace-nowrap leading-tight">
            {displayValue}
          </span>
          {displaySubValue && (
            <span className="text-xs font-normal text-slate-500 whitespace-nowrap leading-tight">
              {displaySubValue}
            </span>
          )}
          {badge && (
            <span className="inline-flex items-center text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200/90 whitespace-nowrap shadow-2xs">
              {badge}
            </span>
          )}
          {!displaySubValue && !badge && (
            <div className="h-[20px]" />
          )}
        </div>
        <div className={`p-2.5 rounded-xl border shrink-0 ${accentStyles[accent]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      {/* Row 3: Subtitle / Footer */}
      {subtitle && (
        <p className="mt-3 text-[11px] sm:text-xs text-slate-500 font-normal border-t border-slate-100 pt-2 flex items-center gap-1.5 truncate">
          {subtitle}
        </p>
      )}
    </div>
  );
};
