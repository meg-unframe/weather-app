import type { NextRequest } from "next/server";
import { searchCities, WeatherApiError } from "@/lib/openweather";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim();
  if (!q) {
    return Response.json({ error: "都市名を入力してください。" }, { status: 400 });
  }
  if (q.length > 100) {
    return Response.json({ error: "都市名が長すぎます。" }, { status: 400 });
  }

  try {
    const results = await searchCities(q);
    if (results.length === 0) {
      return Response.json(
        { error: `「${q}」に一致する都市が見つかりませんでした。別の表記（例: 東京、Osaka）でお試しください。` },
        { status: 404 },
      );
    }
    return Response.json(results);
  } catch (e) {
    return errorResponse(e);
  }
}

function errorResponse(e: unknown) {
  if (e instanceof WeatherApiError) {
    return Response.json({ error: e.message }, { status: e.status });
  }
  console.error(e);
  return Response.json({ error: "予期しないエラーが発生しました。" }, { status: 500 });
}
