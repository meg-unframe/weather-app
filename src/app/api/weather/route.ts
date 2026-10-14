import type { NextRequest } from "next/server";
import { getWeather, WeatherApiError } from "@/lib/openweather";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const lat = Number(params.get("lat"));
  const lon = Number(params.get("lon"));
  const name = params.get("name")?.trim() || undefined;

  if (
    !params.get("lat") ||
    !params.get("lon") ||
    !Number.isFinite(lat) ||
    !Number.isFinite(lon) ||
    Math.abs(lat) > 90 ||
    Math.abs(lon) > 180
  ) {
    return Response.json({ error: "位置情報（緯度・経度）が正しくありません。" }, { status: 400 });
  }

  try {
    return Response.json(await getWeather(lat, lon, name));
  } catch (e) {
    if (e instanceof WeatherApiError) {
      return Response.json({ error: e.message }, { status: e.status });
    }
    console.error(e);
    return Response.json({ error: "予期しないエラーが発生しました。" }, { status: 500 });
  }
}
