// OpenWeatherMap API との通信（サーバー側専用。Route Handler からのみ import する）

import type {
  Condition,
  CurrentWeather,
  ForecastSlot,
  Location,
  WeatherResponse,
} from "./types";

const BASE_URL = "https://api.openweathermap.org";

export class WeatherApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

function getApiKey(): string {
  const key = process.env.OPENWEATHER_API_KEY;
  if (!key) {
    throw new WeatherApiError(
      "サーバーにAPIキーが設定されていません。管理者は環境変数 OPENWEATHER_API_KEY を設定してください。",
      500,
    );
  }
  return key;
}

async function request<T>(path: string, params: Record<string, string>): Promise<T> {
  const url = new URL(path, BASE_URL);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.searchParams.set("appid", getApiKey());

  let res: Response;
  try {
    res = await fetch(url, { cache: "no-store" });
  } catch {
    throw new WeatherApiError(
      "天気予報サービスに接続できませんでした。時間をおいて再度お試しください。",
      502,
    );
  }

  if (!res.ok) {
    switch (res.status) {
      case 401:
        throw new WeatherApiError(
          "APIキーが無効です。キーが正しいか確認してください（新しく発行したキーは有効になるまで最大2時間ほどかかります）。",
          502,
        );
      case 404:
        throw new WeatherApiError("指定した場所の天気情報が見つかりませんでした。", 404);
      case 429:
        throw new WeatherApiError(
          "APIの利用回数の上限に達しました。しばらく時間をおいてから再度お試しください。",
          429,
        );
      default:
        throw new WeatherApiError(
          `天気予報サービスでエラーが発生しました（ステータス ${res.status}）。時間をおいて再度お試しください。`,
          502,
        );
    }
  }
  return (await res.json()) as T;
}

// ---- Geocoding ----

type GeoItem = {
  name: string;
  local_names?: Record<string, string>;
  lat: number;
  lon: number;
  country: string;
  state?: string;
};

function toLocation(g: GeoItem): Location {
  return {
    name: g.local_names?.ja ?? g.name,
    state: g.state,
    country: g.country,
    lat: g.lat,
    lon: g.lon,
  };
}

export async function searchCities(query: string): Promise<Location[]> {
  const items = await request<GeoItem[]>("/geo/1.0/direct", { q: query, limit: "5" });
  // 日本国内の候補を先に表示する
  return items.map(toLocation).sort((a, b) => Number(b.country === "JP") - Number(a.country === "JP"));
}

async function reverseGeocode(lat: number, lon: number): Promise<Location | null> {
  const items = await request<GeoItem[]>("/geo/1.0/reverse", {
    lat: String(lat),
    lon: String(lon),
    limit: "1",
  });
  return items[0] ? toLocation(items[0]) : null;
}

// ---- Weather ----

type OwmWeather = { description: string; icon: string };

type OwmCurrent = {
  dt: number;
  timezone: number;
  name: string;
  sys: { country?: string };
  main: { temp: number; feels_like: number; humidity: number };
  wind: { speed: number };
  weather: OwmWeather[];
  rain?: { "1h"?: number };
  snow?: { "1h"?: number };
};

type OwmForecast = {
  list: {
    dt: number;
    main: { temp: number; feels_like: number; humidity: number };
    wind: { speed: number };
    weather: OwmWeather[];
    pop: number;
    rain?: { "3h"?: number };
    snow?: { "3h"?: number };
  }[];
  city: { timezone: number };
};

function toCondition(w: OwmWeather[]): Condition {
  return { description: w[0]?.description ?? "不明", icon: w[0]?.icon ?? "" };
}

/** UNIX秒と時差から現地時刻の日付・時を求める */
function localParts(dt: number, offset: number) {
  const d = new Date((dt + offset) * 1000);
  return { date: d.toISOString().slice(0, 10), hour: d.getUTCHours() };
}

export async function getWeather(
  lat: number,
  lon: number,
  name?: string,
): Promise<WeatherResponse> {
  const common = { lat: String(lat), lon: String(lon), units: "metric", lang: "ja" };
  const [cur, fc, place] = await Promise.all([
    request<OwmCurrent>("/data/2.5/weather", common),
    request<OwmForecast>("/data/2.5/forecast", common),
    name ? Promise.resolve(null) : reverseGeocode(lat, lon).catch(() => null),
  ]);

  const offset = cur.timezone;

  const location: Location = place ?? {
    name: name || cur.name || "選択した地点",
    country: cur.sys.country ?? "",
    lat,
    lon,
  };

  const current: CurrentWeather = {
    dt: cur.dt,
    temp: cur.main.temp,
    feelsLike: cur.main.feels_like,
    humidity: cur.main.humidity,
    windSpeed: cur.wind.speed,
    condition: toCondition(cur.weather),
    rain1h: cur.rain?.["1h"],
    snow1h: cur.snow?.["1h"],
  };

  const forecast: ForecastSlot[] = fc.list.map((item) => ({
    dt: item.dt,
    ...localParts(item.dt, fc.city.timezone),
    temp: item.main.temp,
    feelsLike: item.main.feels_like,
    humidity: item.main.humidity,
    windSpeed: item.wind.speed,
    pop: Math.round(item.pop * 100),
    condition: toCondition(item.weather),
    rain3h: item.rain?.["3h"],
    snow3h: item.snow?.["3h"],
  }));

  return {
    location,
    timezoneOffset: offset,
    today: localParts(Math.floor(Date.now() / 1000), offset).date,
    current,
    forecast,
  };
}
