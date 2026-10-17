"use client";

import React, { useState } from "react";
import { DashboardTimeSeriesPoint } from "@/lib/types";

interface LineChartSeries {
  key: keyof DashboardTimeSeriesPoint;
  label: string;
  color: string;
}

interface TimeSeriesChartProps {
  data: DashboardTimeSeriesPoint[];
  series: LineChartSeries[];
  title?: string;
  subtitle?: string;
}

export function TimeSeriesChart({ data, series, title, subtitle }: TimeSeriesChartProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="rounded-3xl border border-[#F0E8E2] bg-white p-6 sm:p-8 text-center text-sm text-[#77716D]">
        No trend data available for the selected period.
      </div>
    );
  }

  // Find max value across all active series for scaling
  let maxVal = 0;
  data.forEach((d) => {
    series.forEach((s) => {
      const val = Number(d[s.key] || 0);
      if (val > maxVal) maxVal = val;
    });
  });
  if (maxVal === 0) maxVal = 10;
  // Round up to nice number
  maxVal = Math.ceil(maxVal * 1.15);

  const width = 800;
  const height = 260;
  const paddingX = 45;
  const paddingY = 30;
  const chartW = width - paddingX * 2;
  const chartH = height - paddingY * 2;

  // Calculate coordinates
  const getX = (i: number) => paddingX + (i / Math.max(1, data.length - 1)) * chartW;
  const getY = (val: number) => paddingY + chartH - (val / maxVal) * chartH;

  // Generate SVG path for a series
  const generatePath = (key: keyof DashboardTimeSeriesPoint) => {
    return data
      .map((d, i) => {
        const val = Number(d[key] || 0);
        const x = getX(i);
        const y = getY(val);
        return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(" ");
  };

  const generateAreaPath = (key: keyof DashboardTimeSeriesPoint) => {
    if (data.length === 0) return "";
    const linePath = generatePath(key);
    const lastX = getX(data.length - 1);
    const firstX = getX(0);
    const bottomY = paddingY + chartH;
    return `${linePath} L ${lastX.toFixed(1)} ${bottomY} L ${firstX.toFixed(1)} ${bottomY} Z`;
  };

  return (
    <div className="rounded-3xl border border-[#F0E8E2] bg-white p-5 sm:p-6 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
        <div>
          {title && <h3 className="text-base font-bold text-[#292522]">{title}</h3>}
          {subtitle && <p className="text-xs text-[#77716D] mt-0.5">{subtitle}</p>}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-[#77716D]">
          {series.map((s) => (
            <div key={String(s.key)} className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: s.color }} />
              <span className="text-[#292522]">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* SVG Container */}
      <div className="relative w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto min-w-[500px] overflow-visible select-none"
        >
          <defs>
            {series.map((s) => (
              <linearGradient
                key={`grad-${String(s.key)}`}
                id={`grad-${String(s.key)}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor={s.color} stopOpacity="0.25" />
                <stop offset="100%" stopColor={s.color} stopOpacity="0.0" />
              </linearGradient>
            ))}
          </defs>

          {/* Horizontal Gridlines & Y-axis labels */}
          {[0, 0.33, 0.66, 1].map((pct, idx) => {
            const y = paddingY + chartH - pct * chartH;
            const labelVal = Math.round(pct * maxVal);
            return (
              <g key={idx}>
                <line
                  x1={paddingX}
                  y1={y}
                  x2={width - paddingX}
                  y2={y}
                  stroke="#F0E8E2"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
                <text
                  x={paddingX - 10}
                  y={y + 4}
                  textAnchor="end"
                  fontSize="10"
                  fill="#A8A29E"
                  fontWeight="500"
                >
                  {labelVal}
                </text>
              </g>
            );
          })}

          {/* Area Fills */}
          {series.map((s) => (
            <path
              key={`area-${String(s.key)}`}
              d={generateAreaPath(s.key)}
              fill={`url(#grad-${String(s.key)})`}
            />
          ))}

          {/* Stroke Lines */}
          {series.map((s) => (
            <path
              key={`line-${String(s.key)}`}
              d={generatePath(s.key)}
              fill="none"
              stroke={s.color}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}

          {/* Interactive Hover Vertical Line & Data Points */}
          {data.map((d, i) => {
            const x = getX(i);
            const isHovered = hoverIndex === i;

            return (
              <g
                key={i}
                onMouseEnter={() => setHoverIndex(i)}
                onMouseLeave={() => setHoverIndex(null)}
                className="cursor-pointer"
              >
                {/* Invisible hover trigger column */}
                <rect
                  x={x - chartW / (data.length * 2)}
                  y={paddingY}
                  width={chartW / data.length}
                  height={chartH}
                  fill="transparent"
                />

                {/* Vertical hover guide */}
                {isHovered && (
                  <line
                    x1={x}
                    y1={paddingY}
                    x2={x}
                    y2={paddingY + chartH}
                    stroke="#292522"
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                    opacity="0.4"
                  />
                )}

                {/* Points on each series */}
                {series.map((s) => {
                  const val = Number(d[s.key] || 0);
                  const y = getY(val);
                  return (
                    <circle
                      key={String(s.key)}
                      cx={x}
                      cy={y}
                      r={isHovered ? "5" : "3"}
                      fill="white"
                      stroke={s.color}
                      strokeWidth={isHovered ? "2.5" : "1.5"}
                      className="transition-all duration-150"
                    />
                  );
                })}

                {/* X-axis date labels (show every few days to prevent clutter) */}
                {(data.length <= 10 || i % Math.ceil(data.length / 7) === 0 || i === data.length - 1) && (
                  <text
                    x={x}
                    y={height - 8}
                    textAnchor="middle"
                    fontSize="10"
                    fill="#77716D"
                    fontWeight="500"
                  >
                    {d.date.slice(5)}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Hover Tooltip Overlay */}
        {hoverIndex !== null && data[hoverIndex] && (
          <div
            className="pointer-events-none absolute top-4 z-20 rounded-2xl border border-[#F0E8E2] bg-white/95 px-3.5 py-2.5 shadow-md backdrop-blur-md transition-all text-xs"
            style={{
              left: `${Math.min(85, Math.max(15, (getX(hoverIndex) / width) * 100))}%`,
              transform: "translateX(-50%)",
            }}
          >
            <div className="font-bold text-[#292522] border-b border-[#F0E8E2] pb-1 mb-1.5">
              📅 {data[hoverIndex].date}
            </div>
            <div className="space-y-1">
              {series.map((s) => (
                <div key={String(s.key)} className="flex items-center justify-between gap-4">
                  <span className="flex items-center gap-1.5 text-[#77716D]">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
                    <span>{s.label}:</span>
                  </span>
                  <span className="font-bold text-[#292522]">
                    {Number(data[hoverIndex][s.key] || 0).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface BreakdownBarProps {
  title: string;
  items: { label: string; count: number }[];
  color?: string;
}

export function BreakdownBarList({ title, items, color = "#292522" }: BreakdownBarProps) {
  const total = items.reduce((acc, it) => acc + it.count, 0);

  return (
    <div className="rounded-3xl border border-[#F0E8E2] bg-white p-5 sm:p-6 shadow-xs">
      <h3 className="text-sm font-bold text-[#292522] mb-4">{title}</h3>

      {items.length === 0 ? (
        <p className="text-xs text-[#77716D]">No recorded data for this period.</p>
      ) : (
        <div className="space-y-3">
          {items.map((it, idx) => {
            const pct = total > 0 ? Math.round((it.count / total) * 100) : 0;
            return (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-[#292522] truncate max-w-[180px]">{it.label}</span>
                  <span className="text-[#77716D]">
                    {it.count.toLocaleString()} ({pct}%)
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-[#FAF4EC]">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{ width: `${pct}%`, backgroundColor: color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
