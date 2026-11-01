import React from "react";
import { Severity, AlertStatus, BatchStatus, ActionStatus, CauseStatus } from "@/types";

interface BadgeProps {
  type: "severity" | "batch" | "alert" | "action" | "cause";
  value: string;
  className?: string;
}

export const StatusBadge: React.FC<BadgeProps> = ({ type, value, className = "" }) => {
  let colorClasses = "bg-slate-100 text-slate-800 border-slate-300";

  if (type === "severity") {
    switch (value as Severity) {
      case "Critical":
        colorClasses = "bg-rose-50 text-rose-700 border-rose-200 ring-1 ring-rose-500/20";
        break;
      case "High":
        colorClasses = "bg-amber-50 text-amber-700 border-amber-200 ring-1 ring-amber-500/20";
        break;
      case "Medium":
        colorClasses = "bg-yellow-50 text-yellow-800 border-yellow-200";
        break;
      case "Info":
        colorClasses = "bg-sky-50 text-sky-700 border-sky-200";
        break;
    }
  } else if (type === "batch") {
    switch (value as BatchStatus) {
      case "In Progress":
        colorClasses = "bg-blue-50 text-blue-700 border-blue-200";
        break;
      case "Quality Review":
        colorClasses = "bg-amber-50 text-amber-800 border-amber-300 animate-pulse";
        break;
      case "Released":
        colorClasses = "bg-emerald-50 text-emerald-700 border-emerald-200";
        break;
      case "Rework":
        colorClasses = "bg-orange-50 text-orange-800 border-orange-200";
        break;
      case "Rejected":
        colorClasses = "bg-red-50 text-red-700 border-red-200";
        break;
    }
  } else if (type === "alert") {
    switch (value as AlertStatus) {
      case "Open":
        colorClasses = "bg-red-50 text-red-700 border-red-200 font-semibold";
        break;
      case "Acknowledged":
        colorClasses = "bg-amber-50 text-amber-700 border-amber-200";
        break;
      case "Investigating":
        colorClasses = "bg-indigo-50 text-indigo-700 border-indigo-200";
        break;
      case "Resolved":
        colorClasses = "bg-emerald-50 text-emerald-700 border-emerald-200";
        break;
    }
  } else if (type === "action") {
    switch (value as ActionStatus) {
      case "Open":
        colorClasses = "bg-slate-100 text-slate-700 border-slate-300";
        break;
      case "In Progress":
        colorClasses = "bg-sky-50 text-sky-700 border-sky-200";
        break;
      case "Completed":
      case "Verified":
        colorClasses = "bg-emerald-50 text-emerald-700 border-emerald-200";
        break;
    }
  } else if (type === "cause") {
    switch (value as CauseStatus) {
      case "Engineer-Confirmed":
        colorClasses = "bg-emerald-100 text-emerald-900 border-emerald-300 font-semibold";
        break;
      case "Suspected":
        colorClasses = "bg-amber-100 text-amber-900 border-amber-300";
        break;
      case "Under Investigation":
        colorClasses = "bg-blue-100 text-blue-900 border-blue-300";
        break;
      case "Ruled Out":
        colorClasses = "bg-slate-100 text-slate-500 border-slate-200 line-through opacity-75";
        break;
    }
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorClasses} ${className}`}
    >
      {value}
    </span>
  );
};

