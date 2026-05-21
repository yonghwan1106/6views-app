"use client";

// 6시점 — 5단계: 8 절충안. 법규·행정 RAG 필터를 통과한 실현 가능 안.
import type { Compromise } from "@/lib/types";
import { WITNESS_META } from "@/lib/constants";
import {
  SectionMark,
  CheckIcon,
  CrossIcon,
  FEASIBILITY_LABEL,
  FEASIBILITY_TONE,
} from "./ui";

function CompromiseRow({
  item,
  rank,
  index,
}: {
  item: Compromise;
  rank: number; // 우선순위 표시용 1-base 순위 (정렬 후)
  index: number;
}) {
  const feasColor = FEASIBILITY_TONE[item.feasibility];
  const supporters = item.supportingWitnesses
    .map((w) => WITNESS_META[w]?.name)
    .filter(Boolean);

  // 상위 우선순위(법규 통과 + 실현성 높음)는 좌측 띠를 강조
  const topPriority = item.legalPassed && item.feasibility === "high";

  return (
    <article
      className="anim-rise relative flex flex-col gap-2 border bg-[#fffdf6] p-4 pl-5 sm:flex-row sm:gap-4"
      style={{
        animationDelay: `${index * 75}ms`,
        borderRadius: 2,
        borderColor: topPriority ? "rgba(31,93,63,0.5)" : "rgba(26,42,74,0.22)",
      }}
    >
      {/* 좌측 우선순위 띠 — 실현성 색으로 한눈에 신호 */}
      <span
        className="absolute left-0 top-0 h-full w-1"
        style={{ background: feasColor }}
      />

      {/* 절충안 순위 + 우선 표식 */}
      <div className="flex shrink-0 items-start gap-3 sm:flex-col sm:items-center">
        <div className="flex flex-col items-center gap-1">
          <div
            className="flex h-9 w-9 items-center justify-center font-serif text-[15px] font-900"
            style={{
              background: topPriority ? "#1f5d3f" : "#1a2a4a",
              color: "#f8f4e9",
              borderRadius: 2,
            }}
          >
            {String(rank).padStart(2, "0")}
          </div>
          {topPriority && (
            <span
              className="whitespace-nowrap px-1 py-0.5 text-[8px] font-700 uppercase tracking-[0.06em]"
              style={{
                background: "#1f5d3f",
                color: "#f8f4e9",
                borderRadius: 1,
              }}
            >
              최우선
            </span>
          )}
        </div>
      </div>

      {/* 본문 */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h3 className="font-serif text-[15px] font-700 leading-snug text-navy">
            {item.title}
          </h3>
          {/* 법규 통과 표식 */}
          <span
            className="inline-flex shrink-0 items-center gap-1 px-2 py-[3px] text-[10px] font-700 uppercase tracking-wider"
            style={{
              background: item.legalPassed ? "#1f5d3f12" : "#a9303012",
              color: item.legalPassed ? "#1f5d3f" : "#a93030",
              border: `1px solid ${item.legalPassed ? "#1f5d3f44" : "#a9303044"}`,
              borderRadius: 2,
            }}
          >
            {item.legalPassed ? (
              <>
                <CheckIcon size={11} color="#1f5d3f" />
                법규 검토 통과
              </>
            ) : (
              <>
                <CrossIcon size={10} color="#a93030" />
                법규 보완 필요
              </>
            )}
          </span>
        </div>

        <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink/85">
          {item.description}
        </p>

        {item.legalNote && (
          <p className="mt-1.5 border-l-2 border-navy/25 pl-2 text-[11px] leading-relaxed text-muted">
            법규 검토: {item.legalNote}
          </p>
        )}

        {/* 하단: 실현성 + 지지 증언자 */}
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-dashed border-navy/18 pt-2.5">
          {/* 실현성 게이지 */}
          <div className="flex items-center gap-2">
            <span className="text-[9.5px] font-700 uppercase tracking-wider text-muted">
              실현성
            </span>
            <div className="flex items-center gap-1">
              {(["low", "medium", "high"] as const).map((lvl, li) => {
                const levels = { low: 1, medium: 2, high: 3 };
                const filled = li < levels[item.feasibility];
                return (
                  <span
                    key={lvl}
                    className="inline-block h-2.5 w-4"
                    style={{
                      background: filled ? feasColor : "#e3d8ba",
                      borderRadius: 1,
                    }}
                  />
                );
              })}
            </div>
            <span
              className="text-[10.5px] font-700"
              style={{ color: feasColor }}
            >
              {FEASIBILITY_LABEL[item.feasibility]}
            </span>
          </div>

          {/* 지지 증언자 */}
          {supporters.length > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="text-[9.5px] font-700 uppercase tracking-wider text-muted">
                지지 증언자
              </span>
              <span className="text-[11px] font-500 text-navy/80">
                {supporters.join(" · ")}
              </span>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

// 우선순위 정렬 — 법규 통과 우선, 그다음 실현성 높은 순.
// 발표자가 "추진 가능한 안부터" 짚어 갈 수 있게 한다.
const FEAS_RANK: Record<Compromise["feasibility"], number> = {
  high: 3,
  medium: 2,
  low: 1,
};

function priorityScore(c: Compromise): number {
  return (c.legalPassed ? 100 : 0) + FEAS_RANK[c.feasibility] * 10;
}

export default function CompromiseList({
  compromises,
}: {
  compromises: Compromise[];
}) {
  const passed = compromises.filter((c) => c.legalPassed).length;

  // 우선순위 정렬 — 동점이면 원래 id 순 유지(안정 정렬)
  const sorted = [...compromises].sort((a, b) => {
    const diff = priorityScore(b) - priorityScore(a);
    return diff !== 0 ? diff : a.id - b.id;
  });

  const topCount = sorted.filter(
    (c) => c.legalPassed && c.feasibility === "high",
  ).length;

  return (
    <section aria-labelledby="compromise-heading" className="scroll-mt-24">
      <div
        id="compromise-heading"
        className="flex flex-wrap items-end justify-between gap-3 scroll-mt-24"
      >
        <SectionMark
          no="05"
          kicker="Negotiated Compromises"
          title="협상 절충안"
        />
        {/* 통과 요약 */}
        <div className="flex items-center gap-2 pb-0.5">
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-700"
            style={{
              background: "#1f5d3f12",
              color: "#1f5d3f",
              border: "1px solid #1f5d3f44",
              borderRadius: 2,
            }}
          >
            <CheckIcon size={12} color="#1f5d3f" />
            {passed}건 법규 통과
          </span>
          <span className="text-[11px] font-500 text-muted">
            / 총 {compromises.length}건
          </span>
        </div>
      </div>

      <p className="mt-2.5 pl-[2.1rem] text-[13px] leading-relaxed text-muted">
        6인의 증언을 종합한 협상 알고리즘이 도출한 절충안입니다. 모든 안은
        초·중등교육법 등 현행 법규 RAG 필터를 거쳤으며,
        <strong className="text-navy"> 추진 우선순위 순</strong>으로
        배열했습니다.
      </p>

      {/* 우선순위 범례 — 좌측 띠 색의 의미 */}
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 pl-[2.1rem] text-[10.5px] font-500 text-muted">
        <span className="font-700 uppercase tracking-wider">실현성 신호</span>
        {(
          [
            ["high", "추진 즉시 가능"],
            ["medium", "조건부 추진"],
            ["low", "장기 검토"],
          ] as const
        ).map(([lvl, txt]) => (
          <span key={lvl} className="flex items-center gap-1.5">
            <span
              className="inline-block h-2.5 w-2.5"
              style={{ background: FEASIBILITY_TONE[lvl], borderRadius: 1 }}
            />
            {txt}
          </span>
        ))}
        {topCount > 0 && (
          <span className="text-[10.5px] font-700 text-[#1f5d3f]">
            · 최우선 {topCount}건
          </span>
        )}
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 lg:grid-cols-2">
        {sorted.map((item, i) => (
          <CompromiseRow key={item.id} item={item} rank={i + 1} index={i} />
        ))}
      </div>
    </section>
  );
}
