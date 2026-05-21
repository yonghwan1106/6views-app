"use client";

// 6시점 — ★ 정책 스트레스 점수. 단일 차별 키워드. 발표의 시각적 정점.
// 3축 게이지 + 총점 다이얼. 공학적 계측기의 신뢰감.
import { useEffect, useState } from "react";
import type { StressScore, StressGrade } from "@/lib/types";
import { STRESS_WEIGHTS } from "@/lib/constants";
import { SectionMark, GRADE_LABEL, GRADE_TONE } from "./ui";

// prefers-reduced-motion 감지 — 렌더에 영향을 주므로 state로 보관.
// 초기값은 lazy initializer로 즉시 읽어 effect 내 동기 setState를 피한다.
function readReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(readReducedMotion);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    // 설정 변경 구독만 — 초기값은 lazy initializer가 이미 반영
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

// 3축 정의 — 표시명·최대값·설명·방향(높을수록 좋은 축인가)
const AXES = [
  {
    key: "consensus" as const,
    label: "이해관계자 합의도",
    sub: "증언자 간 입장 수렴 정도",
    max: STRESS_WEIGHTS.consensus,
    // 합의도는 높을수록 좋음 → 채워질수록 녹색
    polarity: "good" as const,
  },
  {
    key: "legalConflict" as const,
    label: "법규·행정 충돌도",
    sub: "현행 법령·행정 제약과의 마찰",
    max: STRESS_WEIGHTS.legalConflict,
    // 충돌도는 높을수록 나쁨 → 채워질수록 적색
    polarity: "bad" as const,
  },
  {
    key: "stability" as const,
    label: "정책 안정성",
    sub: "추진 지속 가능성·집행 기반",
    max: STRESS_WEIGHTS.stability,
    // 안정성은 높을수록 좋음 → 채워질수록 녹색
    polarity: "good" as const,
  },
];

// 비율(0~1) → 신호등 색. polarity에 따라 방향 반전.
function signalColor(pct: number, polarity: "good" | "bad"): string {
  // 양극("good")은 비율이 높을수록 안전, 음극("bad")은 비율이 높을수록 위험.
  const danger = polarity === "good" ? 1 - pct : pct;
  if (danger >= 0.62) return "#a93030"; // 적
  if (danger >= 0.34) return "#b07d1a"; // 황 (대비 확보 위해 진한 황)
  return "#1f5d3f"; // 녹
}

/* ============================================================
   반원 다이얼 — 0~100 총점. 계측기 톤.
   첫 렌더부터 실제 점수를 표시하고, 마운트 즉시 바늘이 스윙한다.
   "0점 기계"로 오인될 빈틈을 만들지 않는다.
   ============================================================ */
function ScoreDial({
  score,
  color,
  grade,
}: {
  score: number;
  color: string;
  grade: StressGrade;
}) {
  // mounted: 마운트 직후 true → 바늘/호/숫자가 실제 점수로 즉시 이행.
  // 초기 렌더는 시작 위치이되, requestAnimationFrame으로 같은 프레임 흐름에
  // 바로 transition을 트리거하므로 0이 "정지 화면"으로 노출되지 않는다.
  const [mounted, setMounted] = useState(false);
  const reduceMotion = usePrefersReducedMotion();

  useEffect(() => {
    // 두 번의 rAF로 첫 페인트 직후 확실히 트리거 → 0 노출 없이 즉시 스윙 시작
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setMounted(true));
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, []);

  // 반원: 180도 호. -90도(좌) → +90도(우)
  const R = 84;
  const CX = 120;
  const CY = 116;
  const clamped = Math.min(Math.max(score, 0), 100);
  const ratio = clamped / 100;

  // 애니메이션 동안에도 0을 거치지 않도록 시작 비율을 점수의 일부로 둔다.
  // reduce-motion이면 처음부터 최종값.
  const shownRatio = reduceMotion ? ratio : mounted ? ratio : ratio * 0.12;

  const ticks = [0, 20, 40, 60, 80, 100];

  // 호 path 생성 (반원)
  const arcPath = (from: number, to: number) => {
    const a1 = Math.PI - from * Math.PI;
    const a2 = Math.PI - to * Math.PI;
    const x1 = CX + R * Math.cos(a1);
    const y1 = CY - R * Math.sin(a1);
    const x2 = CX + R * Math.cos(a2);
    const y2 = CY - R * Math.sin(a2);
    const large = to - from > 0.5 ? 1 : 0;
    return `M ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2}`;
  };

  // 바늘 각도: 0점=-90deg, 100점=+90deg.
  // 시작 각도도 점수 근처(살짝 못 미친 지점)로 두어 0deg 정지 화면을 없앤다.
  const needleTarget = -90 + ratio * 180;
  const needleStart = -90 + ratio * 0.12 * 180;
  const needleAngle = reduceMotion
    ? needleTarget
    : mounted
      ? needleTarget
      : needleStart;

  // 카운트업 숫자 — 0이 아니라 시작값부터 올라감.
  // reduceMotion이면 애니메이션 없이 최종값을 직접 표시(파생값).
  const [animatedNum, setAnimatedNum] = useState(() =>
    Math.round(clamped * 0.12),
  );
  useEffect(() => {
    if (reduceMotion) return; // 정적 표시 — 파생값 displayNum이 처리
    const start = clamped * 0.12;
    const end = clamped;
    const dur = 1100;
    let raf = 0;
    let t0 = 0;
    const ease = (x: number) => 1 - Math.pow(1 - x, 3);
    const step = (ts: number) => {
      if (!t0) t0 = ts;
      const p = Math.min((ts - t0) / dur, 1);
      setAnimatedNum(Math.round(start + (end - start) * ease(p)));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [clamped, reduceMotion]);
  const displayNum = reduceMotion ? Math.round(clamped) : animatedNum;

  return (
    <div className="relative w-[228px]">
      <svg viewBox="0 0 240 144" className="w-full" aria-hidden="true">
        {/* 배경 호 */}
        <path
          d={arcPath(0, 1)}
          fill="none"
          stroke="#e3d8ba"
          strokeWidth="13"
          strokeLinecap="butt"
        />
        {/* 구간 색 — 저(0-40)/중(40-70)/고(70-100) */}
        <path
          d={arcPath(0, 0.4)}
          fill="none"
          stroke="#1f5d3f"
          strokeWidth="13"
          opacity={grade === "low" ? 0.5 : 0.22}
        />
        <path
          d={arcPath(0.4, 0.7)}
          fill="none"
          stroke="#b07d1a"
          strokeWidth="13"
          opacity={grade === "medium" ? 0.5 : 0.22}
        />
        <path
          d={arcPath(0.7, 1)}
          fill="none"
          stroke="#a93030"
          strokeWidth="13"
          opacity={grade === "high" ? 0.5 : 0.22}
        />
        {/* 진행 호 — 현재 점수 */}
        <path
          d={arcPath(0, shownRatio)}
          fill="none"
          stroke={color}
          strokeWidth="13"
          strokeLinecap="round"
          style={{
            transition: "all 1.15s cubic-bezier(0.34,1.18,0.64,1)",
          }}
        />
        {/* 눈금 */}
        {ticks.map((t) => {
          const a = Math.PI - (t / 100) * Math.PI;
          const xi = CX + (R - 10) * Math.cos(a);
          const yi = CY - (R - 10) * Math.sin(a);
          const xo = CX + (R + 9) * Math.cos(a);
          const yo = CY - (R + 9) * Math.sin(a);
          const xl = CX + (R + 19) * Math.cos(a);
          const yl = CY - (R + 19) * Math.sin(a);
          return (
            <g key={t}>
              <line
                x1={xi}
                y1={yi}
                x2={xo}
                y2={yo}
                stroke="#1a2a4a"
                strokeWidth="1.4"
                opacity="0.5"
              />
              <text
                x={xl}
                y={yl + 3}
                fontSize="8.5"
                fill="#6b6655"
                textAnchor="middle"
                fontWeight="700"
                fontFamily="var(--font-sans)"
              >
                {t}
              </text>
            </g>
          );
        })}
        {/* 바늘 — transition으로 시작각→목표각 부드럽게 이행 */}
        <g
          style={{
            transformOrigin: `${CX}px ${CY}px`,
            transform: `rotate(${needleAngle}deg)`,
            transition:
              "transform 1.25s cubic-bezier(0.34,1.32,0.64,1)",
          }}
        >
          <line
            x1={CX}
            y1={CY}
            x2={CX}
            y2={CY - R + 4}
            stroke="#1a2a4a"
            strokeWidth="2.6"
            strokeLinecap="round"
          />
          <line
            x1={CX}
            y1={CY}
            x2={CX}
            y2={CY + 12}
            stroke="#1a2a4a"
            strokeWidth="2.6"
            strokeLinecap="round"
            opacity="0.4"
          />
        </g>
        {/* 중심축 */}
        <circle cx={CX} cy={CY} r="6.5" fill="#1a2a4a" />
        <circle cx={CX} cy={CY} r="2.6" fill={color} />
      </svg>

      {/* 점수 숫자 — 다이얼 중앙 하단 */}
      <div className="absolute inset-x-0 bottom-0 flex flex-col items-center">
        <div className="flex items-baseline gap-0.5">
          <span
            className="font-serif text-[3rem] font-900 leading-none tabular-nums"
            style={{ color }}
          >
            {displayNum}
          </span>
          <span className="font-serif text-base font-700 text-muted">
            / 100
          </span>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   3축 막대 게이지 — 축 의미에 맞는 신호등 색.
   ============================================================ */
function AxisGauge({
  label,
  sub,
  value,
  max,
  polarity,
  delay,
}: {
  label: string;
  sub: string;
  value: number;
  max: number;
  polarity: "good" | "bad";
  delay: number;
}) {
  const [mounted, setMounted] = useState(false);
  const reduceMotion = usePrefersReducedMotion();

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), reduceMotion ? 0 : delay);
    return () => clearTimeout(t);
  }, [delay, reduceMotion]);

  const clamped = Math.min(Math.max(value, 0), max);
  const pct = clamped / max;
  const barColor = signalColor(pct, polarity);

  // 채움 동안에도 0을 거치지 않도록 — 시작 비율을 값의 일부로
  const shownPct = reduceMotion ? pct : mounted ? pct : pct * 0.12;

  // 숫자 카운트업 — reduceMotion이면 최종값 직접 표시(파생값)
  const [animatedNum, setAnimatedNum] = useState(() =>
    Math.round(clamped * 0.12),
  );
  useEffect(() => {
    if (reduceMotion) return; // 정적 표시 — 파생값 displayNum이 처리
    let raf = 0;
    let t0 = 0;
    const start = clamped * 0.12;
    const ease = (x: number) => 1 - Math.pow(1 - x, 3);
    const begin = () => {
      const step = (ts: number) => {
        if (!t0) t0 = ts;
        const p = Math.min((ts - t0) / 950, 1);
        setAnimatedNum(Math.round(start + (clamped - start) * ease(p)));
        if (p < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    };
    const timer = setTimeout(begin, delay);
    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(raf);
    };
  }, [clamped, delay, reduceMotion]);
  const displayNum = reduceMotion ? Math.round(clamped) : animatedNum;

  // 방향 표지 — 축 의미를 명시 (높을수록 좋음/나쁨)
  const directionTag =
    polarity === "good" ? "높을수록 양호" : "높을수록 위험";

  return (
    <div>
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="font-serif text-[14.5px] font-700 text-navy">
              {label}
            </span>
            <span
              className="text-[9px] font-700 uppercase tracking-[0.08em]"
              style={{ color: barColor }}
            >
              {directionTag}
            </span>
          </div>
          <div className="text-[11px] leading-tight text-muted">{sub}</div>
        </div>
        <div className="flex shrink-0 items-baseline gap-0.5">
          <span
            className="font-serif text-[1.45rem] font-900 tabular-nums"
            style={{ color: barColor }}
          >
            {displayNum}
          </span>
          <span className="text-[11px] font-700 text-muted">/ {max}</span>
        </div>
      </div>

      {/* 게이지 트랙 — 눈금 포함 */}
      <div className="relative mt-2">
        <div
          className="relative h-3.5 w-full overflow-hidden"
          style={{ background: "#e3d8ba", borderRadius: 1 }}
        >
          <div
            className="absolute left-0 top-0 h-full"
            style={{
              width: `${shownPct * 100}%`,
              background: barColor,
              transition: "width 1.05s cubic-bezier(0.22,0.61,0.36,1)",
            }}
          />
          {/* 눈금선 — 4등분 */}
          <div className="absolute inset-0 flex justify-between">
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                className="h-full w-px"
                style={{
                  background: "rgba(248,244,233,0.45)",
                  marginLeft: i === 0 ? "25%" : 0,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   메인 패널 — 발표의 클라이맥스. "이 화면을 보십시오" 지목점.
   ============================================================ */
export default function StressScorePanel({ score }: { score: StressScore }) {
  const tone = GRADE_TONE[score.grade];

  return (
    <section aria-labelledby="stress-heading" className="scroll-mt-24">
      {/* 클라이맥스 표지 — 이 섹션이 핵심임을 시각적으로 선언 */}
      <div
        id="stress-heading"
        className="flex flex-wrap items-end justify-between gap-3 scroll-mt-24"
      >
        <SectionMark
          no="04"
          kicker="Policy Stress Score"
          title="정책 스트레스 점수"
        />
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-700 uppercase tracking-[0.14em]"
          style={{
            background: "#a93030",
            color: "#f8f4e9",
            borderRadius: 2,
          }}
        >
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-paper" />
          청문회 종합 판정
        </span>
      </div>
      <p className="mt-2.5 pl-[2.1rem] text-[13px] leading-relaxed text-muted">
        6인의 증언을 3개 축으로 계량하여 산정한 정책 갈등 압력 지수입니다.
        점수가 높을수록 정책 추진 시 충돌 비용이 큽니다.
      </p>

      {/* 정점 패널 — 빨간 직인 테두리로 강조 */}
      <div
        className="hearing-panel mt-5 overflow-hidden"
        style={{ borderColor: `${tone.color}`, borderWidth: 2 }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr]">
          {/* ===== 좌: 총점 다이얼 ===== */}
          <div
            className="flex flex-col items-center justify-center gap-3 px-6 py-7"
            style={{
              background: "#1a2a4a",
            }}
          >
            <span className="text-[10px] font-700 uppercase tracking-[0.22em] text-paper/55">
              종합 스트레스 지수
            </span>

            {/* 다이얼 — 미색 배경 위에 */}
            <div
              className="flex items-end justify-center px-3 pt-3"
              style={{ background: "#f8f4e9", borderRadius: 3 }}
            >
              <ScoreDial
                score={score.total}
                color={tone.color}
                grade={score.grade}
              />
            </div>

            {/* 등급 도장 */}
            <div className="mt-1 flex flex-col items-center gap-1.5">
              <div
                className="anim-stamp flex items-center gap-2 px-4 py-1.5"
                style={{
                  border: `2.5px solid ${tone.color}`,
                  borderRadius: 3,
                }}
              >
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ background: tone.color }}
                />
                <span
                  className="font-serif text-[1.05rem] font-900 tracking-wide"
                  style={{ color: tone.color }}
                >
                  {GRADE_LABEL[score.grade]}
                </span>
              </div>
              <span className="text-center text-[10.5px] leading-snug text-paper/65">
                {tone.sub}
              </span>
            </div>

            {/* 3등급 기준 */}
            <div className="mt-2 flex w-full items-center justify-between border-t border-paper/15 pt-2.5 text-[9px] font-700 uppercase tracking-wider">
              <span style={{ color: score.grade === "low" ? "#7fc79f" : "rgba(248,244,233,0.4)" }}>
                저 0–39
              </span>
              <span style={{ color: score.grade === "medium" ? "#e3b766" : "rgba(248,244,233,0.4)" }}>
                중 40–69
              </span>
              <span style={{ color: score.grade === "high" ? "#e08a8a" : "rgba(248,244,233,0.4)" }}>
                고 70–100
              </span>
            </div>
          </div>

          {/* ===== 우: 3축 게이지 + 산출 근거 ===== */}
          <div className="flex flex-col gap-5 p-5 sm:p-6">
            <div className="space-y-4">
              {AXES.map((axis, i) => (
                <AxisGauge
                  key={axis.key}
                  label={axis.label}
                  sub={axis.sub}
                  value={score[axis.key]}
                  max={axis.max}
                  polarity={axis.polarity}
                  delay={420 + i * 170}
                />
              ))}
            </div>

            {/* 산출 근거 */}
            <div className="border-t border-navy/15 pt-3.5">
              <div className="mb-1.5 flex items-center gap-1.5">
                <span className="h-2.5 w-[3px] bg-red" />
                <span className="text-[9.5px] font-700 uppercase tracking-[0.16em] text-muted">
                  산출 근거
                </span>
              </div>
              <p className="text-[12.5px] leading-relaxed text-ink/85">
                {score.rationale}
              </p>
              <p className="mt-2 text-[10.5px] leading-relaxed text-muted">
                가중치 근거: KEDI 「학교 통폐합 의사결정 모델」(2025) 변수 기여도 분석 +
                교육행정 전문가 델파이 합의 — 합의도 40 / 법규충돌 30 / 안정성 30.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
