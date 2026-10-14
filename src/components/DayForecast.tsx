import type { ForecastSlot } from "@/lib/types";
import { formatDateJa, formatTemp } from "@/lib/format";
import { WeatherIcon } from "./WeatherIcon";
import { Stat } from "./Stat";

function summarize(slots: ForecastSlot[]) {
  const temps = slots.map((s) => s.temp);
  const hums = slots.map((s) => s.humidity);
  const counts = new Map<string, { n: number; slot: ForecastSlot }>();
  for (const s of slots) {
    const c = counts.get(s.condition.description);
    counts.set(s.condition.description, { n: (c?.n ?? 0) + 1, slot: c?.slot ?? s });
  }
  const main = [...counts.values()].sort((a, b) => b.n - a.n)[0].slot.condition;
  const rainSlots = slots.filter((s) => s.rain3h !== undefined);
  const snowSlots = slots.filter((s) => s.snow3h !== undefined);
  return {
    main,
    max: Math.max(...temps),
    min: Math.min(...temps),
    pop: Math.max(...slots.map((s) => s.pop)),
    humMin: Math.min(...hums),
    humMax: Math.max(...hums),
    rain: rainSlots.length ? rainSlots.reduce((sum, s) => sum + (s.rain3h ?? 0), 0) : undefined,
    snow: snowSlots.length ? snowSlots.reduce((sum, s) => sum + (s.snow3h ?? 0), 0) : undefined,
  };
}

const pad = (h: number) => `${String(h).padStart(2, "0")}:00`;

export function DayForecast({ date, slots }: { date: string; slots: ForecastSlot[] }) {
  if (slots.length === 0) {
    return (
      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
        <h2 className="text-lg font-bold">{formatDateJa(date)}の予報</h2>
        <p className="mt-2 text-slate-600 dark:text-slate-300">この日の予報データはありません。</p>
      </section>
    );
  }

  const s = summarize(slots);
  const range = `${pad(slots[0].hour)}〜${pad(slots[slots.length - 1].hour)}`;

  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
      <h2 className="text-lg font-bold">{formatDateJa(date)}の予報</h2>

      <div className="mt-2 flex items-center gap-3">
        <WeatherIcon condition={s.main} size={72} />
        <div>
          <p className="text-xl font-semibold">{s.main.description}</p>
          <p className="tabular-nums">
            <span className="text-red-600 dark:text-red-400">最高 {formatTemp(s.max)}</span>
            <span className="mx-2 text-slate-400">/</span>
            <span className="text-blue-600 dark:text-blue-400">最低 {formatTemp(s.min)}</span>
          </p>
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="最大降水確率" value={`${s.pop}%`} />
        <Stat label="湿度" value={s.humMin === s.humMax ? `${s.humMin}%` : `${s.humMin}〜${s.humMax}%`} />
        {s.rain !== undefined && <Stat label="予想降水量（合計）" value={`${s.rain.toFixed(1)} mm`} />}
        {s.snow !== undefined && <Stat label="予想降雪量（合計）" value={`${s.snow.toFixed(1)} mm`} />}
      </dl>
      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
        ※ 上記は {range} の3時間ごとの予報（{slots.length}件）から算出しています。
      </p>

      <h3 className="mt-6 mb-2 font-semibold">3時間ごとの予報</h3>
      <div className="-mx-5 overflow-x-auto px-5">
        <table className="w-full min-w-[480px] text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
              <th className="py-2 font-medium">時刻</th>
              <th className="py-2 font-medium">天気</th>
              <th className="py-2 text-right font-medium">気温</th>
              <th className="py-2 text-right font-medium">降水確率</th>
              <th className="py-2 text-right font-medium">湿度</th>
              <th className="py-2 text-right font-medium">風速</th>
            </tr>
          </thead>
          <tbody>
            {slots.map((slot) => (
              <tr key={slot.dt} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
                <td className="py-1 font-medium tabular-nums">{pad(slot.hour)}</td>
                <td className="py-1">
                  <span className="flex items-center gap-1">
                    <WeatherIcon condition={slot.condition} size={36} />
                    {slot.condition.description}
                  </span>
                </td>
                <td className="py-1 text-right tabular-nums">{formatTemp(slot.temp)}</td>
                <td className="py-1 text-right tabular-nums">{slot.pop}%</td>
                <td className="py-1 text-right tabular-nums">{slot.humidity}%</td>
                <td className="py-1 text-right tabular-nums">{slot.windSpeed.toFixed(1)} m/s</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
