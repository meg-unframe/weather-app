"use client";

import { useRef, useState, type FormEvent } from "react";
import type { ApiError, Location, WeatherResponse } from "@/lib/types";
import { Calendar } from "./Calendar";
import { CurrentCard } from "./CurrentCard";
import { DayForecast } from "./DayForecast";

const QUICK_CITIES = ["東京", "大阪", "札幌", "名古屋", "福岡", "那覇"];

async function fetchJson<T>(url: string): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url);
  } catch {
    throw new Error("通信に失敗しました。インターネット接続を確認してください。");
  }
  const body = (await res.json().catch(() => null)) as T | ApiError | null;
  if (!res.ok || body === null) {
    throw new Error(
      (body as ApiError | null)?.error ?? `エラーが発生しました（ステータス ${res.status}）。`,
    );
  }
  return body as T;
}

const OS_LOCATION_HINT =
  "Macの場合は「システム設定 > プライバシーとセキュリティ > 位置情報サービス」で、お使いのブラウザ（Chrome・Safariなど）がオンになっているか確認してください。Windowsの場合は「設定 > プライバシーとセキュリティ > 位置情報」を確認してください。";

function geolocationErrorMessage(err: GeolocationPositionError): string {
  switch (err.code) {
    case err.PERMISSION_DENIED:
      return "位置情報の利用が許可されていません。アドレスバー左のアイコンからこのサイトの位置情報を「許可」にするか、都市名で検索してください。";
    case err.POSITION_UNAVAILABLE:
      return `現在地を取得できませんでした。${OS_LOCATION_HINT}`;
    case err.TIMEOUT:
      // macOS でブラウザに位置情報の権限が無い場合、エラーにならずタイムアウトになることが多い
      return `現在地の取得がタイムアウトしました。${OS_LOCATION_HINT}設定を変更した後はブラウザを再起動してください。`;
    default:
      return "現在地の取得中にエラーが発生しました。都市名で検索してください。";
  }
}

function locationLabel(loc: Location): string {
  return [loc.name, loc.state, loc.country].filter(Boolean).join("、");
}

export function WeatherApp() {
  const [query, setQuery] = useState("");
  const [candidates, setCandidates] = useState<Location[]>([]);
  const [data, setData] = useState<WeatherResponse | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  async function run(label: string, task: () => Promise<void>) {
    const id = ++requestId.current;
    setLoading(label);
    setError(null);
    try {
      await task();
    } catch (e) {
      if (id === requestId.current) {
        setError(e instanceof Error ? e.message : "予期しないエラーが発生しました。");
      }
    } finally {
      if (id === requestId.current) setLoading(null);
    }
  }

  /** candidates: 同じ検索で見つかった地点（「ほかの候補」として表示） */
  async function loadWeather(lat: number, lon: number, name?: string, found: Location[] = []) {
    const id = requestId.current;
    const params = new URLSearchParams({ lat: String(lat), lon: String(lon) });
    if (name) params.set("name", name);
    const result = await fetchJson<WeatherResponse>(`/api/weather?${params}`);
    if (id !== requestId.current) return; // 新しいリクエストが始まっていれば破棄
    setData(result);
    setSelectedDate(result.today);
    setCandidates(found);
  }

  function searchCity(q: string) {
    const trimmed = q.trim();
    if (!trimmed) {
      setError("都市名を入力してください。");
      return;
    }
    run("都市を検索しています…", async () => {
      const results = await fetchJson<Location[]>(`/api/geocode?q=${encodeURIComponent(trimmed)}`);
      // 最も一致する地点（日本国内優先）をすぐ表示し、残りは「ほかの候補」から切り替えられるようにする
      await loadWeather(results[0].lat, results[0].lon, results[0].name, results);
    });
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    searchCity(query);
  }

  function selectCandidate(loc: Location) {
    run("天気を取得しています…", () => loadWeather(loc.lat, loc.lon, loc.name, candidates));
  }

  function locateMe() {
    if (!("geolocation" in navigator)) {
      setError("お使いのブラウザは位置情報に対応していません。都市名で検索してください。");
      return;
    }
    run("現在地を取得しています…（位置情報の許可を求められたら「許可」を押してください）", async () => {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 20000,
          maximumAge: 10 * 60 * 1000,
        }),
      ).catch((err: GeolocationPositionError) => {
        throw new Error(geolocationErrorMessage(err));
      });
      await loadWeather(pos.coords.latitude, pos.coords.longitude);
    });
  }

  // 今日は予報の残りが無くても「現在の天気」を表示できるので常に選択可能にする
  const availableDates = data ? [...new Set([data.today, ...data.forecast.map((s) => s.date)])] : [];
  const otherCandidates = data
    ? candidates.filter((c) => c.lat !== data.location.lat || c.lon !== data.location.lon)
    : [];
  const daySlots = data && selectedDate ? data.forecast.filter((s) => s.date === selectedDate) : [];

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:py-12">
      <header className="mb-6">
        <h1 className="text-2xl font-bold sm:text-3xl">天気予報</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          都市名を検索するか、現在地から天気を確認できます。
        </p>
      </header>

      <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
        <form onSubmit={onSubmit} className="flex flex-col gap-2 sm:flex-row">
          <label htmlFor="city" className="sr-only">
            都市名
          </label>
          <input
            id="city"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="都市名を入力（例: 東京、横浜、London）"
            className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 text-base outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200 dark:border-slate-700 dark:bg-slate-950 dark:focus:ring-sky-900"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading !== null}
              className="flex-1 rounded-xl bg-sky-600 px-5 py-3 font-semibold text-white hover:bg-sky-700 disabled:opacity-50 sm:flex-none"
            >
              検索
            </button>
            <button
              type="button"
              onClick={locateMe}
              disabled={loading !== null}
              className="flex-1 rounded-xl border border-sky-600 px-4 py-3 font-semibold text-sky-700 hover:bg-sky-50 disabled:opacity-50 sm:flex-none dark:text-sky-300 dark:hover:bg-sky-950"
            >
              📍 現在地
            </button>
          </div>
        </form>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-500 dark:text-slate-400">よく使う都市:</span>
          {QUICK_CITIES.map((c) => (
            <button
              key={c}
              type="button"
              disabled={loading !== null}
              onClick={() => {
                setQuery(c);
                searchCity(c);
              }}
              className="rounded-full bg-slate-100 px-3 py-1 text-sm hover:bg-slate-200 disabled:opacity-50 dark:bg-slate-800 dark:hover:bg-slate-700"
            >
              {c}
            </button>
          ))}
        </div>
      </section>

      {loading && (
        <p
          role="status"
          className="mt-4 flex items-center gap-2 rounded-xl bg-sky-50 px-4 py-3 text-sm text-sky-900 dark:bg-sky-950 dark:text-sky-100"
        >
          <span className="size-4 animate-spin rounded-full border-2 border-sky-600 border-t-transparent" />
          {loading}
        </p>
      )}

      {error && (
        <div
          role="alert"
          className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200"
        >
          <p className="font-semibold">エラー</p>
          <p className="text-sm">{error}</p>
        </div>
      )}


      {data && selectedDate && (
        <div className="mt-6">
          <p className="text-xl font-bold">📍 {locationLabel(data.location)}</p>
          {otherCandidates.length > 0 && (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-500 dark:text-slate-400">ほかの候補:</span>
              {otherCandidates.map((c) => (
                <button
                  key={`${c.lat},${c.lon}`}
                  type="button"
                  disabled={loading !== null}
                  onClick={() => selectCandidate(c)}
                  className="rounded-full border border-slate-300 px-3 py-1 text-sm hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:hover:bg-slate-800"
                >
                  {locationLabel(c)}
                </button>
              ))}
            </div>
          )}
          <div className="mb-4" />
          <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
            <aside className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 lg:self-start dark:bg-slate-900 dark:ring-slate-800">
              <h2 className="mb-3 font-bold">日付を選択</h2>
              <Calendar
                key={`${data.location.lat},${data.location.lon},${data.today}`}
                today={data.today}
                availableDates={availableDates}
                selected={selectedDate}
                onSelect={setSelectedDate}
              />
            </aside>
            <div className="flex min-w-0 flex-col gap-6">
              {selectedDate === data.today && <CurrentCard data={data} />}
              {(selectedDate !== data.today || daySlots.length > 0) && (
                <DayForecast date={selectedDate} slots={daySlots} />
              )}
              {selectedDate === data.today && daySlots.length === 0 && (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  本日の残り時間の3時間ごとの予報はありません。明日以降はカレンダーから選択してください。
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {!data && !loading && !error && (
        <p className="mt-10 text-center text-slate-500 dark:text-slate-400">
          上の検索欄に都市名を入力するか、「現在地」ボタンを押してください。
        </p>
      )}

      <footer className="mt-12 text-center text-xs text-slate-500 dark:text-slate-400">
        気象データ提供:{" "}
        <a
          href="https://openweathermap.org/"
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          OpenWeatherMap
        </a>
      </footer>
    </div>
  );
}
