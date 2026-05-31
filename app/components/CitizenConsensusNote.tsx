"use client";

// 6시점 — 6단계: 시민 합의도 (베타). 누적 1,000명 임계점 이후 활성.
// 미완성 인상 방지 위해 "정직 표기"로 분리 노출.
import { SectionMark } from "./ui";

const THRESHOLD = 1000;
// 데모 시점 누적 참여자 — 0이면 미완성 인상을 주므로 가정치를 둔다.
// 실제 운영 시 누적 참여 데이터로 대체되며, 임계점 도달 전까지 비활성 유지.
const CURRENT = 127;

export default function CitizenConsensusNote() {
  const pct = Math.min(CURRENT / THRESHOLD, 1);

  return (
    <section aria-labelledby="consensus-heading">
      <div id="consensus-heading" className="scroll-mt-24">
        <SectionMark
          no="06"
          kicker="Citizen Consensus · Beta"
          title="시민 합의도"
        />
      </div>

      <div
        className="mt-5 flex flex-col gap-4 border border-dashed border-navy/30 p-5 sm:flex-row sm:items-center sm:gap-6"
        style={{ background: "#f3ecd8", borderRadius: 2 }}
      >
        {/* 베타 표식 */}
        <div className="flex shrink-0 items-center gap-2.5">
          <span
            className="px-2.5 py-1 font-serif text-[12px] font-900 uppercase tracking-[0.12em]"
            style={{
              background: "#6b6655",
              color: "#f8f4e9",
              borderRadius: 2,
            }}
          >
            Beta
          </span>
          <div className="h-9 w-px bg-navy/20" />
        </div>

        {/* 설명 + 임계점 게이지 */}
        <div className="min-w-0 flex-1">
          <p className="text-[12.5px] leading-relaxed text-ink/85">
            <strong className="text-navy">시민 합의도</strong>는 향후 도입 예정인
            확장 기능(로드맵)입니다. Pol.is식 의견 군집(PCA·K-means) 분석은 아직
            구현되지 않았으며, 누적 참여 시민이 임계점에 도달하면 7번째 시점으로
            추가할 계획입니다. 현재 화면은 6인의 증언자 진술까지만 실제로 산출하며,
            이 영역은 의도적으로 비활성(플레이스홀더) 상태로 둡니다.
          </p>

          {/* 임계점 진행 */}
          <div className="mt-3">
            <div className="mb-1.5 flex items-center justify-between text-[10.5px] font-700 uppercase tracking-wider text-muted">
              <span>누적 시민 참여</span>
              <span className="tabular-nums">
                {CURRENT.toLocaleString()} / {THRESHOLD.toLocaleString()}명
              </span>
            </div>
            <div
              className="relative h-2.5 w-full overflow-hidden"
              style={{ background: "#e0d4b2", borderRadius: 1 }}
            >
              <div
                className="absolute left-0 top-0 h-full"
                style={{
                  width: `${Math.max(pct * 100, 1.5)}%`,
                  background: "#6b6655",
                }}
              />
              {/* 임계점 표식 */}
              <span className="absolute right-0 top-0 h-full w-[2px] bg-red" />
            </div>
            <p className="mt-1.5 text-[10px] text-muted">
              임계점 도달 시 시민 군집 합의 지도를 7번째 시점으로 추가할 예정입니다(미구현).
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
