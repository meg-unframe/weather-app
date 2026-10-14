import type { ForecastSlot, WeatherResponse } from "@/lib/types";
import { formatTemp, formatTime } from "@/lib/format";
import { WeatherIcon } from "./WeatherIcon";
import { Stat } from "./Stat";

export function CurrentCard({ data }: { data: WeatherResponse }) {
  const { current, timezoneOffset } = data;
  // 現在の天気APIには降水確率が無いため、直近の3時間予報の値を表示する
  const next: ForecastSlot | undefined = data.forecast[0];

  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-lg font-bold">現在の天気</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          観測時刻 {formatTime(current.dt, timezoneOffset)}（現地時刻）
        </p>
      </div>

      <div className="mt-2 flex items-center gap-3">
        <WeatherIcon condition={current.condition} size={80} />
        <div>
          <p className="text-4xl font-bold tabular-nums">{formatTemp(current.temp)}</p>
          <p className="text-slate-600 dark:text-slate-300">{current.condition.description}</p>
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="体感温度" value={formatTemp(current.feelsLike)} />
        <Stat label="湿度" value={`${current.humidity}%`} />
        <Stat label="風速" value={`${current.windSpeed.toFixed(1)} m/s`} />
        {next && (
          <Stat
            label={`降水確率（${formatTime(next.dt, timezoneOffset)}〜の予報）`}
            value={`${next.pop}%`}
          />
        )}
        {current.rain1h !== undefined && <Stat label="降水量（直近1時間）" value={`${current.rain1h} mm`} />}
        {current.snow1h !== undefined && <Stat label="降雪量（直近1時間）" value={`${current.snow1h} mm`} />}
      </dl>
    </section>
  );
}
