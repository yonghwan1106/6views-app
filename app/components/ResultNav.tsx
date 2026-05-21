"use client";

// 6시점 — 결과 영역 앵커 내비게이션. 발표자가 화면을 통제하는 도구.
// 청문회 기록의 "목차"로서, 한 화면씩 지목 이동할 수 있게 한다.
import { useEffect, useState } from "react";

export interface ResultSection {
  id: string;
  no: string;
  label: string;
}

export default function ResultNav({
  sections,
}: {
  sections: ResultSection[];
}) {
  const [active, setActive] = useState(sections[0]?.id ?? "");

  // 스크롤 위치에 따라 활성 섹션 추적 — 발표자가 어디를 보여주는지 표시
  useEffect(() => {
    const targets = sections
      .map((s) => document.getElementById(s.id))
      .filter((el): el is HTMLElement => el !== null);
    if (targets.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // 화면 상단에 가장 가까운, 보이는 섹션을 활성으로
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) {
          setActive(visible[0].target.id);
        }
      },
      {
        // 상단 헤더 + 내비 높이만큼 여백 — 정확한 활성 판정
        rootMargin: "-140px 0px -55% 0px",
        threshold: 0,
      },
    );
    targets.forEach((t) => observer.observe(t));
    return () => observer.disconnect();
  }, [sections]);

  // 섹션으로 이동 — 발표자의 "이 화면 보십시오" 동작
  const goTo = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    setActive(id);
  };

  return (
    <nav
      aria-label="청문회 기록 목차"
      className="sticky top-0 z-30 -mx-5 mb-8 border-b border-navy/20 bg-paper/95 px-5 backdrop-blur-sm sm:-mx-8 sm:px-8"
    >
      <div className="flex items-center gap-1 overflow-x-auto py-2.5">
        <span className="mr-1 hidden shrink-0 items-center gap-1.5 pr-2 text-[10px] font-700 uppercase tracking-[0.16em] text-red sm:flex">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-red" />
          기록 목차
        </span>
        {sections.map((s) => {
          const on = active === s.id;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => goTo(s.id)}
              aria-current={on ? "true" : undefined}
              className="group flex shrink-0 cursor-pointer items-center gap-1.5 px-2.5 py-1.5 text-left transition-colors"
              style={{
                background: on ? "#1a2a4a" : "transparent",
                borderRadius: 2,
              }}
            >
              {s.no && (
                <span
                  className="font-serif text-[12px] font-900 tabular-nums leading-none"
                  style={{ color: "#a93030" }}
                >
                  {s.no}
                </span>
              )}
              <span
                className="font-serif text-[12.5px] font-700 leading-none transition-colors"
                style={{ color: on ? "#f8f4e9" : "#3a4763" }}
              >
                {s.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
