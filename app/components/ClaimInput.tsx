"use client";

// 6시점 — 2단계: 교육정책 주장 입력. "청문회 개시" 발의.
import { useMemo } from "react";
import type { AgendaId } from "@/lib/types";
import { AGENDAS } from "@/lib/constants";
import { SectionMark, ArrowIcon } from "./ui";

// 의제별 주장 예시 — 짧은 칩 라벨 + 진술에 채워질 전체 문장.
// 칩은 절단 없이 라벨(찬/반 입장)을 보여주고, 클릭 시 전체 문장이 입력된다.
interface ClaimExample {
  label: string; // 칩에 표시할 짧은 입장 요약
  full: string; // 입력란에 채워질 정식 주장
}

const CLAIM_EXAMPLES: Record<AgendaId, ClaimExample[]> = {
  consolidation: [
    {
      label: "소규모 학교 통폐합 찬성",
      full: "학생 수가 60명 미만인 농어촌 소규모 학교는 통폐합해야 한다.",
    },
    {
      label: "마을 학교 존치 우선",
      full: "통학버스를 늘리더라도 학교는 마을에 남겨야 한다.",
    },
  ],
  neulbom: [
    {
      label: "늘봄, 사교육비 절감 효과",
      full: "늘봄학교는 맞벌이 가정의 사교육비를 실제로 줄인다.",
    },
    {
      label: "늘봄, 돌봄인력 부담 가중",
      full: "늘봄학교 확대는 돌봄전담사의 노동 부담만 키운다.",
    },
  ],
  "basic-literacy": [
    {
      label: "AI 교과서로 결손 회복",
      full: "AI 디지털교과서는 기초학력 미달 학생의 학습 결손을 메운다.",
    },
    {
      label: "교사 1:1 보충이 우선",
      full: "기초학력은 AI보다 교사 1:1 보충지도로 회복해야 한다.",
    },
  ],
  "teacher-admin": [
    {
      label: "AI 자동화로 행정업무 절반↓",
      full: "AI 행정 자동화로 교사의 행정업무를 절반으로 줄일 수 있다.",
    },
    {
      label: "자동화, 지원인력 일자리 위협",
      full: "행정 자동화는 비정규직 지원 인력의 일자리를 위협한다.",
    },
  ],
  inclusion: [
    {
      label: "한국어 강사 의무 배치",
      full: "다문화 학생 밀집 학교에는 한국어 강사를 의무 배치해야 한다.",
    },
    {
      label: "특수교육 통합학급 원칙",
      full: "특수교육 대상 학생은 일반학급 통합교육을 원칙으로 해야 한다.",
    },
  ],
};

export default function ClaimInput({
  agendaId,
  claim,
  onClaimChange,
  onSubmit,
  disabled,
}: {
  agendaId: AgendaId;
  claim: string;
  onClaimChange: (v: string) => void;
  onSubmit: () => void;
  disabled: boolean;
}) {
  const agenda = AGENDAS[agendaId];
  const examples = CLAIM_EXAMPLES[agendaId];
  const placeholder = useMemo(
    () => `예: ${examples[0].full}`,
    [examples],
  );

  const trimmed = claim.trim();
  const tooShort = trimmed.length > 0 && trimmed.length < 8;
  const ready = trimmed.length >= 8 && !disabled;

  return (
    <section aria-labelledby="claim-heading" className="anim-rise">
      <div id="claim-heading">
        <SectionMark
          no="02"
          kicker="Policy Claim"
          title="검증할 정책 주장을 진술하십시오"
        />
      </div>

      {/* 선택된 의제 표시 */}
      <div className="mt-3 flex items-center gap-2 pl-[2.1rem]">
        <span className="text-[11px] font-700 uppercase tracking-[0.14em] text-muted">
          채택 안건
        </span>
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[12px] font-700 text-paper"
          style={{ background: "#1a2a4a", borderRadius: 2 }}
        >
          {agenda.title}
        </span>
      </div>

      {/* 입력 패널 */}
      <div className="hearing-panel mt-5 p-1">
        <div className="relative">
          {/* 좌측 행 번호 장식 */}
          <div className="pointer-events-none absolute left-0 top-0 flex h-full w-9 flex-col items-center gap-[1.05rem] border-r border-navy/12 pt-4 text-[10px] font-500 text-navy/30">
            {["진", "술", "기", "록"].map((c) => (
              <span key={c}>{c}</span>
            ))}
          </div>

          <textarea
            value={claim}
            onChange={(e) => onClaimChange(e.target.value)}
            placeholder={placeholder}
            rows={4}
            maxLength={300}
            disabled={disabled}
            aria-label="교육정책 주장 입력"
            className="w-full resize-none bg-transparent py-4 pl-12 pr-4 font-sans text-[15px] leading-relaxed text-ink outline-none placeholder:text-navy/30 disabled:opacity-50"
            style={{ fontFamily: "var(--font-sans)" }}
          />
        </div>

        {/* 패널 하단 바 */}
        <div className="flex items-center justify-between border-t border-navy/12 bg-paper-dark/55 px-3.5 py-2">
          <span
            className={`text-[11px] font-500 tabular-nums ${
              tooShort ? "text-red" : "text-muted"
            }`}
          >
            {tooShort
              ? "8자 이상 진술해 주십시오"
              : `${trimmed.length} / 300자`}
          </span>
          <span className="text-[10px] font-500 uppercase tracking-wider text-navy/35">
            증언 전 진술 기록
          </span>
        </div>
      </div>

      {/* 예시 주장 칩 — 짧은 입장 라벨, 절단 없음. 클릭 시 전체 문장 입력. */}
      <div className="mt-3.5 flex flex-col gap-2 pl-[2.1rem]">
        <span className="text-[10.5px] font-700 uppercase tracking-wider text-muted">
          예시 진술 — 클릭하면 정식 주장이 입력됩니다
        </span>
        <div className="flex flex-wrap gap-2">
          {examples.map((ex) => {
            const active = claim.trim() === ex.full;
            return (
              <button
                key={ex.full}
                type="button"
                disabled={disabled}
                onClick={() => onClaimChange(ex.full)}
                title={ex.full}
                aria-pressed={active}
                className="group flex cursor-pointer items-center gap-1.5 border px-2.5 py-1.5 text-left text-[12px] font-500 leading-snug transition-colors disabled:opacity-50"
                style={{
                  borderRadius: 2,
                  background: active ? "#1a2a4a" : "#f8f4e9",
                  borderColor: active ? "#1a2a4a" : "rgba(26,42,74,0.28)",
                  color: active ? "#f8f4e9" : "#1a2a4a",
                }}
              >
                <span
                  className="inline-block h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ background: "#a93030" }}
                />
                {ex.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 청문회 개시 버튼 */}
      <div className="mt-6 flex flex-col items-stretch gap-3 pl-[2.1rem] sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={onSubmit}
          disabled={!ready}
          className="group relative flex items-center justify-center gap-2.5 px-7 py-3.5 font-serif text-[15px] font-700 tracking-wide transition-all duration-200"
          style={{
            background: ready ? "#a93030" : "#cdbf9d",
            color: ready ? "#f8f4e9" : "#7d7458",
            borderRadius: 2,
            cursor: ready ? "pointer" : "not-allowed",
            boxShadow: ready
              ? "0 12px 26px -14px rgba(169,48,48,0.85)"
              : "none",
          }}
        >
          청문회 개시
          <span className="transition-transform duration-200 group-hover:translate-x-1">
            <ArrowIcon size={18} color={ready ? "#f8f4e9" : "#7d7458"} />
          </span>
        </button>
        <p className="text-[11.5px] leading-relaxed text-muted">
          개시하면 6인의 증언자가 공공데이터를 검토하여 동시에 증언합니다.
        </p>
      </div>
    </section>
  );
}
