import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "天気予報アプリ",
  description: "都市名や現在地から、気温・天気・湿度・降水確率を確認できる天気予報アプリ",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ja" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
