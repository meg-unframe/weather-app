"use client";

import { useState } from "react";
import { parseDateKey, toDateKey, WEEKDAY_LABELS } from "@/lib/format";

type Props = {
  today: string;
  availableDates: string[];
  selected: string;
  onSelect: (date: string) => void;
};

export function Calendar({ today, availableDates, selected, onSelect }: Props) {
  const available = new Set(availableDates);
  const [month, setMonth] = useState(() => selected.slice(0, 7)); // "YYYY-MM"

  const first = parseDateKey(`${month}-01`);
  const year = first.getUTCFullYear();
  const mon = first.getUTCMonth();
  const daysInMonth = new Date(Date.UTC(year, mon + 1, 0)).getUTCDate();
  const leading = first.getUTCDay();

  const cells: (string | null)[] = [
    ...Array<null>(leading).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => toDateKey(new Date(Date.UTC(year, mon, i + 1)))),
  ];

  const shiftMonth = (delta: number) => toDateKey(new Date(Date.UTC(year, mon + delta, 1))).slice(0, 7);
  const prevMonth = shiftMonth(-1);
  const nextMonth = shiftMonth(1);
  const hasPrev = availableDates.some((d) => d.startsWith(prevMonth));
  const hasNext = availableDates.some((d) => d.startsWith(nextMonth));

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setMonth(prevMonth)}
          disabled={!hasPrev}
          aria-label="前の月"
          className="rounded-md px-3 py-1 text-lg hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent dark:hover:bg-slate-800"
        >
          ‹
        </button>
        <p className="font-semibold">
          {year}年{mon + 1}月
        </p>
        <button
          type="button"
          onClick={() => setMonth(nextMonth)}
          disabled={!hasNext}
          aria-label="次の月"
          className="rounded-md px-3 py-1 text-lg hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent dark:hover:bg-slate-800"
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-sm" role="grid">
        {WEEKDAY_LABELS.map((w, i) => (
          <div
            key={w}
            className={`py-1 text-xs font-medium ${
              i === 0 ? "text-red-500" : i === 6 ? "text-blue-500" : "text-slate-500"
            }`}
          >
            {w}
          </div>
        ))}
        {cells.map((key, i) => {
          if (!key) return <div key={`empty-${i}`} />;
          const day = parseDateKey(key).getUTCDate();
          const enabled = available.has(key);
          const isSelected = key === selected;
          const isToday = key === today;
          return (
            <button
              key={key}
              type="button"
              disabled={!enabled}
              onClick={() => onSelect(key)}
              aria-pressed={isSelected}
              aria-label={`${mon + 1}月${day}日${isToday ? "（今日）" : ""}${enabled ? "" : "：予報データなし"}`}
              title={enabled ? undefined : "予報データがありません"}
              className={`relative aspect-square rounded-lg text-sm transition-colors ${
                isSelected
                  ? "bg-sky-600 font-bold text-white"
                  : enabled
                    ? "bg-sky-50 font-medium text-sky-900 hover:bg-sky-100 dark:bg-sky-950 dark:text-sky-100 dark:hover:bg-sky-900"
                    : "cursor-not-allowed text-slate-300 dark:text-slate-600"
              } ${isToday && !isSelected ? "ring-2 ring-sky-400" : ""}`}
            >
              {day}
            </button>
          );
        })}
      </div>
      <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
        色付きの日付が選択できます（無料プランの予報は今日から5日先まで）。
      </p>
    </div>
  );
}
