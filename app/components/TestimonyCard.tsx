"use client";

// 6시점 — 증언석 카드. 명패 + 마이크 + 증언 본문 + 인용 칩.
// 청문회 증언석 메타포의 핵심 컴포넌트.
import type { Testimony } from "@/lib/types";
import { WITNESS_META } from "@/lib/constants";
import { MicIcon, DocIcon, QuoteMark, StanceBadge, renderRichText } from "./ui";

export default function TestimonyCard({
  testimony,
  index,
  seatNo,
}: {
  testimony: Testimony;
  index: number; // 등장 순서 (애니메이션 지연용)
  seatNo: number; // 증언석 번호
}) {
  const meta = WITNESS_META[testimony.witnessId];
  const accent = meta.accentColor;
  const isCore = testimony.tier === "core";
  const hasError = !!testimony.error;

  // 본문 인용 데이터셋 — 중복 제거
  const citedDocs = Array.from(
    new Set(
      testimony.segments.flatMap((s) =>
        s.citations.map((c) => c.documentTitle),
      ),
    ),
  );

  return (
    <article
      className="hearing-panel anim-rise relative flex flex-col"
      style={{ animationDelay: `${index * 110}ms` }}
    >
      {/* 좌측 색상 인덱스 바 — 증언석 식별 */}
      <span
        className="absolute left-0 top-0 h-full w-1"
        style={{ background: accent }}
      />

      {/* ===== 명패 (Nameplate) ===== */}
      <div
        className="relative flex items-stretch"
        style={{ background: accent }}
      >
        {/* 마이크 — 증언석 위 */}
        <div
          className="flex w-14 shrink-0 items-center justify-center"
          style={{ background: "rgba(0,0,0,0.16)" }}
        >
          <MicIcon size={24} color="#f8f4e9" />
        </div>

        {/* 명패 본체 */}
        <div className="flex flex-1 items-center justify-between gap-2 py-2.5 pl-3.5 pr-3">
          <div className="min-w-0">
            <div className="flex items-baseline gap-2">
              <h3 className="engraved font-serif text-[1.18rem] font-700 leading-none text-paper">
                {meta.name}
              </h3>
              <span className="text-[9.5px] font-700 uppercase tracking-[0.14em] text-paper/55">
                증언석 {String(seatNo).padStart(2, "0")}
              </span>
            </div>
            <p className="mt-1 truncate text-[11px] font-400 text-paper/75">
              {meta.role}
            </p>
          </div>

          {/* tier 배지 */}
          <span
            className="shrink-0 px-1.5 py-0.5 text-[8.5px] font-700 uppercase tracking-[0.1em]"
            style={{
              background: "rgba(248,244,233,0.16)",
              color: "#f8f4e9",
              borderRadius: 2,
            }}
          >
            {isCore ? "핵심 증언자" : "의제 증언자"}
          </span>
        </div>

        {/* 명패 받침 그림자 */}
        <span
          className="absolute -bottom-[5px] left-3 right-3 h-[5px]"
          style={{
            background:
              "linear-gradient(to bottom, rgba(26,42,74,0.28), transparent)",
          }}
        />
      </div>

      {/* ===== 증언 본문 ===== */}
      <div className="flex flex-1 flex-col p-4 pt-5">
        {/* 입장 배지 */}
        <div className="mb-3 flex items-center gap-2">
          <span className="text-[9.5px] font-700 uppercase tracking-[0.16em] text-muted">
            진술 입장
          </span>
          {hasError ? (
            <span
              className="px-2.5 py-[3px] text-[10.5px] font-700 uppercase tracking-wider"
              style={{
                background: "#6b6655",
                color: "#f8f4e9",
                borderRadius: 2,
              }}
            >
              일시 오류
            </span>
          ) : (
            <StanceBadge stance={testimony.stance} />
          )}
        </div>

        {hasError ? (
          <p className="flex-1 text-[12.5px] leading-relaxed text-muted">
            이 증언자의 진술을 일시적으로 불러오지 못했습니다. 잠시 후
            청문회를 다시 개시해 주세요.
          </p>
        ) : (
          <>
            {/* 인용 부호 + 증언문 */}
            <div className="relative flex-1">
              <span className="absolute -left-0.5 -top-1 opacity-90">
                <QuoteMark color={accent} />
              </span>
              <div className="pl-7 pt-1.5">
                {testimony.segments.map((seg, si) => (
                  <p
                    key={si}
                    className="mb-2 text-[14px] leading-[1.74] text-ink last:mb-0"
                  >
                    {/* 인용된 segment는 밑줄로 표시 */}
                    {seg.citations.length > 0 ? (
                      <span
                        className="box-decoration-clone"
                        style={{
                          borderBottom: `1.5px solid ${accent}55`,
                          paddingBottom: 1,
                        }}
                      >
                        {renderRichText(seg.text)}
                      </span>
                    ) : (
                      renderRichText(seg.text)
                    )}
                  </p>
                ))}
              </div>
            </div>

            {/* ===== 인용 데이터 칩 ===== */}
            <div className="mt-4 border-t border-dashed border-navy/18 pt-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-[9.5px] font-700 uppercase tracking-[0.14em] text-muted">
                  <DocIcon size={12} color={accent} />
                  인용 공공데이터
                </span>
                <span className="text-[10px] font-700 tabular-nums text-navy/55">
                  {testimony.citationCount}회 인용 ·{" "}
                  {testimony.dataTypesUsed}종
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {citedDocs.length > 0 ? (
                  citedDocs.map((doc) => (
                    <span
                      key={doc}
                      className="inline-flex items-center gap-1 px-2 py-[3px] text-[11px] font-700"
                      style={{
                        // 미색 카드 위 가독 대비 확보:
                        // 옅은 색칠 배경 + 진한 남색 텍스트로 최소 대비 보장.
                        background: `${accent}1f`,
                        color: "#1a2a4a",
                        border: `1px solid ${accent}55`,
                        borderLeft: `3px solid ${accent}`,
                        borderRadius: 2,
                      }}
                    >
                      {doc}
                    </span>
                  ))
                ) : (
                  <span className="text-[11px] text-muted">
                    인용 데이터 없음
                  </span>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </article>
  );
}
