// lib/legal-rag.ts — 교육 법규 키워드 기반 간이 RAG 필터 (순수 함수)
// 내장 법규 지식: 초중등교육법, 교육기본법, 지방교육자치법, 국가균형발전법
// 8개 절충안 중 6-7개 통과, 1-2개 조건부/불가 판정 (현실감 설계)

import type { Compromise, AgendaId } from './types';

// ────────────────────────────────────────────
// 내장 법규 규칙 정의
// 각 규칙: 키워드 패턴 + 위반 시 legalNote
// ────────────────────────────────────────────

interface LegalRule {
  /** 규칙 식별자 */
  id: string;
  /** 관련 법령 */
  statute: string;
  /** description에서 매칭할 키워드 패턴 (OR 조건) */
  triggerKeywords: string[];
  /** 법규 위반으로 판정할 추가 조건 키워드 (triggerKeywords 매칭 후 이 중 하나라도 있으면 위반) */
  violationKeywords: string[];
  /** legalPassed=false 시 사유 메시지 */
  violationNote: string;
  /** 적용 의제 (빈 배열 = 전 의제 공통) */
  applicableAgendas: AgendaId[];
}

const LEGAL_RULES: LegalRule[] = [
  // ── 초중등교육법 제24조: 수업일수 ──
  {
    id: 'edu-act-24-attendance',
    statute: '초중등교육법 제24조(수업일수)',
    triggerKeywords: ['수업일수', '학사일정', '등교일', '수업 일수'],
    violationKeywords: ['단축', '축소', '감축', '즉시 전환', '전면 대체', '예외'],
    violationNote:
      '초중등교육법 제24조는 학년도 수업일수를 190일 이상으로 규정합니다. 수업일수 단축은 교육부 장관 고시 개정 없이 불가합니다.',
    applicableAgendas: [],
  },

  // ── 초중등교육법 제19조: 교원 정수 ──
  {
    id: 'edu-act-19-teacher-quota',
    statute: '초중등교육법 제19조(교직원의 구분)',
    triggerKeywords: ['교원', '교사', '정원', '정수', '인력'],
    violationKeywords: ['즉시 전환', '전면 대체', '연수 없이', '교사 없이', '법정 기준 없이'],
    violationNote:
      '초중등교육법 제19조 및 교원지위법에 따라 교원 정수 조정은 교육부령 개정 절차가 필요합니다. 연수·준비 기간 없는 즉시 전면 전환은 법정 절차 위반 소지가 있습니다.',
    applicableAgendas: [],
  },

  // ── 교육기본법 제4조: 교육 기회균등 ──
  {
    id: 'edu-basic-4-equal-opportunity',
    statute: '교육기본법 제4조(교육의 기회균등)',
    triggerKeywords: ['통합', '전환', '배치', '접근'],
    violationKeywords: ['지원 체계 없이', '즉시 전환', '준비 없이', '예산 없이'],
    violationNote:
      '교육기본법 제4조는 모든 국민의 교육 기회균등을 보장합니다. 지원 체계 없는 즉시 전환은 취약계층 학생의 교육권 침해로 위헌 소지가 있습니다.',
    applicableAgendas: ['inclusion', 'basic-literacy'],
  },

  // ── 지방교육자치법 제20조: 교육감 권한 ──
  {
    id: 'local-edu-20-superintendent',
    statute: '지방교육자치에 관한 법률 제20조(교육감의 관장 사무)',
    triggerKeywords: ['교육청', '교육감', '학구도', '학교 배정', '전학구'],
    violationKeywords: ['교육부가 직접', '중앙에서 일괄', '교육감 권한 박탈', '국가가 결정'],
    violationNote:
      '지방교육자치법 제20조에 따라 학구도 설정·학교 배정은 교육감 고유 권한입니다. 교육부가 이를 직접 결정·강제하는 방식은 자치권 침해 소지가 있습니다.',
    applicableAgendas: ['consolidation'],
  },

  // ── 국가균형발전법 제12조: 생활권 서비스 ──
  {
    id: 'balanced-dev-12-public-service',
    statute: '국가균형발전 특별법 제12조(생활권 서비스)',
    triggerKeywords: ['통폐합', '폐교', '학교 폐쇄', '분교 폐지'],
    violationKeywords: ['이의신청 없이', '즉시', '주민 동의 없이', '공청회 없이'],
    violationNote:
      '국가균형발전 특별법 제12조는 농산어촌 생활권 서비스 보장을 규정합니다. 주민 의견 수렴 없는 즉시 폐교는 법적 분쟁 위험이 높습니다.',
    applicableAgendas: ['consolidation'],
  },

  // ── 초중등교육법 제55조·제59조: 특수교육 ──
  {
    id: 'edu-act-55-special-edu',
    statute: '초중등교육법 제55조(특수학교) 및 장애인 등에 대한 특수교육법 제17조',
    triggerKeywords: ['특수학교', '특수교육', '통합학급', '특수학급'],
    violationKeywords: ['금지', '폐지', '전면 폐쇄', '강제 통합', '즉시 전환'],
    violationNote:
      '장애인 등에 대한 특수교육법 제17조는 보호자의 학교 배치 신청권을 보장합니다. 특수학교 신설 금지 및 강제 통합 전환은 동법 위반 및 헌법상 교육권 침해 소지가 있습니다.',
    applicableAgendas: ['inclusion'],
  },

  // ── 교원지위법 제6조: 교원 행정업무 부담 ──
  {
    id: 'teacher-status-6-admin',
    statute: '교원의 지위 향상 및 교육활동 보호를 위한 특별법 제6조',
    triggerKeywords: ['행정업무', '행정 부담', '공문', '업무 전가'],
    violationKeywords: ['즉시 전면', '연수 없이', '예산 미확보', '전체 대체'],
    violationNote:
      '교원지위법 제6조는 교원의 교육활동 전념 권리를 보장합니다. 충분한 인프라 없는 즉시 전면 AI 대체는 오히려 행정 공백을 야기하며 법령 취지에 반합니다.',
    applicableAgendas: ['teacher-admin'],
  },

  // ── 개인정보보호법: 학생 데이터 ──
  {
    id: 'privacy-student-data',
    statute: '개인정보 보호법 제23조(민감정보 처리 제한) 및 교육기본법 제23조의3',
    triggerKeywords: ['학습 데이터', '학생 데이터', '진단 결과', '데이터 제공', '정보 공유'],
    violationKeywords: ['제3자 판매', '외부 제공', '동의 없이', '무제한 공유'],
    violationNote:
      '개인정보보호법 제23조 및 교육기본법 제23조의3은 학생의 민감 교육 데이터 보호를 규정합니다. 학생 학습 데이터의 제3자 판매·무제한 외부 제공은 명백한 법 위반입니다.',
    applicableAgendas: ['basic-literacy'],
  },
];

// ────────────────────────────────────────────
// 규칙 매칭 로직
// ────────────────────────────────────────────

function containsAny(text: string, keywords: string[]): boolean {
  const lower = text.toLowerCase();
  return keywords.some((kw) => lower.includes(kw.toLowerCase()));
}

// 사용자 주장(claim)이 급진적·강행적 성격을 띠는지 판정하는 키워드.
// 급진적 주장 하에서는 같은 절충안이라도 법규 충돌 위험이 구조적으로 높아진다.
const AGGRESSIVE_CLAIM_KEYWORDS = [
  '즉시', '전면', '강제', '없이', '폐지', '금지', '일괄', '당장', '무조건',
];

/**
 * claim의 급진성 정도를 0-2단계로 측정한다.
 * - 0: 온건한 주장 (급진 키워드 없음)
 * - 1: 다소 급진적 (급진 키워드 1개)
 * - 2: 매우 급진적 (급진 키워드 2개 이상)
 */
function measureClaimAggressiveness(claim: string): 0 | 1 | 2 {
  const lower = claim.toLowerCase();
  const hits = AGGRESSIVE_CLAIM_KEYWORDS.filter((kw) =>
    lower.includes(kw.toLowerCase()),
  ).length;
  if (hits >= 2) return 2;
  if (hits === 1) return 1;
  return 0;
}

/**
 * 단일 절충안에 대해 명시적 법규 규칙 집합을 검사한다.
 *
 * violation 판정은 절충안 본문(title·description)에 대해서만 수행한다
 * (claim 텍스트를 violation 스캔에 합산하면 모든 절충안이 동시에 위반
 *  판정되어 점수가 포화되므로, 절충안 자체의 위반만 본다).
 * trigger(법령 쟁점 활성화)는 절충안 본문 + claim 양쪽을 본다.
 *
 * @param compromise 검사 대상 절충안
 * @param agendaId   현재 의제
 * @param claim      사용자 정책 주장 (trigger 활성화 판정용)
 * @param rules      적용할 법규 규칙 집합
 * @returns { passed, note } — 위반 시 passed=false + 첫 위반 사유
 */
function checkCompromiseAgainstRules(
  compromise: Compromise,
  agendaId: AgendaId,
  claim: string,
  rules: LegalRule[],
): { passed: boolean; note?: string } {
  const compromiseText = `${compromise.title} ${compromise.description}`;

  for (const rule of rules) {
    // 의제 필터: applicableAgendas가 비어있으면 전 의제 적용
    if (rule.applicableAgendas.length > 0 && !rule.applicableAgendas.includes(agendaId)) {
      continue;
    }

    // 1단계: trigger 키워드 존재 여부 — 절충안 본문 또는 claim에 있으면 활성화.
    if (!containsAny(`${compromiseText} ${claim}`, rule.triggerKeywords)) {
      continue;
    }

    // 2단계: violation 키워드는 절충안 본문에서만 검사 (claim 미합산).
    if (containsAny(compromiseText, rule.violationKeywords)) {
      return {
        passed: false,
        note: `[${rule.statute}] ${rule.violationNote}`,
      };
    }
  }

  return { passed: true };
}

/**
 * claim의 급진성에 따른 절충안 법규 위험을 판정한다 (P1-2 핵심).
 *
 * 같은 절충안이라도 사용자 주장이 급진적일수록 법규 충돌 위험이 커진다는
 * 설계를 결정론적으로 구현한다. feasibility를 위험 민감도로 사용한다:
 *  - feasibility=high: 어떤 주장에도 법규 위험 없음 (현행 법령 내 실행 가능)
 *  - feasibility=medium: 매우 급진적(level 2) 주장 하에서만 법규 위험
 *  - feasibility=low: checkFeasibilityRisk에서 이미 별도 불가 처리
 *
 * → 온건한 주장: low만 불가 / 급진적 주장: low + medium 다수 불가.
 *   high는 항상 통과하므로 점수가 100%로 포화되지 않는다.
 */
function checkClaimDrivenRisk(
  compromise: Compromise,
  aggressiveness: 0 | 1 | 2,
): { passed: boolean; note?: string } {
  if (aggressiveness >= 2 && compromise.feasibility === 'medium') {
    return {
      passed: false,
      note:
        '사용자 주장이 즉각·전면 시행을 요구하는 급진적 성격으로, 법령 개정·예산 확보가 전제되는 본 절충안(feasibility=medium)은 해당 주장 맥락에서 현행 법령 체계와 충돌할 소지가 있습니다. 단계적 시행 또는 법령 정비가 선행되어야 합니다.',
    };
  }
  return { passed: true };
}

// ────────────────────────────────────────────
// 의제별 추가 특화 규칙 (인라인 검사)
// 8개 중 6-7개 통과, 1-2개 불가/조건부를 보장하기 위한 보조 로직
// ────────────────────────────────────────────

/**
 * feasibility=low 절충안은 법규 통과 가능성이 낮으므로 조건부 불가 처리.
 * 단, 이미 명시적 법규 위반이 아닌 경우 legalNote에 우려 사항만 명시한다.
 */
function checkFeasibilityRisk(compromise: Compromise): { passed: boolean; note?: string } {
  if (compromise.feasibility === 'low') {
    return {
      passed: false,
      note:
        '실현 가능성(feasibility=low) 평가 결과, 현행 법령 체계에서 즉각적 시행은 법적·행정적 근거가 불충분합니다. 관련 법령 개정 및 예산 확보 후 재검토가 필요합니다.',
    };
  }
  return { passed: true };
}

// ────────────────────────────────────────────
// 공개 API
// ────────────────────────────────────────────

/**
 * 절충안 배열에 법규 RAG 필터를 적용한다 (순수 함수).
 * - 각 절충안의 title·description + 사용자 claim을 내장 법규 규칙과 대조
 * - 명백한 법규 충돌 시 legalPassed=false + legalNote에 사유 기재
 * - feasibility=low 절충안은 법적 근거 불충분으로 불가 처리
 * - legalPassed는 의제·claim·절충안 조합에 따라 변동한다 (P1-2 수정).
 *
 * @param compromises deriveCompromises()가 반환한 절충안 배열
 * @param agendaId 현재 의제 ID (의제별 특화 규칙 적용용)
 * @param claim 사용자 정책 주장 (claim-aware 법규 판정용)
 * @returns legalPassed·legalNote가 갱신된 Compromise[]
 */
export function legalFilter(
  compromises: Compromise[],
  agendaId: AgendaId,
  claim: string,
): Compromise[] {
  // claim 급진성을 1회 측정해 전체 절충안에 동일 적용 (결정론적).
  const aggressiveness = measureClaimAggressiveness(claim);

  return compromises.map((compromise) => {
    // 1단계: 명시적 법규 규칙 검사 (절충안 본문 위반 + claim 기반 trigger)
    const ruleResult = checkCompromiseAgainstRules(
      compromise,
      agendaId,
      claim,
      LEGAL_RULES,
    );
    if (!ruleResult.passed) {
      return {
        ...compromise,
        legalPassed: false,
        legalNote: ruleResult.note,
      };
    }

    // 2단계: feasibility=low → 법적 근거 불충분 판정
    const feasibilityResult = checkFeasibilityRisk(compromise);
    if (!feasibilityResult.passed) {
      return {
        ...compromise,
        legalPassed: false,
        legalNote: feasibilityResult.note,
      };
    }

    // 3단계: claim 급진성 기반 위험 — 급진적 주장 하의 medium 절충안 불가 처리.
    //         이 단계가 legalPassed를 의제·claim에 따라 변동시킨다 (P1-2).
    const claimRiskResult = checkClaimDrivenRisk(compromise, aggressiveness);
    if (!claimRiskResult.passed) {
      return {
        ...compromise,
        legalPassed: false,
        legalNote: claimRiskResult.note,
      };
    }

    // 통과: 기존 legalNote 유지 (있는 경우) 또는 undefined
    return {
      ...compromise,
      legalPassed: true,
      legalNote: compromise.legalNote,
    };
  });
}
