"use client";

// 6시점 — 청문회 마스트헤드. 의사봉 로고 + 명칭 + 태그라인.
import { APP_NAME, APP_TAGLINE } from "@/lib/constants";
import { GavelIcon } from "./ui";

export default function HearingHeader({ busy = false }: { busy?: boolean }) {
  return (
    <header className="relative border-b border-navy/25 bg-paper">
      {/* 상단 빨간 띠 — 정부 문서의 직인선 */}
      <div className="h-[3px] w-full bg-red" />

      <div className="mx-auto flex max-w-[1180px] flex-col gap-3 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8 sm:py-6">
        {/* 로고 블록 */}
        <div className="flex items-center gap-3.5">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center border border-navy/35"
            style={{ background: "#fffdf6" }}
          >
            <GavelIcon size={27} />
          </div>
          <div className="min-w-0">
            <div className="flex items-baseline gap-2">
              <h1 className="font-serif text-[1.7rem] font-900 leading-none tracking-tight text-navy">
                6시점
              </h1>
              <span className="hidden text-[11px] font-500 tracking-[0.04em] text-muted sm:inline">
                六視點
              </span>
            </div>
            <div className="mt-1 text-[10px] font-700 uppercase tracking-[0.22em] text-red">
              교육정책 스트레스 테스트
            </div>
          </div>
        </div>

        {/* 태그라인 — 데스크톱 */}
        <p className="hidden max-w-md border-l-2 border-navy/25 pl-4 text-[12.5px] leading-relaxed text-muted lg:block">
          {APP_TAGLINE}
        </p>

        {/* 회차 표식 — 정적 표시.
            증언 진행 중에만 점멸로 전환하여 로딩 표시와 의미를 구분한다. */}
        <div
          className="flex items-center gap-2.5 self-start border px-2.5 py-1 sm:self-auto"
          style={{
            borderColor: busy ? "#a93030" : "rgba(26,42,74,0.22)",
            background: busy ? "#f6ebe8" : "transparent",
            borderRadius: 2,
            transition: "all 0.25s ease",
          }}
        >
          <span
            className={`inline-block h-2 w-2 rounded-full bg-red ${
              busy ? "live-dot" : ""
            }`}
          />
          <span
            className="text-[10.5px] font-700 uppercase tracking-[0.18em]"
            style={{ color: busy ? "#a93030" : "#1a2a4a" }}
          >
            {busy ? "증언 채록 중" : "공개 청문회 시스템"}
          </span>
        </div>
      </div>

      {/* 모바일용 태그라인 */}
      <p className="border-t border-navy/12 px-5 py-2.5 text-[11.5px] leading-relaxed text-muted lg:hidden">
        {APP_TAGLINE}
      </p>

      <span className="sr-only">{APP_NAME} 교육정책 스트레스 테스트</span>
    </header>
  );
}
