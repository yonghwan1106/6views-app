"use client";

// 6시점 — 데모 모드 고지 배너. 결과 영역 최상단.
// 심사위원이 "실시간 AI 응답"으로 오해하지 않도록 정직하게 명시한다.
// 푸터가 아닌, 결과를 보기 직전에 눈에 들어오는 위치.

export default function DemoModeBanner() {
  return (
    <div
      role="note"
      aria-label="데모 모드 안내"
      className="anim-fade flex flex-col gap-2 border-l-[3px] px-4 py-3 sm:flex-row sm:items-center sm:gap-3.5"
      style={{
        background: "#f1ead6",
        borderColor: "#8a6d24",
        borderTop: "1px solid rgba(26,42,74,0.16)",
        borderRight: "1px solid rgba(26,42,74,0.16)",
        borderBottom: "1px solid rgba(26,42,74,0.16)",
        borderRadius: 2,
      }}
    >
      <span
        className="inline-flex shrink-0 items-center gap-1.5 self-start px-2.5 py-1 text-[10.5px] font-700 uppercase tracking-[0.12em] text-paper sm:self-auto"
        style={{ background: "#8a6d24", borderRadius: 2 }}
      >
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-paper" />
        데모 모드
      </span>
      <p className="text-[12px] leading-relaxed text-ink/85">
        <strong className="font-700 text-navy">
          사전 준비된 예시 증언으로 시연 중입니다.
        </strong>{" "}
        API 키 미설정 환경이며, 실제 운영 시에는 6인의 증언자가
        Anthropic Citations API로 공공데이터를 실시간 인용합니다.
        지표·절충안 산출 로직은 실제와 동일하게 작동합니다.
      </p>
    </div>
  );
}
