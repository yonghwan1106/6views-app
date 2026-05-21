"use client";

// 6시점 — 청문회 진행 표제. 검증 중인 주장 + 활용 공공데이터 출처.
import type { DeliberateResponse } from "@/lib/types";
import { AGENDAS } from "@/lib/constants";
import { DocIcon } from "./ui";

export default function HearingRecordBar({
  result,
}: {
  result: DeliberateResponse;
}) {
  const agenda = AGENDAS[result.agendaId];
  const stamped = new Date(result.timestamp);
  const stampText = `${stamped.getFullYear()}.${String(
    stamped.getMonth() + 1,
  ).padStart(2, "0")}.${String(stamped.getDate()).padStart(2, "0")} ${String(
    stamped.getHours(),
  ).padStart(2, "0")}:${String(stamped.getMinutes()).padStart(2, "0")}`;

  return (
    <div className="anim-rise hearing-panel relative overflow-hidden">
      {/* 좌측 빨간 띠 */}
      <span className="absolute left-0 top-0 h-full w-1 bg-red" />

      <div className="flex flex-col gap-4 p-5 sm:p-6">
        {/* 표제 행 */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <span className="text-[10px] font-700 uppercase tracking-[0.2em] text-red">
              청문회 기록
            </span>
            <span
              className="px-2 py-0.5 text-[10.5px] font-700 text-paper"
              style={{ background: "#1a2a4a", borderRadius: 2 }}
            >
              {agenda.title}
            </span>
          </div>
          <span className="text-[10.5px] font-500 tabular-nums text-muted">
            채록 일시 {stampText}
          </span>
        </div>

        {/* 검증 주장 */}
        <div className="border-l-2 border-navy/30 pl-3.5">
          <div className="mb-1 text-[10px] font-700 uppercase tracking-[0.16em] text-muted">
            검증 대상 정책 주장
          </div>
          <p className="font-serif text-[clamp(1.05rem,2.3vw,1.35rem)] font-700 leading-snug text-navy">
            “{result.claim}”
          </p>
        </div>

        {/* 활용 데이터 */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 border-t border-dashed border-navy/18 pt-3.5">
          <span className="flex items-center gap-1.5 text-[10px] font-700 uppercase tracking-[0.14em] text-muted">
            <DocIcon size={12} color="#a93030" />
            증언 근거 공공데이터 {result.documentsUsed.length}종
          </span>
          {result.documentsUsed.map((doc) => (
            <span
              key={doc.id}
              className="inline-flex items-center gap-1 border border-navy/22 bg-paper px-2 py-[3px] text-[10.5px] font-500 text-navy/80"
              style={{ borderRadius: 2 }}
            >
              {doc.title}
              <span className="text-[9px] text-muted">· {doc.source}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
