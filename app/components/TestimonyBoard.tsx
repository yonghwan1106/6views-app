"use client";

// 6시점 — 3단계: 6 증언석 보드. 증언 카드 그리드 + 진술 요약.
import type { Testimony } from "@/lib/types";
import TestimonyCard from "./TestimonyCard";
import { SectionMark, STANCE_LABEL } from "./ui";

export default function TestimonyBoard({
  testimonies,
}: {
  testimonies: Testimony[];
}) {
  // 입장별 집계
  const tally = testimonies.reduce(
    (acc, t) => {
      if (t.error) return acc;
      acc[t.stance] += 1;
      return acc;
    },
    { support: 0, oppose: 0, conditional: 0 } as Record<
      Testimony["stance"],
      number
    >,
  );

  const totalCitations = testimonies.reduce(
    (n, t) => n + t.citationCount,
    0,
  );

  const STANCE_COLOR: Record<Testimony["stance"], string> = {
    support: "#1f5d3f",
    oppose: "#a93030",
    conditional: "#8a6d24",
  };

  return (
    <section aria-labelledby="testimony-heading" className="scroll-mt-24">
      <div
        id="testimony-heading"
        className="flex flex-wrap items-end justify-between gap-3 scroll-mt-24"
      >
        <SectionMark
          no="03"
          kicker="Stakeholder Testimony"
          title="6인의 증언석"
        />
        {/* 인용 총계 */}
        <span className="pb-0.5 text-[11px] font-700 tabular-nums text-muted">
          공공데이터 인용{" "}
          <span className="text-navy">{totalCitations}회</span>
        </span>
      </div>

      {/* 입장 집계 바 — 청문회 표결 현황 */}
      <div className="mt-4 flex items-stretch overflow-hidden border border-navy/22" style={{ borderRadius: 2 }}>
        {(["support", "conditional", "oppose"] as const).map((stance) => {
          const count = tally[stance];
          const ratio = testimonies.length
            ? count / testimonies.length
            : 0;
          return (
            <div
              key={stance}
              className="flex items-center justify-center gap-2 px-3 py-2 transition-all"
              style={{
                flex: count > 0 ? `${Math.max(ratio, 0.12)} 1 0` : "0.45 1 0",
                background:
                  count > 0 ? STANCE_COLOR[stance] : "#ece3cc",
                color: count > 0 ? "#f8f4e9" : "#a99f80",
              }}
            >
              <span className="font-serif text-[1.05rem] font-900 tabular-nums">
                {count}
              </span>
              <span className="text-[11px] font-700">
                {STANCE_LABEL[stance]}
              </span>
            </div>
          );
        })}
      </div>

      {/* 6 증언석 그리드 — 모바일 1열 / 소형 2열 / 데스크톱 3열 */}
      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {testimonies.map((t, i) => (
          <TestimonyCard
            key={t.witnessId}
            testimony={t}
            index={i}
            seatNo={i + 1}
          />
        ))}
      </div>
    </section>
  );
}
