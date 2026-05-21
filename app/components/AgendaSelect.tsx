"use client";

// 6시점 — 1단계: 5대 의제 중 택1. 청문회 안건 카드.
import type { AgendaId } from "@/lib/types";
import type { ComponentType } from "react";
import { AGENDA_LIST, WITNESS_META } from "@/lib/constants";
import {
  SectionMark,
  AgendaConsolidationIcon,
  AgendaNeulbomIcon,
  AgendaLiteracyIcon,
  AgendaAdminIcon,
  AgendaInclusionIcon,
} from "./ui";

// 의제별 식별 아이콘 — 의제 내용을 직관적으로 가리키는 도형.
// 장식적 한자를 의미가 명확한 SVG 기호로 교체.
const AGENDA_ICON: Record<
  AgendaId,
  ComponentType<{ size?: number; color?: string }>
> = {
  consolidation: AgendaConsolidationIcon,
  neulbom: AgendaNeulbomIcon,
  "basic-literacy": AgendaLiteracyIcon,
  "teacher-admin": AgendaAdminIcon,
  inclusion: AgendaInclusionIcon,
};

const AGENDA_INDEX: Record<AgendaId, string> = {
  consolidation: "의제 1",
  neulbom: "의제 2",
  "basic-literacy": "의제 3",
  "teacher-admin": "의제 4",
  inclusion: "의제 5",
};

export default function AgendaSelect({
  selected,
  onSelect,
}: {
  selected: AgendaId | null;
  onSelect: (id: AgendaId) => void;
}) {
  return (
    <section aria-labelledby="agenda-heading">
      <div id="agenda-heading">
        <SectionMark
          no="01"
          kicker="Agenda Selection"
          title="청문회 안건을 선택하십시오"
        />
      </div>
      <p className="mt-2.5 pl-[2.1rem] text-[13px] leading-relaxed text-muted">
        다섯 개 교육정책 의제 중 하나를 채택하면, 핵심 증언자 4인에 의제별 증언자 2인이 더해져
        총 6인의 증언석이 구성됩니다.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
        {AGENDA_LIST.map((agenda, i) => {
          const active = selected === agenda.id;
          const dyn = agenda.dynamicWitnesses.map((w) => WITNESS_META[w].name);
          const AgendaIcon = AGENDA_ICON[agenda.id];
          return (
            <button
              key={agenda.id}
              type="button"
              onClick={() => onSelect(agenda.id)}
              aria-pressed={active}
              className="group relative cursor-pointer text-left anim-rise"
              style={{ animationDelay: `${i * 70}ms` }}
            >
              <div
                className="relative flex h-full flex-col p-4 transition-all duration-200"
                style={{
                  background: active ? "#1a2a4a" : "#fffdf6",
                  border: active
                    ? "1px solid #1a2a4a"
                    : "1px solid rgba(26,42,74,0.28)",
                  boxShadow: active
                    ? "0 16px 32px -18px rgba(26,42,74,0.7)"
                    : "0 1px 0 rgba(26,42,74,0.04)",
                  transform: active ? "translateY(-2px)" : "translateY(0)",
                }}
              >
                {/* 상단: 의제 식별 아이콘 + 의제 번호 */}
                <div className="flex items-start justify-between">
                  <div
                    className="flex h-10 w-10 items-center justify-center transition-colors"
                    style={{
                      background: active ? "#a93030" : "#f0e8d2",
                      borderRadius: 2,
                    }}
                  >
                    <AgendaIcon
                      size={22}
                      color={active ? "#f8f4e9" : "#1a2a4a"}
                    />
                  </div>
                  <span
                    className="text-[9.5px] font-700 uppercase tracking-[0.16em] transition-colors"
                    style={{ color: active ? "#b9c2d6" : "#6b6655" }}
                  >
                    {AGENDA_INDEX[agenda.id]}
                  </span>
                </div>

                {/* 제목 */}
                <h3
                  className="mt-3.5 font-serif text-[1.05rem] font-700 leading-snug transition-colors"
                  style={{ color: active ? "#f8f4e9" : "#1a2a4a" }}
                >
                  {agenda.title}
                </h3>

                {/* 설명 */}
                <p
                  className="mt-1.5 flex-1 text-[12px] leading-relaxed transition-colors"
                  style={{ color: active ? "#aeb8ce" : "#6b6655" }}
                >
                  {agenda.description}
                </p>

                {/* 동적 증언자 표시 */}
                <div
                  className="mt-3.5 flex items-center gap-1.5 border-t pt-2.5 transition-colors"
                  style={{
                    borderColor: active
                      ? "rgba(248,244,233,0.18)"
                      : "rgba(26,42,74,0.14)",
                  }}
                >
                  <span
                    className="text-[9.5px] font-700 uppercase tracking-wider transition-colors"
                    style={{ color: active ? "#8b96b0" : "#9a937e" }}
                  >
                    추가 증언자
                  </span>
                  <span
                    className="text-[11px] font-500 transition-colors"
                    style={{ color: active ? "#dfe3ec" : "#3a4763" }}
                  >
                    {dyn.join(" · ")}
                  </span>
                </div>

                {/* 선택 표식 */}
                {active && (
                  <span className="absolute -right-px -top-px flex h-5 w-5 items-center justify-center bg-red text-[11px] font-700 text-paper">
                    ✓
                  </span>
                )}
              </div>
            </button>
          );
        })}

        {/* 6번째 칸 — 보조 안내 (그리드 균형) */}
        <div className="hidden items-center lg:flex">
          <div className="dotted-rule h-px w-full" />
        </div>
      </div>
    </section>
  );
}
