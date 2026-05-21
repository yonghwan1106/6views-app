"use client";

// 6시점 — 메인 화면. 단일 페이지, 단계별 청문회 진행.
// 의제 선택 → 주장 입력 → 증언 → 정책 스트레스 점수 → 절충안 → 시민 합의도.
import { useState, useCallback, useRef } from "react";
import type { AgendaId, DeliberateResponse } from "@/lib/types";
import { APP_NAME } from "@/lib/constants";

import HearingHeader from "./components/HearingHeader";
import AgendaSelect from "./components/AgendaSelect";
import ClaimInput from "./components/ClaimInput";
import DeliberationLoader from "./components/DeliberationLoader";
import HearingRecordBar from "./components/HearingRecordBar";
import TestimonyBoard from "./components/TestimonyBoard";
import StressScorePanel from "./components/StressScorePanel";
import CompromiseList from "./components/CompromiseList";
import CitizenConsensusNote from "./components/CitizenConsensusNote";
import DemoModeBanner from "./components/DemoModeBanner";
import ResultNav, { type ResultSection } from "./components/ResultNav";
import { GavelIcon, ArrowIcon } from "./components/ui";

type Stage = "intake" | "loading" | "result" | "error";

// 오류 종류 — 원인별 안내·복구 동작 분기
type ErrorKind = "network" | "server" | "client" | "unknown";

interface HearingError {
  kind: ErrorKind;
  message: string;
}

// 결과 영역 앵커 목차 — 발표자가 한 화면씩 지목 이동
const RESULT_SECTIONS: ResultSection[] = [
  { id: "sec-record", no: "", label: "기록 표제" },
  { id: "testimony-heading", no: "03", label: "6 증언석" },
  { id: "stress-heading", no: "04", label: "스트레스 점수" },
  { id: "compromise-heading", no: "05", label: "절충안" },
  { id: "consensus-heading", no: "06", label: "시민 합의도" },
];

export default function Home() {
  const [agendaId, setAgendaId] = useState<AgendaId | null>(null);
  const [claim, setClaim] = useState("");
  const [stage, setStage] = useState<Stage>("intake");
  const [result, setResult] = useState<DeliberateResponse | null>(null);
  const [hearingError, setHearingError] = useState<HearingError | null>(null);

  const resultRef = useRef<HTMLDivElement>(null);
  const claimRef = useRef<HTMLDivElement>(null);

  // 의제 선택 — 선택 시 주장 입력 영역으로 부드럽게 이동
  const handleAgenda = useCallback((id: AgendaId) => {
    setAgendaId(id);
    requestAnimationFrame(() => {
      claimRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }, []);

  // 청문회 개시 — POST /api/deliberate
  const handleSubmit = useCallback(async () => {
    if (!agendaId || claim.trim().length < 8) return;
    setStage("loading");
    setResult(null);
    setHearingError(null);

    requestAnimationFrame(() => {
      resultRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });

    try {
      const res = await fetch("/api/deliberate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agendaId, claim: claim.trim() }),
      });

      if (!res.ok) {
        // 4xx — 입력·요청 문제 / 5xx — 서버 처리 문제
        const kind: ErrorKind = res.status >= 500 ? "server" : "client";
        throw Object.assign(new Error(), {
          kind,
          status: res.status,
        });
      }

      const data: DeliberateResponse = await res.json();
      setResult(data);
      setStage("result");

      requestAnimationFrame(() => {
        resultRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      });
    } catch (err) {
      // fetch 실패(네트워크 단절)는 TypeError로 떨어진다
      const e = err as { kind?: ErrorKind; status?: number };
      let kind: ErrorKind = e.kind ?? "unknown";
      if (!e.kind && err instanceof TypeError) kind = "network";

      const messages: Record<ErrorKind, string> = {
        network:
          "증언석과의 연결이 끊겼습니다. 네트워크 상태를 확인한 뒤, 같은 주장으로 다시 개시할 수 있습니다.",
        server: `증언 채록 서버에서 오류가 발생했습니다${
          e.status ? ` (HTTP ${e.status})` : ""
        }. 잠시 후 다시 개시해 주십시오.`,
        client: `요청을 처리할 수 없습니다${
          e.status ? ` (HTTP ${e.status})` : ""
        }. 주장 진술을 점검한 뒤 다시 시도해 주십시오.`,
        unknown:
          "청문회 진행 중 예기치 못한 오류가 발생했습니다. 주장을 확인한 뒤 다시 개시해 주십시오.",
      };
      setHearingError({ kind, message: messages[kind] });
      setStage("error");
    }
  }, [agendaId, claim]);

  // 오류 후: 입력 단계로 복귀 — 주장을 수정해 다시 개시할 수 있게
  const handleEditClaim = useCallback(() => {
    setStage("intake");
    setHearingError(null);
    requestAnimationFrame(() => {
      claimRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }, []);

  // 새 청문회 — 초기화
  const handleReset = useCallback(() => {
    setStage("intake");
    setResult(null);
    setHearingError(null);
    setClaim("");
    setAgendaId(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <HearingHeader busy={stage === "loading"} />

      <main className="mx-auto w-full max-w-[1180px] flex-1 px-5 py-8 sm:px-8 sm:py-10">
        {/* ===== 인트로 — 청문회 개정 선언 ===== */}
        <section className="mb-10 border-b border-navy/15 pb-9">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl">
              <div className="mb-3 inline-flex items-center gap-2 border border-navy/25 bg-paper px-2.5 py-1">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-red" />
                <span className="text-[10px] font-700 uppercase tracking-[0.2em] text-navy">
                  교육정책 공개 청문회 시뮬레이터
                </span>
              </div>
              <h2 className="font-serif text-[clamp(1.6rem,4vw,2.5rem)] font-900 leading-[1.18] text-navy">
                교육 정책은 한쪽 말이 아닌,
                <br />
                <span className="relative inline-block">
                  6 시점의 데이터 청문회
                  <span className="absolute -bottom-1 left-0 h-[3px] w-full bg-red" />
                </span>
                에서 시작됩니다.
              </h2>
              <p className="mt-4 max-w-xl text-[14px] leading-relaxed text-muted">
                정책 주장 하나를 진술하면 학생·학부모·교사·교육청을 비롯한 6인의
                이해관계자가 공공데이터를 근거로 동시에 증언합니다. 증언은
                <strong className="text-navy"> 정책 스트레스 점수</strong>와 8건의
                절충안으로 종합됩니다.
              </p>
            </div>

            {/* 절차 요약 카드 */}
            <ol className="grid shrink-0 grid-cols-2 gap-2 lg:w-[280px]">
              {[
                { n: "01", t: "안건 선택", d: "5대 교육정책 의제" },
                { n: "02", t: "주장 진술", d: "검증할 정책 주장" },
                { n: "03", t: "6인 증언", d: "공공데이터 인용" },
                { n: "04", t: "점수·절충", d: "스트레스 점수 100" },
              ].map((s) => (
                <li
                  key={s.n}
                  className="border border-navy/20 bg-[#fffdf6] p-2.5"
                  style={{ borderRadius: 2 }}
                >
                  <div className="font-serif text-[13px] font-900 text-red">
                    {s.n}
                  </div>
                  <div className="mt-0.5 font-serif text-[12.5px] font-700 text-navy">
                    {s.t}
                  </div>
                  <div className="text-[10px] leading-tight text-muted">
                    {s.d}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ===== 01. 의제 선택 ===== */}
        <div className="mb-12">
          <AgendaSelect selected={agendaId} onSelect={handleAgenda} />
        </div>

        {/* ===== 02. 주장 입력 ===== */}
        {agendaId && (
          <div ref={claimRef} className="mb-12 scroll-mt-6">
            <ClaimInput
              agendaId={agendaId}
              claim={claim}
              onClaimChange={setClaim}
              onSubmit={handleSubmit}
              disabled={stage === "loading"}
            />
          </div>
        )}

        {/* ===== 결과 영역 ===== */}
        <div ref={resultRef} className="scroll-mt-6">
          {/* 로딩 */}
          {stage === "loading" && agendaId && (
            <div className="border-t-2 border-navy/20 pt-8">
              <DeliberationLoader agendaId={agendaId} />
            </div>
          )}

          {/* 오류 — 원인별 안내 + 복구 동작 분기 */}
          {stage === "error" && hearingError && (
            <div className="border-t-2 border-red/40 pt-8">
              <div
                className="mx-auto flex max-w-xl flex-col items-center gap-3 border border-red/40 px-6 py-9 text-center"
                style={{ background: "#f6ebe8", borderRadius: 2 }}
              >
                <span
                  className="flex h-11 w-11 items-center justify-center font-serif text-xl font-900 text-paper"
                  style={{ background: "#a93030", borderRadius: 2 }}
                >
                  !
                </span>
                {/* 오류 종류 표식 */}
                <span
                  className="px-2 py-0.5 text-[9.5px] font-700 uppercase tracking-[0.14em]"
                  style={{
                    background: "#a9303018",
                    color: "#a93030",
                    border: "1px solid #a9303044",
                    borderRadius: 2,
                  }}
                >
                  {hearingError.kind === "network"
                    ? "연결 오류"
                    : hearingError.kind === "server"
                      ? "서버 오류"
                      : hearingError.kind === "client"
                        ? "요청 오류"
                        : "알 수 없는 오류"}
                </span>
                <h3 className="font-serif text-[1.2rem] font-700 text-navy">
                  청문회를 진행하지 못했습니다
                </h3>
                <p className="max-w-md text-[13px] leading-relaxed text-muted">
                  {hearingError.message}
                </p>

                {/* 복구 동작 — 두 갈래: 같은 주장 재시도 / 주장 수정 */}
                <div className="mt-1 flex flex-col items-stretch gap-2.5 sm:flex-row sm:items-center">
                  <button
                    type="button"
                    onClick={handleSubmit}
                    className="flex cursor-pointer items-center justify-center gap-2 bg-navy px-5 py-2.5 font-serif text-[13.5px] font-700 text-paper transition-colors hover:bg-navy-soft"
                    style={{ borderRadius: 2 }}
                  >
                    같은 주장으로 다시 개시
                    <ArrowIcon size={15} color="#f8f4e9" />
                  </button>
                  <button
                    type="button"
                    onClick={handleEditClaim}
                    className="cursor-pointer border border-navy/35 bg-paper px-5 py-2.5 font-serif text-[13.5px] font-700 text-navy transition-colors hover:border-red hover:text-red"
                    style={{ borderRadius: 2 }}
                  >
                    주장 수정하기
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 결과 — 앵커 목차로 구조화. 발표자가 한 화면씩 지목. */}
          {stage === "result" && result && (
            <div className="border-t-2 border-navy/25 pt-8">
              {/* 데모 모드 고지 — 결과 최상단 (P0) */}
              {result.isMock && (
                <div className="mb-7">
                  <DemoModeBanner />
                </div>
              )}

              {/* 결과 목차 내비게이션 — sticky */}
              <ResultNav sections={RESULT_SECTIONS} />

              <div className="space-y-14">
                {/* 청문회 기록 표제 */}
                <div id="sec-record" className="scroll-mt-24">
                  <HearingRecordBar result={result} />
                </div>

                {/* 03. 6 증언석 */}
                <TestimonyBoard testimonies={result.testimonies} />

                {/* 04. 정책 스트레스 점수 — 발표 클라이맥스 */}
                <StressScorePanel score={result.stressScore} />

                {/* 05. 절충안 */}
                <CompromiseList compromises={result.compromises} />

                {/* 06. 시민 합의도 (베타) */}
                <CitizenConsensusNote />

                {/* 청문회 종료 — 새 청문회 */}
                <div className="flex flex-col items-center gap-4 border-t border-navy/15 pt-9 text-center">
                  <GavelIcon size={30} />
                  <p className="max-w-lg font-serif text-[15px] font-700 leading-relaxed text-navy">
                    본 청문회 기록은 정책 결정을 대신하지 않습니다.
                    <br />
                    스트레스 테스트는 진단이며, 결정의 책임은 정책결정자에게 있습니다.
                  </p>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="cursor-pointer bg-red px-6 py-3 font-serif text-[14px] font-700 text-paper transition-colors hover:bg-red-deep"
                    style={{ borderRadius: 2 }}
                  >
                    새 청문회 개정
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ===== 푸터 ===== */}
      <footer className="border-t border-navy/20 bg-paper-dark/60">
        <div className="mx-auto flex max-w-[1180px] flex-col gap-3 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div className="flex items-center gap-2.5">
            <GavelIcon size={18} />
            <span className="font-serif text-[13px] font-700 text-navy">
              {APP_NAME}
            </span>
            <span className="text-[11px] text-muted">
              교육정책 스트레스 테스트
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10.5px] text-muted">
            <span>공공데이터 8종 · Anthropic Citations API 출처 검증</span>
            <span className="hidden sm:inline">·</span>
            <span>제8회 교육 공공데이터 AI활용대회</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
