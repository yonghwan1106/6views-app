import type { Metadata, Viewport } from "next";
import { Noto_Serif_KR, Noto_Sans_KR } from "next/font/google";
import "./globals.css";
import { APP_FULL_NAME, APP_TAGLINE } from "@/lib/constants";

// 헤더·명패용 본명조 — 청문회의 권위
const notoSerifKR = Noto_Serif_KR({
  variable: "--font-serif-kr",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "900"],
  display: "swap",
});

// 본문용 본고딕 — 증언 가독성
const notoSansKR = Noto_Sans_KR({
  variable: "--font-sans-kr",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: APP_FULL_NAME,
  description: APP_TAGLINE,
  applicationName: "6시점",
  authors: [{ name: "박용환" }],
  keywords: ["교육정책", "공공데이터", "정책 스트레스 점수", "청문회", "이해관계자"],
};

export const viewport: Viewport = {
  themeColor: "#F8F4E9",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${notoSerifKR.variable} ${notoSansKR.variable} h-full antialiased`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
