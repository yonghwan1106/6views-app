"use client";

// 6시점 — 증언 진행 중 연출. 6 증언자가 자료를 검토하는 청문회 휴정 화면.
import { useEffect, useState } from "react";
import type { AgendaId } from "@/lib/types";
import { witnessIdsForAgenda, WITNESS_META } from "@/lib/constants";
import { MicIcon } from "./ui";

// 검토 단계 — 체감 진행을 위한 순차 연출 문구
const PHASES = [
  "공공데이터 8종을 증언석에 배부하는 중",
  "증언자별 인용 근거를 검토하는 중",
  "6인의 증언을 동시에 채록하는 중",
  "정책 스트레스 점수를 산정하는 중",
];

export default function DeliberationLoader({
  agendaId,
}: {
  agendaId: AgendaId;
}) {
  const witnessIds = witnessIdsForAgenda(agendaId);
  const [phase, setPhase] = useState(0);
  const [seated, setSeated] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    // 증언자 착석 연출
    const seatTimer = setInterval(() => {
      setSeated((s) => (s < witnessIds.length ? s + 1 : s));
    }, 280);
    // 단계 진행 연출
    const phaseTimer = setInterval(() => {
      setPhase((p) => (p < PHASES.length - 1 ? p + 1 : p));
    }, 1900);
    // 경과 시간 — 마지막 단계 도달 후에도 '살아있음'을 보여주는 카운터
    const elapsedTimer = setInterval(() => {
      setElapsed((e) => e + 1);
    }, 1000);
    return () => {
      clearInterval(seatTimer);
      clearInterval(phaseTimer);
      clearInterval(elapsedTimer);
    };
  }, [witnessIds.length]);

  // 막대가 4단계(100%)에 도달한 뒤에도 실제 LLM 증언 생성은 수십 초 더 걸린다.
  // 이 구간에서 막대가 멈춘 듯 보이지 않도록 펄스·경과초·안내로 진행감을 유지한다.
  const isFinalizing = phase >= PHASES.length - 1;

  return (
    <section
      className="anim-fade flex flex-col items-center py-10 text-center"
      aria-live="polite"
      aria-busy="true"
    >
      {/* 휴정 표식 */}
      <div className="flex items-center gap-2.5">
        <span className="inline-block h-2 w-2 rounded-full bg-red live-dot" />
        <span className="text-[10.5px] font-700 uppercase tracking-[0.24em] text-red">
          증언 진행 중
        </span>
      </div>

      <h2 className="mt-4 font-serif text-[clamp(1.3rem,3vw,1.9rem)] font-700 text-navy">
        6명의 증언자가 자료를 검토 중입니다
      </h2>
      <p className="mt-1.5 text-[13px] text-muted">
        핵심 증언자 4인 · 의제별 증언자 2인이 공공데이터를 근거로 증언을 준비합니다.
      </p>

      {/* 6 증언석 착석 표시 */}
      <div className="mt-8 grid w-full max-w-[640px] grid-cols-3 gap-2.5 sm:grid-cols-6">
        {witnessIds.map((id, i) => {
          const meta = WITNESS_META[id];
          const isSeated = i < seated;
          return (
            <div
              key={id}
              className="flex flex-col items-center gap-2 transition-all duration-500"
              style={{
                opacity: isSeated ? 1 : 0.28,
                transform: isSeated ? "translateY(0)" : "translateY(6px)",
              }}
            >
              {/* 증언석 미니 명패 */}
              <div
                className="flex h-14 w-full items-center justify-center border"
                style={{
                  background: isSeated ? "#fffdf6" : "#ece3cc",
                  borderColor: isSeated
                    ? meta.accentColor
                    : "rgba(26,42,74,0.16)",
                  borderBottomWidth: isSeated ? 3 : 1,
                }}
              >
                <MicIcon
                  size={20}
                  color={isSeated ? meta.accentColor : "#b3a988"}
                />
              </div>
              <span
                className="text-[10px] font-700 leading-tight"
                style={{ color: isSeated ? "#1a2a4a" : "#a99f80" }}
              >
                {meta.name}
              </span>
              {/* 착석 점멸 */}
              <span
                className="inline-block h-1 w-1 rounded-full"
                style={{
                  background: isSeated ? meta.accentColor : "transparent",
                  animation: isSeated
                    ? "pulseDot 1.2s ease-in-out infinite"
                    : "none",
                }}
              />
            </div>
          );
        })}
      </div>

      {/* 진행 단계 표시 */}
      <div className="mt-9 w-full max-w-[440px]">
        <div className="mb-2.5 flex items-center justify-between">
          <span className="font-sans text-[12.5px] font-500 text-navy">
            {isFinalizing ? "6인의 증언을 종합·검증하는 중" : PHASES[phase]}
          </span>
          <span className="font-sans text-[11px] font-700 tabular-nums text-muted">
            {isFinalizing ? `${elapsed}초 경과` : `${phase + 1} / ${PHASES.length}`}
          </span>
        </div>
        {/* 진행 막대 — 측정 게이지 톤 */}
        <div
          className="relative h-2 w-full overflow-hidden"
          style={{ background: "#e3d8ba", borderRadius: 1 }}
        >
          <div
            className={`absolute left-0 top-0 h-full transition-all duration-700 ease-out ${isFinalizing ? "animate-pulse" : ""}`}
            style={{
              width: `${((phase + 1) / PHASES.length) * 100}%`,
              background: "#a93030",
            }}
          />
          {/* 눈금 */}
          <div className="absolute inset-0 flex justify-between px-[24%]">
            <span className="w-px bg-paper/55" />
            <span className="w-px bg-paper/55" />
            <span className="w-px bg-paper/55" />
          </div>
        </div>
        <p className="mt-3 text-[11px] leading-relaxed text-muted">
          {isFinalizing
            ? "실시간 AI 증언 생성으로 보통 20~50초가 소요됩니다. 화면을 닫지 말고 잠시만 기다려 주세요."
            : "모든 증언은 Anthropic Citations API로 출처를 검증하며, 인용 없는 진술은 자동 차단됩니다."}
        </p>
      </div>
    </section>
  );
}
