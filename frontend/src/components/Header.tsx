"use client";

import React from "react";
import { Factory, AlertCircle, RefreshCw } from "lucide-react";

interface HeaderProps {
  title?: string;
  selectedLine?: string;
  onLineChange?: (lineId: string) => void;
  onResetDemo?: () => void;
  isResetting?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  title = "Platform Overview",
  selectedLine = "All",
  onLineChange,
  onResetDemo,
  isResetting = false,
}) => {
  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-20 shadow-xs">
      {/* Title & Facility Context */}
      <div className="flex items-center gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Factory className="w-3.5 h-3.5 text-slate-400" />
              Hypothetical Cosmetics Plant 04 (EMEA)
            </span>
          </div>
        </div>
      </div>

      {/* Synthetic Banner & Line Filter */}
      <div className="flex items-center gap-3">
        {/* Synthetic Demo Badge */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-200/80 rounded-md text-[11px] font-medium text-amber-800">
          <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span>DEMO — SYNTHETIC DATA (Not Official L&apos;Oréal Specs)</span>
        </div>

        {/* Global Production Line Selector */}
        {onLineChange && (
          <div className="flex items-center gap-2">
            <label htmlFor="line-select" className="text-xs font-medium text-slate-500 whitespace-nowrap">
              Line Filter:
            </label>
            <select
              id="line-select"
              value={selectedLine}
              onChange={(e) => onLineChange(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 hover:bg-slate-100 transition-colors focus:outline-hidden focus:ring-1 focus:ring-teal-500"
            >
              <option value="All">All Lines (3)</option>
              <option value="1">Line 01 - Emulsions & Creams</option>
              <option value="2">Line 02 - Haircare & Surfactants</option>
              <option value="3">Line 03 - Precision Serums</option>
            </select>
          </div>
        )}

        {/* Reset Demo Quick Action */}
        {onResetDemo && (
          <button
            onClick={onResetDemo}
            disabled={isResetting}
            title="Reset scenario data to default clean state"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 border border-slate-300 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-600 ${isResetting ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">{isResetting ? "Resetting..." : "Reset Scenario"}</span>
          </button>
        )}
      </div>
    </header>
  );
};

