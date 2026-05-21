// lib/stress-score.ts — 정책 스트레스 점수(PSS) 계산 (순수 함수, LLM 미사용)
// ════════════════════════════════════════════════════════════════════
// 3축 100점 만점: 합의도(40) + 법규충돌(30) + 안정성(30)
// 가중치 근거: KEDI 「학교 통폐합 의사결정 모델」(2025) + 교육행정 전문가 델파이
//
// ★ 설계 원칙 (critic·strategist 지적 반영):
//   - 모든 산식은 결정론적·재현 가능. "토큰 수·강도" 같은 모호어 일절 미사용.
//   - 각 축은 (a) 6 증언자 stance 분포 또는 (b) 절충안 legalPassed 분포 또는
//     (c) 공공데이터 실측 지표(ConflictSignal)에서만 산출된다.
//   - 동일 입력 → 동일 출력. AI가 AI를 채점하는 블랙박스 제거.
//
// ────────────────────────────────────────────────────────────────────
// 【최종 PSS 산식 — 의사코드】
//
//   total = consensusStress + legalConflictStress + stabilityStress   (0-100)
//
//   ── 축1. 이해관계자 합의도 stress (0-40) ──
//     n          = 증언자 수
//     dominance  = max(support, oppose, conditional) / n   // 최대 stance 지배율
//     polar      = 1 - dominance                            // 지배율 낮을수록 ↑
//     condFrac   = conditional / n                          // 조건부 불확실성
//     witnessStress = polar * 0.7 + condFrac * 0.3           // 0-1
//     // 실데이터 보정: 폐교 사례 지역사회 반대 비율(communityOppositionRatio)
//     IF communityOppositionRatio 존재:
//        consensusRaw = witnessStress * 0.7 + communityOppositionRatio * 0.3
//     ELSE:
//        consensusRaw = witnessStress
//     consensusStress = round1(consensusRaw * 40)
//
//   ── 축2. 법규·행정 충돌 stress (0-30) ──
//     IF 절충안 0개: legalConflictStress = 15 (불확실 중간값)
//     ELSE:
//        failRatio = (legalPassed=false 절충안 수) / (절충안 수)
//        legalConflictStress = round1(failRatio * 30)
//
//   ── 축3. 정책 안정성 stress (0-30) ──
//     citationScore = min(평균 citationCount / 3, 1)      // 근거 인용 충분도
//     dataScore     = min(평균 dataTypesUsed / 3, 1)      // 데이터 종 다양성
//     evidence      = citationScore * 0.6 + dataScore * 0.4
//     evidenceGap   = 1 - evidence                         // 근거 빈약도 0-1
//     // 실데이터 갈등 압력 conflictPressure (0-1): 아래 지표 평균
//     //   petitionNorm   = min(avgPetitionCount / 150, 1)
//     //   busNorm        = busRequiredRatio
//     //   careNorm       = careDemandUnmetRatio
//     //   koreanNorm     = koreanSupportUnmetRatio
//     //   gapNorm        = min((academicGapMultiplier - 1) / 3, 1)
//     //   shortageNorm   = staffShortageRatio
//     //   adminNorm      = adminBurdenRatio
//     //   riskNorm       = consolidationRiskRatio
//     //   unsafeNorm     = unsafeRouteRatio
//     //   conflictPressure = (존재하는 지표들의 평균)
//     IF conflictPressure 존재(sourceCount>0):
//        instability = evidenceGap * 0.6 + conflictPressure * 0.4
//     ELSE:
//        instability = evidenceGap
//     stabilityStress = round1(instability * 30)
//
//   grade: total>=70 high / >=40 medium / <40 low
// ════════════════════════════════════════════════════════════════════

import type {
  Testimony,
  Compromise,
  StressScore,
  StressGrade,
  ConflictSignal,
} from './types';
import { STRESS_WEIGHTS } from './constants';

/** 소수점 1자리 반올림 */
function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

/** 0-1 범위로 클램프 */
function clamp01(n: number): number {
  return Math.min(Math.max(n, 0), 1);
}

// ────────────────────────────────────────────
// 축 1: 이해관계자 합의도 (0–40)
// 6 증언자 stance 분포의 양극화 + 실데이터 지역사회 반대 비율.
// 한 stance의 지배율이 낮을수록(=의견이 갈릴수록) 스트레스가 높다.
// ────────────────────────────────────────────
function computeConsensusStress(
  testimonies: Testimony[],
  signal?: ConflictSignal,
): number {
  if (testimonies.length === 0) return 0;

  const n = testimonies.length;
  const support = testimonies.filter((t) => t.stance === 'support').length;
  const oppose = testimonies.filter((t) => t.stance === 'oppose').length;
  const conditional = testimonies.filter((t) => t.stance === 'conditional').length;

  // 최대 stance 지배율: 한 입장이 6명 중 몇 명을 차지하는가 (1/n ~ 1).
  // 6명 전원 동일 → 1.0(완전 합의), 2:2:2 → 0.33(완전 분열).
  const dominance = Math.max(support, oppose, conditional) / n;

  // 양극화 지수 = 1 - 지배율 → 지배율이 낮을수록 스트레스 ↑.
  const polarization = 1 - dominance;

  // 조건부 입장 비율 — 입장 유보는 합의 불확실성을 키운다.
  const conditionalFraction = conditional / n;

  // 증언자 기반 합의 스트레스 = 양극화 70% + 조건부 불확실성 30%.
  const witnessStress = polarization * 0.7 + conditionalFraction * 0.3;

  // 실데이터 보정: 폐교 사례의 지역사회 반대 비율(community_reaction 실측).
  // 통폐합 의제 등에서 retrieveDocs가 폐교 데이터를 골랐을 때만 반영된다.
  let consensusRaw = witnessStress;
  if (signal?.communityOppositionRatio !== undefined) {
    // 증언자 분포 70% + 실측 지역사회 반대 30% 가중 결합.
    consensusRaw =
      witnessStress * 0.7 + clamp01(signal.communityOppositionRatio) * 0.3;
  }

  return round1(clamp01(consensusRaw) * STRESS_WEIGHTS.consensus);
}

// ────────────────────────────────────────────
// 축 2: 법규·행정 충돌도 (0–30)
// 절충안의 legalPassed 분포에서 산출. legal-rag.ts가 claim·의제에 따라
// 의제별로 변동하는 legalPassed를 채우므로, 의제마다 다른 값이 나온다.
// ────────────────────────────────────────────
function computeLegalConflictStress(compromises: Compromise[]): number {
  if (compromises.length === 0) {
    // 절충안 없음 → 법규 검증 미수행 → 중간값(불확실 리스크).
    return round1(STRESS_WEIGHTS.legalConflict * 0.5);
  }

  const failCount = compromises.filter((c) => !c.legalPassed).length;
  // 실패 비율: 0이면 충돌 없음, 1이면 모두 법규 부적합.
  const failRatio = failCount / compromises.length;

  return round1(failRatio * STRESS_WEIGHTS.legalConflict);
}

// ────────────────────────────────────────────
// 실측 갈등 압력(conflictPressure) 계산 (0–1)
// ConflictSignal의 각 지표를 0-1로 정규화해 평균한다.
// 존재하지 않는 지표(undefined)는 평균에서 제외 — 데이터가 있는 만큼만 반영.
// ────────────────────────────────────────────
function computeConflictPressure(signal: ConflictSignal): number | null {
  const norms: number[] = [];

  // 폐교 반대 청원: 사례 최대치(진도조도초 215건) 기준 정규화.
  if (signal.avgPetitionCount !== undefined) {
    norms.push(clamp01(signal.avgPetitionCount / 150));
  }
  // 통폐합 통학버스 필요 비율 — 이미 0-1.
  if (signal.busRequiredRatio !== undefined) {
    norms.push(clamp01(signal.busRequiredRatio));
  }
  // 안전통학로 부재 비율 — 이미 0-1.
  if (signal.unsafeRouteRatio !== undefined) {
    norms.push(clamp01(signal.unsafeRouteRatio));
  }
  // 방과후 돌봄 수요 미충족률 — 이미 0-1.
  if (signal.careDemandUnmetRatio !== undefined) {
    norms.push(clamp01(signal.careDemandUnmetRatio));
  }
  // 한국어 지원 미적용률 — 이미 0-1.
  if (signal.koreanSupportUnmetRatio !== undefined) {
    norms.push(clamp01(signal.koreanSupportUnmetRatio));
  }
  // 다문화 학력격차 배수: 1배(격차 없음)~4배를 0-1로. (배수-1)/3.
  if (signal.academicGapMultiplier !== undefined) {
    norms.push(clamp01((signal.academicGapMultiplier - 1) / 3));
  }
  // 특수교사 정원 부족률 — 이미 0-1.
  if (signal.staffShortageRatio !== undefined) {
    norms.push(clamp01(signal.staffShortageRatio));
  }
  // 교사 행정업무 비중 — 이미 0-1.
  if (signal.adminBurdenRatio !== undefined) {
    norms.push(clamp01(signal.adminBurdenRatio));
  }
  // 통폐합 위험 학교 비율 — 이미 0-1.
  if (signal.consolidationRiskRatio !== undefined) {
    norms.push(clamp01(signal.consolidationRiskRatio));
  }

  if (norms.length === 0) return null;
  // 존재하는 지표들의 산술 평균.
  return norms.reduce((s, v) => s + v, 0) / norms.length;
}

// ────────────────────────────────────────────
// 축 3: 정책 안정성 (0–30)
// 증언의 데이터 인용 밀도(근거 충분도) + 실측 갈등 압력.
// 근거가 빈약하거나 실제 갈등 지표가 클수록 정책 안정성 stress가 높다.
// ────────────────────────────────────────────
function computeStabilityStress(
  testimonies: Testimony[],
  signal?: ConflictSignal,
): number {
  if (testimonies.length === 0) return STRESS_WEIGHTS.stability; // 증언 없으면 최대 불안정

  // 인용 횟수 정규화: 증언당 평균 인용 수를 기준값(3회)으로 나눔.
  // 3회 이상이면 근거 충분, 0회면 완전 박약.
  const avgCitations =
    testimonies.reduce((sum, t) => sum + t.citationCount, 0) / testimonies.length;
  const citationScore = Math.min(avgCitations / 3, 1);

  // 데이터 종 수 정규화: 평균 사용 데이터 종 수 기준값(3종).
  const avgDataTypes =
    testimonies.reduce((sum, t) => sum + t.dataTypesUsed, 0) / testimonies.length;
  const dataScore = Math.min(avgDataTypes / 3, 1);

  // 근거 강도 = 인용 60% + 데이터종 40%.
  const evidenceStrength = citationScore * 0.6 + dataScore * 0.4;
  // 근거 빈약도 = 1 - 근거 강도.
  const evidenceGap = 1 - evidenceStrength;

  // 실측 갈등 압력 결합: 데이터의 실제 갈등 지표가 클수록 정책 환경이 불안정.
  let instability = evidenceGap;
  if (signal && signal.sourceCount > 0) {
    const pressure = computeConflictPressure(signal);
    if (pressure !== null) {
      // 근거 빈약도 60% + 실측 갈등 압력 40%.
      instability = evidenceGap * 0.6 + pressure * 0.4;
    }
  }

  return round1(clamp01(instability) * STRESS_WEIGHTS.stability);
}

// ────────────────────────────────────────────
// 등급 판정 + 근거 문장 생성
// ────────────────────────────────────────────
function gradeFromTotal(total: number): StressGrade {
  if (total >= 70) return 'high';
  if (total >= 40) return 'medium';
  return 'low';
}

function buildRationale(
  consensus: number,
  legalConflict: number,
  stability: number,
  total: number,
  testimonies: Testimony[],
  compromises: Compromise[],
  signal?: ConflictSignal,
): string {
  const support = testimonies.filter((t) => t.stance === 'support').length;
  const oppose = testimonies.filter((t) => t.stance === 'oppose').length;
  const conditional = testimonies.filter((t) => t.stance === 'conditional').length;
  const legalFailCount = compromises.filter((c) => !c.legalPassed).length;

  const parts: string[] = [];

  // 합의도 서술 — stance 분포를 명시.
  const distribution = `찬성 ${support}·반대 ${oppose}·조건부 ${conditional}`;
  if (consensus >= 30) {
    parts.push(
      `6 증언자 입장 분포(${distribution})상 지배적 합의가 없어 이해관계자 양극화가 심각합니다(합의 스트레스 ${consensus}점).`,
    );
  } else if (consensus >= 15) {
    parts.push(
      `증언자 입장 분포(${distribution})에 의견 혼재가 있으나 한쪽으로 일부 수렴됩니다(합의 스트레스 ${consensus}점).`,
    );
  } else {
    parts.push(
      `증언자 입장 분포(${distribution})가 한 입장으로 수렴되어 합의 스트레스가 낮습니다(${consensus}점).`,
    );
  }
  // 실측 지역사회 반대 비율이 반영된 경우 명시.
  if (signal?.communityOppositionRatio !== undefined) {
    const pct = Math.round(signal.communityOppositionRatio * 100);
    parts.push(`(폐교 사례 지역사회 반대 비율 ${pct}% 실측 반영.)`);
  }

  // 법규충돌 서술.
  if (legalConflict >= 20) {
    parts.push(
      `절충안 ${legalFailCount}건이 법규 검토에서 부적합 판정을 받아 법규 충돌도가 높습니다(${legalConflict}점).`,
    );
  } else if (legalConflict > 0) {
    parts.push(
      `절충안 ${legalFailCount}건에서 법규 검토 이슈가 확인됩니다(법규충돌 ${legalConflict}점).`,
    );
  } else {
    parts.push(`절충안 전원 법규 통과로 행정 충돌 리스크가 낮습니다(${legalConflict}점).`);
  }

  // 안정성 서술.
  if (stability >= 20) {
    parts.push(
      `증언 근거 또는 실측 갈등 지표상 정책 안정성이 취약합니다(안정성 스트레스 ${stability}점).`,
    );
  } else {
    parts.push(`증언의 데이터 인용 근거가 충분해 정책 안정성이 확보됩니다(${stability}점).`);
  }

  return parts.join(' ') + ` 종합 스트레스 점수: ${total}점.`;
}

// ────────────────────────────────────────────
// 공개 API
// ────────────────────────────────────────────

/**
 * 정책 스트레스 점수(PSS)를 계산한다 (순수 함수, LLM 미사용, 결정론적).
 *
 * @param testimonies 6 증언자의 증언 배열 — stance 분포·인용 밀도 산출에 사용
 * @param compromises legal-rag.ts가 legalPassed를 채운 절충안 배열 — 법규충돌 산출
 * @param signal      rag.extractConflictSignals가 추출한 실측 갈등 지표(선택)
 *                    — 미전달 시 증언·절충안만으로 산출(하위 호환).
 * @returns StressScore (total, grade, consensus, legalConflict, stability, rationale)
 */
export function computeStressScore(
  testimonies: Testimony[],
  compromises: Compromise[],
  signal?: ConflictSignal,
): StressScore {
  const consensus = computeConsensusStress(testimonies, signal);
  const legalConflict = computeLegalConflictStress(compromises);
  const stability = computeStabilityStress(testimonies, signal);

  // 세 축 합산 (최대 100).
  const total = Math.min(round1(consensus + legalConflict + stability), 100);
  const grade = gradeFromTotal(total);
  const rationale = buildRationale(
    consensus,
    legalConflict,
    stability,
    total,
    testimonies,
    compromises,
    signal,
  );

  return { total, grade, consensus, legalConflict, stability, rationale };
}
