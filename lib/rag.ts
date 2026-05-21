// lib/rag.ts
// 간이 RAG: 의제별 우선 데이터셋 매핑 + claim 키워드 매칭 점수 → 관련 문서 3-5개 반환.
// + extractConflictSignals: 공공데이터에서 실측 갈등/수요 지표 추출 (PSS 결정론적 입력).
import 'server-only';
import type { AgendaId, PublicDataDoc, ConflictSignal } from './types';
import { loadAllData } from './data-loader';

// 실측 갈등 지표 추출용 원본 JSON 정적 import (data-loader와 동일 소스 — 번들러 dedupe).
import closedSchoolsData from '@/data/closed-schools.json';
import schoolZoneData from '@/data/school-zone.json';
import privateEduData from '@/data/private-edu-population.json';
import multiculturalData from '@/data/multicultural-students.json';
import specialEduData from '@/data/special-education.json';
import schoolinfoData from '@/data/schoolinfo-disclosure.json';

// ─── 의제별 핵심 데이터셋 매핑 ────────────────────────────────────
// 각 AgendaId에 대해 반드시 포함할 데이터셋 ID 목록(우선순위 순).
const AGENDA_CORE_DATASETS: Record<AgendaId, string[]> = {
  // 통폐합·이전: 폐교현황 / 학교위치 / 학구도 / 인구추계
  consolidation: [
    'closed-schools',
    'school-location',
    'school-zone',
    'private-edu-population',
  ],
  // 늘봄학교: 사교육비·인구 / NEIS 학사일정 / 학교알리미(늘봄 참여) / 다문화(늘봄 참여)
  neulbom: [
    'private-edu-population',
    'neis-schedule',
    'schoolinfo-disclosure',
    'multicultural-students',
  ],
  // 기초학력·AIDT: 학교알리미(기초학력 지원) / 다문화(학력 격차) / 특수교육(AIDT 적용) / NEIS
  'basic-literacy': [
    'schoolinfo-disclosure',
    'multicultural-students',
    'special-education',
    'neis-schedule',
  ],
  // 교원 행정 자동화: NEIS(행정 부담) / 학교알리미(교원 정보) / 특수교육(IEP 행정) / 학구도
  'teacher-admin': [
    'neis-schedule',
    'schoolinfo-disclosure',
    'special-education',
    'school-zone',
  ],
  // 다문화·특수교육 포용: 다문화학생 / 특수교육 / 학구도(접근성) / 학교알리미(다문화 수치) / 인구추계
  inclusion: [
    'multicultural-students',
    'special-education',
    'school-zone',
    'schoolinfo-disclosure',
    'private-edu-population',
  ],
};

// ─── 키워드 → 데이터셋 ID 매핑 ───────────────────────────────────
// claim 텍스트에서 키워드가 발견되면 해당 데이터셋의 점수를 가산한다.
const KEYWORD_DATASET_MAP: Array<{ keywords: string[]; datasetId: string; score: number }> = [
  // 통폐합·폐교 관련
  { keywords: ['통폐합', '폐교', '소규모학교', '소규모 학교', '학교 통합', '학교통합'], datasetId: 'closed-schools', score: 3 },
  { keywords: ['통폐합', '폐교', '이전', '학교 수', '학교수'], datasetId: 'school-location', score: 2 },
  { keywords: ['통학', '학구', '통학거리', '통학 거리', '통학버스'], datasetId: 'school-zone', score: 3 },
  // 늘봄 관련
  { keywords: ['늘봄', '돌봄', '방과후', '방과 후', '맞벌이', '돌봄공백', '돌봄 공백'], datasetId: 'private-edu-population', score: 3 },
  { keywords: ['늘봄', '방학', '학사일정', '수업일수'], datasetId: 'neis-schedule', score: 3 },
  { keywords: ['사교육', '사교육비', '학원비', '학원'], datasetId: 'private-edu-population', score: 3 },
  // 기초학력·AIDT 관련
  { keywords: ['기초학력', '학력미달', '학력 미달', 'AIDT', '디지털교과서', 'AI 교과서', 'AI교과서'], datasetId: 'schoolinfo-disclosure', score: 3 },
  { keywords: ['기초학력', '학습격차', '학습 격차', '교육격차', '교육 격차'], datasetId: 'multicultural-students', score: 2 },
  { keywords: ['디지털교과서', 'AIDT', '특수교육 AI', '보조공학'], datasetId: 'special-education', score: 2 },
  // 교원 행정 관련
  { keywords: ['행정', '행정부담', '행정 부담', 'NEIS', '업무경감', '업무 경감', '자동화'], datasetId: 'neis-schedule', score: 3 },
  { keywords: ['교원', '교사', '교원배치', '교사 수'], datasetId: 'schoolinfo-disclosure', score: 2 },
  { keywords: ['IEP', '개별화교육', '특수교사 행정'], datasetId: 'special-education', score: 3 },
  // 다문화·특수교육 관련
  { keywords: ['다문화', '외국인', '이주배경', '결혼이민'], datasetId: 'multicultural-students', score: 4 },
  { keywords: ['특수교육', '장애학생', '장애 학생', '특수학급', '통합교육'], datasetId: 'special-education', score: 4 },
  { keywords: ['한국어 교육', '한국어교육', '이중언어', '다국어'], datasetId: 'multicultural-students', score: 3 },
  // 인구·출생 관련
  { keywords: ['학령인구', '출생률', '저출생', '저출산', '인구절벽', '인구 감소'], datasetId: 'private-edu-population', score: 3 },
  { keywords: ['농촌', '농어촌', '지방', '지역 소멸', '지역소멸', '인구 감소'], datasetId: 'school-location', score: 2 },
  // 예산·재정 관련
  { keywords: ['예산', '재정', '비용', '1인당 교육비'], datasetId: 'schoolinfo-disclosure', score: 2 },
];

// ─── 점수 계산 ─────────────────────────────────────────────────────
interface ScoredDoc {
  doc: PublicDataDoc;
  score: number;
}

function scoreDocuments(docs: PublicDataDoc[], agendaId: AgendaId, claim: string): ScoredDoc[] {
  const coreIds = AGENDA_CORE_DATASETS[agendaId];
  // 의제 핵심 데이터셋에 기본 점수 부여 (순서 반영: 1위=5점, 2위=4점, 3위=3점, 4위=2점, 5위=1점)
  const coreBaseScore: Record<string, number> = {};
  coreIds.forEach((id, idx) => {
    coreBaseScore[id] = Math.max(5 - idx, 1);
  });

  const lowerClaim = claim.toLowerCase();

  return docs.map((doc): ScoredDoc => {
    let score = coreBaseScore[doc.id] ?? 0;

    // claim 키워드 매칭 점수 가산
    for (const entry of KEYWORD_DATASET_MAP) {
      if (entry.datasetId !== doc.id) continue;
      const hit = entry.keywords.some(kw => lowerClaim.includes(kw.toLowerCase()));
      if (hit) {
        score += entry.score;
      }
    }

    // content 텍스트에 claim의 핵심 명사가 있는지 추가 확인 (간이 BM25 대용)
    const claimTokens = claim
      .replace(/[^\w가-힣]/g, ' ')
      .split(/\s+/)
      .filter(t => t.length >= 2);
    const contentLower = doc.content.toLowerCase();
    for (const token of claimTokens) {
      if (contentLower.includes(token.toLowerCase())) {
        score += 0.5;
      }
    }

    return { doc, score };
  });
}

// ─── 메인 export ──────────────────────────────────────────────────

/**
 * agendaId와 claim(정책 주장 텍스트)을 받아 관련성 높은 PublicDataDoc 3-5개를 반환한다.
 *
 * 선별 기준:
 * 1. 의제별 핵심 데이터셋 매핑 점수 (최대 5점)
 * 2. claim 키워드 매칭 점수 (키워드당 2-4점)
 * 3. content 텍스트 내 claim 토큰 포함 여부 (토큰당 0.5점)
 *
 * 반환 수: 점수 > 0인 문서 중 상위 5개 (최소 3개 보장 — 의제 핵심 데이터셋 우선).
 */
export function retrieveDocs(agendaId: AgendaId, claim: string): PublicDataDoc[] {
  const allDocs = loadAllData();
  const scored = scoreDocuments(allDocs, agendaId, claim);

  // 점수 내림차순 정렬
  scored.sort((a, b) => b.score - a.score);

  // 상위 5개, 단 최소 3개는 의제 핵심 데이터셋에서 확보
  const topN = scored.slice(0, 5);

  // 핵심 데이터셋 중 아직 포함되지 않은 것이 있으면 강제 포함 (최대 5개 유지)
  const coreIds = AGENDA_CORE_DATASETS[agendaId].slice(0, 3);
  const includedIds = new Set(topN.map(s => s.doc.id));

  for (const coreId of coreIds) {
    if (!includedIds.has(coreId)) {
      const coreScoredDoc = scored.find(s => s.doc.id === coreId);
      if (coreScoredDoc) {
        // 꼴찌를 밀어내고 핵심 문서 삽입
        topN.pop();
        topN.push(coreScoredDoc);
        includedIds.add(coreId);
      }
    }
  }

  // 최종 점수 재정렬
  topN.sort((a, b) => b.score - a.score);

  return topN.map(s => s.doc);
}

// ─── 실측 갈등/수요 지표 추출 ──────────────────────────────────────
// PSS(정책 스트레스 점수)의 "실데이터 기반" 축을 위한 결정론적 입력.
// retrieveDocs가 고른 문서에 해당하는 데이터셋에서만 지표를 추출한다
// (= claim·의제와 관련된 갈등 지표만 반영, 무관 데이터 잡음 차단).

/** 폐교 사례 community_reaction 문자열 → 반대 여부 (반대·강한반대 = 반대) */
function isOpposition(reaction: string): boolean {
  return reaction.includes('반대'); // "반대", "강한반대" 포함, "조건부 동의"는 제외
}

/**
 * retrieveDocs 결과에서 실측 갈등/수요 지표(ConflictSignal)를 추출한다.
 *
 * 각 지표는 공공데이터 JSON의 실제 수치에서 산출되는 결정론적 값이다
 * (동일 입력 → 동일 출력, LLM·난수 미사용).
 * 문서가 retrieveDocs에 포함되지 않은 데이터셋의 지표는 undefined로 둔다.
 *
 * @param docs retrieveDocs가 반환한 PublicDataDoc 배열
 * @returns ConflictSignal — sourceCount는 실제 반영된 데이터셋 종 수
 */
export function extractConflictSignals(docs: PublicDataDoc[]): ConflictSignal {
  const ids = new Set(docs.map((d) => d.id));
  const signal: ConflictSignal = { sourceCount: 0 };

  // ── 폐교적교현황: 청원 건수·지역사회 반대 비율 ──
  if (ids.has('closed-schools')) {
    const records = closedSchoolsData.records;
    if (records.length > 0) {
      const totalPetitions = records.reduce((s, r) => s + r.petition_count, 0);
      signal.avgPetitionCount = totalPetitions / records.length;
      const oppositionCount = records.filter((r) => isOpposition(r.community_reaction)).length;
      signal.communityOppositionRatio = oppositionCount / records.length;
      signal.sourceCount += 1;
    }
  }

  // ── 학구도연계정보: 통학버스 필요 비율·안전통학로 부재 비율 ──
  if (ids.has('school-zone')) {
    // 운영 중 학구만 대상 (폐교 학구 제외)
    const active = schoolZoneData.records.filter(
      (r) => r.operation_status !== '폐교통합',
    );
    if (active.length > 0) {
      const busRequired = active.filter(
        (r) => r.consolidation_commute_impact?.bus_required === true,
      ).length;
      signal.busRequiredRatio = busRequired / active.length;
      const unsafe = active.filter((r) => r.safe_route_exists === false).length;
      signal.unsafeRouteRatio = unsafe / active.length;
      signal.sourceCount += 1;
    }
  }

  // ── 사교육비·인구추계: 방과후 돌봄 수요 미충족률 ──
  if (ids.has('private-edu-population')) {
    const unmetPct = privateEduData.dual_income_households.after_school_demand_unmet_pct;
    if (typeof unmetPct === 'number') {
      signal.careDemandUnmetRatio = unmetPct / 100;
      signal.sourceCount += 1;
    }
  }

  // ── 다문화학생현황: 한국어 지원 미적용률·학력격차 배수 ──
  if (ids.has('multicultural-students')) {
    const kls = multiculturalData.korean_language_support;
    const ag = multiculturalData.academic_gap;
    // 한국어 지원 미적용률 = 1 - 커버율
    signal.koreanSupportUnmetRatio = Math.max(0, 1 - kls.coverage_rate_pct / 100);
    signal.academicGapMultiplier = ag.gap_multiplier;
    signal.sourceCount += 1;
  }

  // ── 특수교육 연차보고서: 지원인력 부족률·행정업무 비중 ──
  if (ids.has('special-education')) {
    signal.staffShortageRatio = specialEduData.support_staff.shortage_rate_pct / 100;
    signal.adminBurdenRatio =
      specialEduData.teacher_admin_burden_special_ed.admin_to_teaching_ratio;
    signal.sourceCount += 1;
  }

  // ── 학교알리미 공시: 통폐합 위험(고·중위험) 학교 비율 ──
  if (ids.has('schoolinfo-disclosure')) {
    const records = schoolinfoData.records;
    if (records.length > 0) {
      const atRisk = records.filter(
        (r) => r.consolidation_risk === '고위험' || r.consolidation_risk === '중위험',
      ).length;
      signal.consolidationRiskRatio = atRisk / records.length;
      signal.sourceCount += 1;
    }
  }

  return signal;
}
