"use client";

// 6시점 — 청문회 진행 표제. 검증 중인 주장 + 활용 공공데이터 출처.
import type { DeliberateResponse } from "@/lib/types";
import { AGENDAS } from "@/lib/constants";
import { DocIcon } from "./ui";

/**
 * 출처 url에서 data.go.kr 데이터셋 등록번호(datasetId)를 추출한다.
 * 예) https://www.data.go.kr/data/15021148/standard.do → "15021148"
 * data.go.kr 형식이 아니면(포털 홈/Open API 안내 등) null — 배지를 생략한다.
 * 표시값은 데이터 파일(meta.url)에서 파생되므로 데이터가 갱신되면 자동 반영된다.
 */
function extractDatasetId(url: string): string | null {
  const m = url.match(/data\.go\.kr\/data\/(\d+)\//);
  return m ? m[1] : null;
}

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

        {/* 활용 데이터 — 데이터셋명·출처기관·datasetId·원문 링크를 투명 노출.
            "이 증언이 어떤 공공데이터에 근거하는지"를 심사위원이 직접 확인·검증할 수 있게 한다. */}
        <div className="flex flex-col gap-2 border-t border-dashed border-navy/18 pt-3.5">
          <span className="flex items-center gap-1.5 text-[10px] font-700 uppercase tracking-[0.14em] text-muted">
            <DocIcon size={12} color="#a93030" />
            증언 근거 공공데이터 {result.documentsUsed.length}종 · 출처 공개
          </span>
          <ul className="flex flex-wrap gap-1.5">
            {result.documentsUsed.map((doc) => {
              const datasetId = extractDatasetId(doc.url);
              const isLink = /^https?:\/\//.test(doc.url);
              const Inner = (
                <>
                  <span className="font-600 text-navy/85">{doc.title}</span>
                  <span className="text-[9px] text-muted">· {doc.source}</span>
                  {datasetId && (
                    <span
                      className="ml-0.5 px-1 py-px text-[8.5px] font-700 tabular-nums tracking-wide text-paper"
                      style={{ background: "#1a2a4a", borderRadius: 1 }}
                      title="data.go.kr 데이터셋 등록번호"
                    >
                      {datasetId}
                    </span>
                  )}
                </>
              );
              return (
                <li key={doc.id}>
                  {isLink ? (
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 border border-navy/22 bg-paper px-2 py-[3px] text-[10.5px] font-500 text-navy/80 transition-colors hover:border-red hover:text-red"
                      style={{ borderRadius: 2 }}
                      title={`출처 원문 열기: ${doc.url}`}
                    >
                      {Inner}
                      <span aria-hidden className="text-[9px] text-red">↗</span>
                    </a>
                  ) : (
                    <span
                      className="inline-flex items-center gap-1 border border-navy/22 bg-paper px-2 py-[3px] text-[10.5px] font-500 text-navy/80"
                      style={{ borderRadius: 2 }}
                    >
                      {Inner}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
          <p className="text-[9.5px] leading-snug text-muted">
            각 항목을 누르면 출처 원문(data.go.kr 등)으로 이동합니다. 숫자 배지는
            data.go.kr 데이터셋 등록번호입니다.
          </p>
        </div>
      </div>
    </div>
  );
}
