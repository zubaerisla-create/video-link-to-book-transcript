"use client";

import React, { useState } from "react";
import { Calendar, ChevronDown, Check } from "lucide-react";

interface DateRangeFilterProps {
  currentRange: string;
  onRangeChange: (range: string, fromDate?: string, toDate?: string) => void;
  isLoading?: boolean;
}

export function DateRangeFilter({ currentRange, onRangeChange, isLoading }: DateRangeFilterProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const options = [
    { key: "today", label: "Today" },
    { key: "yesterday", label: "Yesterday" },
    { key: "7d", label: "Last 7 Days" },
    { key: "30d", label: "Last 30 Days" },
    { key: "90d", label: "Last 90 Days" },
    { key: "custom", label: "Custom Range..." },
  ];

  const currentLabel =
    options.find((o) => o.key === currentRange)?.label ||
    (currentRange === "custom" ? "Custom Range" : "Last 7 Days");

  const handleSelect = (key: string) => {
    setDropdownOpen(false);
    if (key === "custom") {
      setShowCustomModal(true);
    } else {
      onRangeChange(key);
    }
  };

  const handleApplyCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (customFrom && customTo) {
      setShowCustomModal(false);
      onRangeChange("custom", customFrom, customTo);
    }
  };

  return (
    <div className="relative">
      {/* Quick Pills for Desktop */}
      <div className="hidden lg:flex items-center gap-1.5 rounded-2xl border border-[#F0E8E2] bg-white p-1 shadow-2xs">
        {options.map((opt) => {
          const isSelected = currentRange === opt.key;
          return (
            <button
              key={opt.key}
              disabled={isLoading}
              onClick={() => handleSelect(opt.key)}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                isSelected
                  ? "bg-[#292522] text-white shadow-xs"
                  : "text-[#77716D] hover:bg-[#FAF4EC] hover:text-[#292522]"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* Dropdown for Mobile / Tablet */}
      <div className="lg:hidden relative">
        <button
          disabled={isLoading}
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="inline-flex items-center gap-2 rounded-2xl border border-[#E8DACB] bg-white px-3.5 py-2 text-xs font-bold text-[#292522] shadow-2xs hover:bg-[#FAF4EC]"
        >
          <Calendar className="h-3.5 w-3.5 text-[#77716D]" />
          <span>{currentLabel}</span>
          <ChevronDown className="h-3.5 w-3.5 text-[#77716D]" />
        </button>

        {dropdownOpen && (
          <div className="absolute right-0 top-full mt-1.5 z-30 w-44 rounded-2xl border border-[#F0E8E2] bg-white p-1.5 shadow-lg">
            {options.map((opt) => (
              <button
                key={opt.key}
                onClick={() => handleSelect(opt.key)}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-semibold ${
                  currentRange === opt.key ? "bg-[#FAF4EC] text-[#292522]" : "text-[#77716D] hover:bg-slate-50"
                }`}
              >
                <span>{opt.label}</span>
                {currentRange === opt.key && <Check className="h-3.5 w-3.5 text-[#292522]" />}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Custom Date Modal */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-2xs">
          <div className="w-full max-w-sm rounded-3xl border border-[#F0E8E2] bg-white p-6 shadow-xl">
            <h3 className="text-base font-bold text-[#292522] mb-1">Select Custom Date Range</h3>
            <p className="text-xs text-[#77716D] mb-4">Choose starting and ending dates in UTC.</p>

            <form onSubmit={handleApplyCustom} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#292522] mb-1">From Date</label>
                <input
                  type="date"
                  required
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  className="w-full rounded-xl border border-[#E8DACB] bg-[#FFFDF8] px-3 py-2 text-xs text-[#292522]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#292522] mb-1">To Date</label>
                <input
                  type="date"
                  required
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  className="w-full rounded-xl border border-[#E8DACB] bg-[#FFFDF8] px-3 py-2 text-xs text-[#292522]"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCustomModal(false)}
                  className="flex-1 rounded-xl border border-[#E8DACB] py-2 text-xs font-semibold text-[#77716D] hover:bg-[#FAF4EC]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-[#292522] py-2 text-xs font-bold text-white hover:bg-[#1a1715]"
                >
                  Apply Filter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
