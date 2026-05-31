"use client";

// 6시점 — 공용 UI 조각: 인라인 SVG 아이콘 + 라벨 매핑
// 외부 이미지 금지. 모든 도형은 SVG·유니코드·CSS로만.

import type { ReactNode } from "react";
import type { Testimony, StressGrade, Compromise } from "@/lib/types";

/* ============================================================
   라벨 매핑 — 한국어 표기
   ============================================================ */

export const STANCE_LABEL: Record<Testimony["stance"], string> = {
  support: "찬성",
  oppose: "반대",
  conditional: "조건부",
};

export const STANCE_TONE: Record<
  Testimony["stance"],
  { bg: string; fg: string; ring: string }
> = {
  support: { bg: "#1f5d3f", fg: "#f3f8f2", ring: "#1f5d3f" },
  oppose: { bg: "#a93030", fg: "#fbf2f0", ring: "#a93030" },
  conditional: { bg: "#8a6d24", fg: "#fdf8ec", ring: "#8a6d24" },
};

export const GRADE_LABEL: Record<StressGrade, string> = {
  high: "고위험",
  medium: "중위험",
  low: "저위험",
};

export const GRADE_TONE: Record<StressGrade, { color: string; sub: string }> = {
  high: { color: "#a93030", sub: "정책 충돌 강함 — 합의 설계 필요" },
  medium: { color: "#8a6d24", sub: "이견 상존 — 절충 여지 있음" },
  low: { color: "#1f5d3f", sub: "정책 안정 — 추진 기반 양호" },
};

export const FEASIBILITY_LABEL: Record<Compromise["feasibility"], string> = {
  high: "실현성 높음",
  medium: "실현성 보통",
  low: "실현성 낮음",
};

export const FEASIBILITY_TONE: Record<Compromise["feasibility"], string> = {
  high: "#1f5d3f",
  medium: "#8a6d24",
  low: "#a93030",
};

/* ============================================================
   증언석 SVG — 마이크 + 명패 받침
   ============================================================ */

/** 청문회 탁상 마이크 (구즈넥) */
export function MicIcon({
  size = 22,
  color = "#1a2a4a",
}: {
  size?: number;
  color?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      {/* 받침 */}
      <ellipse cx="12" cy="22" rx="6.4" ry="1.5" fill={color} opacity="0.9" />
      {/* 구즈넥 */}
      <path
        d="M12 21.4c0-3.4 0-4.8 0-6.2"
        stroke={color}
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M12 15.2c0-2.1-2.4-1.6-2.4-3.6"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.85"
      />
      {/* 마이크 헤드 */}
      <rect
        x="6.7"
        y="2.4"
        width="6"
        height="9.4"
        rx="3"
        fill={color}
      />
      {/* 그릴 */}
      <line
        x1="7.7"
        y1="5.2"
        x2="11.7"
        y2="5.2"
        stroke="#f8f4e9"
        strokeWidth="0.8"
      />
      <line
        x1="7.7"
        y1="7.1"
        x2="11.7"
        y2="7.1"
        stroke="#f8f4e9"
        strokeWidth="0.8"
      />
      <line
        x1="7.7"
        y1="9"
        x2="11.7"
        y2="9"
        stroke="#f8f4e9"
        strokeWidth="0.8"
      />
    </svg>
  );
}

/** 인용·문서 아이콘 */
export function DocIcon({ size = 14, color = "#6b6655" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M3.5 1.5h6L13 5v9.5H3.5z"
        stroke={color}
        strokeWidth="1.25"
        strokeLinejoin="round"
      />
      <path d="M9.3 1.7V5h3.4" stroke={color} strokeWidth="1.25" />
      <line
        x1="5.6"
        y1="8.3"
        x2="10.8"
        y2="8.3"
        stroke={color}
        strokeWidth="1.1"
      />
      <line
        x1="5.6"
        y1="10.8"
        x2="10.8"
        y2="10.8"
        stroke={color}
        strokeWidth="1.1"
      />
    </svg>
  );
}

/** 인용 부호 (증언 인용구 마커) */
export function QuoteMark({ color = "#a93030" }) {
  return (
    <svg width="22" height="18" viewBox="0 0 22 18" aria-hidden="true">
      <path
        d="M0 18V9.6C0 4 3.1 0.6 8.4 0L9 3.2C5.9 3.9 4.4 5.7 4.4 8.4H8.4V18H0ZM12.6 18V9.6C12.6 4 15.7 0.6 21 0L21.6 3.2C18.5 3.9 17 5.7 17 8.4H21V18H12.6Z"
        fill={color}
      />
    </svg>
  );
}

/** 의사봉 — 헤더 로고 */
export function GavelIcon({ size = 26, color = "#1a2a4a" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
    >
      {/* 음향판 */}
      <rect
        x="3"
        y="24.5"
        width="15"
        height="3.6"
        rx="0.6"
        fill={color}
      />
      {/* 망치 머리 */}
      <rect
        x="16.4"
        y="4.2"
        width="9"
        height="7.4"
        rx="1"
        transform="rotate(45 16.4 4.2)"
        fill={color}
      />
      {/* 손잡이 */}
      <rect
        x="13.4"
        y="13.2"
        width="13.2"
        height="3"
        rx="1.4"
        transform="rotate(45 13.4 13.2)"
        fill={color}
      />
      {/* 머리 띠 */}
      <rect
        x="18.7"
        y="3.1"
        width="2.4"
        height="7.4"
        transform="rotate(45 18.7 3.1)"
        fill="#a93030"
      />
    </svg>
  );
}

/** 화살표 — 단계 진행 */
export function ArrowIcon({ size = 18, color = "#f8f4e9" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" aria-hidden="true">
      <path
        d="M3 10h12M11 5l5 5-5 5"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

/** 체크 — 법규 통과 */
export function CheckIcon({ size = 14, color = "#1f5d3f" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true">
      <path
        d="M3 8.5l3.2 3.2L13 4.5"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

/** X — 법규 미통과 */
export function CrossIcon({ size = 13, color = "#a93030" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true">
      <path
        d="M4 4l8 8M12 4l-8 8"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

/* ============================================================
   의제 아이콘 — 5대 교육정책 의제별 식별 기호.
   장식적 한자 대신, 의제 내용을 직관적으로 가리키는 도형.
   ============================================================ */

/** 통폐합·이전 — 두 건물이 하나로 합쳐지는 형상 */
export function AgendaConsolidationIcon({ size = 22, color = "#1a2a4a" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 21V9.5L8 6.5V21" stroke={color} strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M21 21V9.5L16 6.5V21" stroke={color} strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M9.5 21V13l2.5-2 2.5 2v8" stroke={color} strokeWidth="1.7" strokeLinejoin="round" fill="none" />
      <path d="M9.2 9.5 12 7.4l2.8 2.1" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="2" y1="21.3" x2="22" y2="21.3" stroke={color} strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

/** 늘봄학교 — 해(돌봄 시간)와 보호의 곡선 */
export function AgendaNeulbomIcon({ size = 22, color = "#1a2a4a" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="11" r="4" stroke={color} strokeWidth="1.7" />
      <path d="M12 3v2M12 17v2M3 11h2M19 11h2M5.6 4.6l1.4 1.4M17 16l1.4 1.4M18.4 4.6 17 6M7 16l-1.4 1.4" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
      <path d="M4 21c2.5-2.4 5.2-3.6 8-3.6S17.5 18.6 20 21" stroke={color} strokeWidth="1.7" strokeLinecap="round" fill="none" />
    </svg>
  );
}

/** 기초학력·AI 교과서 — 펼친 책 위 디지털 회로점 */
export function AgendaLiteracyIcon({ size = 22, color = "#1a2a4a" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 7.5C9.8 6 7 5.6 3.5 6.4V18c3.5-.8 6.3-.4 8.5 1.1 2.2-1.5 5-1.9 8.5-1.1V6.4C17 5.6 14.2 6 12 7.5Z" stroke={color} strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M12 7.5v11.6" stroke={color} strokeWidth="1.5" />
      <circle cx="7.2" cy="11" r="1" fill={color} />
      <circle cx="9.4" cy="13.6" r="1" fill={color} />
      <circle cx="16.8" cy="11" r="1" fill={color} />
      <circle cx="14.6" cy="13.6" r="1" fill={color} />
    </svg>
  );
}

/** 교원 행정 자동화 — 문서와 톱니(자동화) */
export function AgendaAdminIcon({ size = 22, color = "#1a2a4a" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 3h8l4 4v6.5" stroke={color} strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M5 3v18h6" stroke={color} strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M12.6 3.4V7.4h4" stroke={color} strokeWidth="1.5" />
      <line x1="7.6" y1="10" x2="12" y2="10" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
      <line x1="7.6" y1="13" x2="10.5" y2="13" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="17" cy="17.5" r="3.2" stroke={color} strokeWidth="1.7" />
      <path d="M17 13.6v1M17 21.4v-1M13.1 17.5h1M20.9 17.5h-1" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

/** 다문화·특수교육 포용 — 서로 다른 사람을 감싸는 원 */
export function AgendaInclusionIcon({ size = 22, color = "#1a2a4a" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="8.5" cy="8.5" r="2.4" stroke={color} strokeWidth="1.7" />
      <circle cx="15.5" cy="8.5" r="2.4" stroke={color} strokeWidth="1.7" />
      <path d="M4.5 17.5c0-2.4 1.8-3.8 4-3.8s4 1.4 4 3.8" stroke={color} strokeWidth="1.7" strokeLinecap="round" fill="none" />
      <path d="M11.5 17.5c0-2.4 1.8-3.8 4-3.8s4 1.4 4 3.8" stroke={color} strokeWidth="1.7" strokeLinecap="round" fill="none" />
      <path d="M3 20.5c2.6 1.2 5.6 1.8 9 1.8s6.4-.6 9-1.8" stroke={color} strokeWidth="1.7" strokeLinecap="round" fill="none" opacity="0.55" />
    </svg>
  );
}

/* ============================================================
   섹션 헤더 — 회의록 조항 번호 스타일.
   장식 요소(번호·영문 키커)는 aria-hidden, 의미는 heading 텍스트가 담당.
   섹션 번호는 heading 안에 sr-only로 포함해 스크린리더가
   "절차 04 — 정책 스트레스 점수"로 읽도록 의미 연결한다.
   ============================================================ */

export function SectionMark({
  no,
  kicker,
  title,
}: {
  no: string;
  kicker: string;
  title: string;
}) {
  return (
    <div className="flex items-baseline gap-3.5">
      {/* 조항 번호 — 장식. 실제 의미는 heading 텍스트가 담당 */}
      <span
        aria-hidden="true"
        className="shrink-0 font-serif text-xl font-700 text-red leading-none"
        style={{ fontFeatureSettings: '"tnum"' }}
      >
        {no}
      </span>
      <div>
        {/* 영문 키커 — 장식. lang 표기로 스크린리더 한국어 오독 방지 */}
        <div
          lang="en"
          aria-hidden="true"
          className="text-[10px] font-700 uppercase tracking-[0.28em] text-muted"
        >
          {kicker}
        </div>
        <h2 className="mt-1 text-[clamp(1.15rem,2.4vw,1.6rem)] font-700 text-navy">
          <span className="sr-only">{`절차 ${no} — `}</span>
          {title}
        </h2>
      </div>
    </div>
  );
}

/* ============================================================
   라벨 칩 — 입장 배지
   ============================================================ */

export function StanceBadge({
  stance,
  large = false,
}: {
  stance: Testimony["stance"];
  large?: boolean;
}) {
  const tone = STANCE_TONE[stance];
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-700 uppercase ${
        large
          ? "px-3 py-1 text-[12px] tracking-[0.14em]"
          : "px-2.5 py-[3px] text-[10.5px] tracking-[0.1em]"
      }`}
      style={{
        background: tone.bg,
        color: tone.fg,
        borderRadius: 2,
      }}
    >
      <span
        className="inline-block rounded-full"
        style={{
          width: 5,
          height: 5,
          background: tone.fg,
        }}
      />
      {STANCE_LABEL[stance]}
    </span>
  );
}

/* ============================================================
   범용: 모서리 마크 (청문회 문서 장식)
   ============================================================ */

export function CornerTicks({ children }: { children: ReactNode }) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute -left-px -top-px h-2.5 w-2.5 border-l-2 border-t-2 border-navy" />
      <span className="pointer-events-none absolute -right-px -top-px h-2.5 w-2.5 border-r-2 border-t-2 border-navy" />
      <span className="pointer-events-none absolute -bottom-px -left-px h-2.5 w-2.5 border-b-2 border-l-2 border-navy" />
      <span className="pointer-events-none absolute -bottom-px -right-px h-2.5 w-2.5 border-b-2 border-r-2 border-navy" />
      {children}
    </div>
  );
}

/* ============================================================
   인라인 마크다운 정제 — LLM(증언·절충안) 출력에 섞여 나오는
   **볼드** 표기를 실제 <strong>으로 변환하고, 짝이 맞지 않는
   별표는 제거한다. 화면에 '**'가 날것으로 노출되는 것을 막는다.
   ============================================================ */

export function renderRichText(text: string): ReactNode {
  if (!text) return text;
  const parts = text.split(/(\*\*[^*\n]+?\*\*)/g);
  return parts.map((part, i) => {
    const m = /^\*\*([^*\n]+?)\*\*$/.exec(part);
    if (m) {
      return (
        <strong key={i} className="font-700 text-navy">
          {m[1]}
        </strong>
      );
    }
    // 짝이 맞지 않아 남은 별표는 제거
    return part.includes("*") ? part.replace(/\*+/g, "") : part;
  });
}
