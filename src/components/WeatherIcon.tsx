import Image from "next/image";
import type { Condition } from "@/lib/types";

export function WeatherIcon({ condition, size = 64 }: { condition: Condition; size?: number }) {
  if (!condition.icon) return null;
  // アイコンには濃いグレー（厚い雲など）もあるため、明るい背景を敷いてダークモードでも見えるようにする
  return (
    <span className="inline-flex shrink-0 rounded-full bg-sky-100 dark:bg-sky-200/90">
      <Image
        src={`https://openweathermap.org/img/wn/${condition.icon}@2x.png`}
        alt={condition.description}
        width={size}
        height={size}
        unoptimized
      />
    </span>
  );
}
