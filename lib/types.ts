// 6시점 (6-View Policy Stress Test) — 공유 타입 계약
// 모든 모듈은 이 파일의 타입을 사용해 계약을 일치시킨다.

// ===== 5대 의제 =====
export type AgendaId =
  | 'consolidation' // 학교 통폐합·이전
  | 'neulbom' // 늘봄학교 효과·확대
  | 'basic-literacy' // 기초학력·AI 디지털교과서
  | 'teacher-admin' // 교원 행정 부담 자동화
  | 'inclusion'; // 다문화·특수교육 포용

export interface Agenda {
  id: AgendaId;
  title: string;
  description: string;
  /** 의제별로 추가 호출되는 동적 증언자 2명 */
  dynamicWitnesses: [WitnessId, WitnessId];
}

// ===== 증언자 (Witness) =====
export type WitnessId =
  // 핵심 4 (고정)
  | 'student'
  | 'parent'
  | 'teacher'
  | 'authority'
  // 통폐합 동적 2
  | 'resident'
  | 'closed-school-alumni'
  // 늘봄 동적 2
  | 'care-worker'
  | 'dual-income-parent'
  // 기초학력 동적 2
  | 'struggling-student'
  | 'edtech-developer'
  // 교원행정 동적 2
  | 'school-nonregular'
  | 'admin-staff'
  // 다문화·특수 동적 2
  | 'multicultural-family'
  | 'korean-teacher';

export type WitnessTier = 'core' | 'dynamic';
export type ModelId = 'claude-opus-4-7' | 'claude-haiku-4-5';

export interface Witness {
  id: WitnessId;
  name: string; // 한국어 표시명 (예: "학생")
  role: string; // 짧은 역할 설명
  tier: WitnessTier;
  model: ModelId;
  accentColor: string; // 증언석 색상
  systemPrompt: string; // lib/witnesses.ts 에서 채움
}

// ===== 공공데이터 =====
export interface PublicDataDoc {
  id: string;
  title: string;
  source: string; // 출처 기관
  url: string;
  updateCycle: string; // 갱신 주기
  content: string; // RAG 본문 텍스트
}

// ===== Citation (Anthropic Citations API 파싱 결과) =====
export interface Citation {
  citedText: string;
  documentTitle: string;
  documentIndex: number;
  startCharIndex?: number;
  endCharIndex?: number;
}

// ===== 증언 =====
export interface TestimonySegment {
  text: string;
  citations: Citation[];
}

export interface Testimony {
  witnessId: WitnessId;
  witnessName: string;
  tier: WitnessTier;
  stance: 'support' | 'oppose' | 'conditional'; // 주장에 대한 입장
  segments: TestimonySegment[];
  citationCount: number; // 인용 횟수
  dataTypesUsed: number; // 인용한 데이터셋 종 수
  error?: string;
}

// ===== 실측 갈등/수요 지표 (ConflictSignal) =====
// rag.ts가 retrieveDocs 결과(공공데이터 JSON)에서 추출해 computeStressScore에 전달한다.
// PSS 산식의 "실데이터 기반" 축을 위한 결정론적 입력. 값이 없으면 undefined.
export interface ConflictSignal {
  /** 폐교 사례 평균 반대 청원 건수 (closed-schools.json: petition_count) */
  avgPetitionCount?: number;
  /** 폐교 사례 중 지역사회 반대(반대·강한반대) 비율 0-1 (closed-schools.json: community_reaction) */
  communityOppositionRatio?: number;
  /** 통폐합 통학버스 필요 학구 비율 0-1 (school-zone.json: consolidation_commute_impact.bus_required) */
  busRequiredRatio?: number;
  /** 안전통학로 없는 학구 비율 0-1 (school-zone.json: safe_route_exists=false) */
  unsafeRouteRatio?: number;
  /** 방과후 돌봄 수요 미충족률 0-1 (private-edu-population.json: after_school_demand_unmet_pct) */
  careDemandUnmetRatio?: number;
  /** 한국어 지원 미적용 학생 비율 0-1 (multicultural-students.json: coverage 기반) */
  koreanSupportUnmetRatio?: number;
  /** 다문화 학력격차 배수 (multicultural-students.json: academic_gap.gap_multiplier) */
  academicGapMultiplier?: number;
  /** 특수교사 법정정원 부족률 0-1 (special-education.json: shortage_rate_pct) */
  staffShortageRatio?: number;
  /** 교사 행정업무 비중 0-1 (special-education.json: admin_to_teaching_ratio) */
  adminBurdenRatio?: number;
  /** 통폐합 위험(고·중위험) 학교 비율 0-1 (schoolinfo-disclosure.json: consolidation_risk) */
  consolidationRiskRatio?: number;
  /** 신뢰도 — 위 지표 산출에 실제 사용된 데이터셋 종 수 (0이면 실데이터 미반영) */
  sourceCount: number;
}

// ===== 정책 스트레스 점수 =====
export type StressGrade = 'high' | 'medium' | 'low'; // 고(70+)/중(40-69)/저(<40)

export interface StressScore {
  total: number; // 0-100 연속값
  grade: StressGrade;
  consensus: number; // 이해관계자 합의도 (0-40)
  legalConflict: number; // 법규·행정 충돌도 (0-30)
  stability: number; // 정책 안정성 (0-30)
  rationale: string; // 산출 근거 요약
}

// ===== 절충안 =====
export interface Compromise {
  id: number;
  title: string;
  description: string;
  feasibility: 'high' | 'medium' | 'low';
  legalPassed: boolean; // 법규·행정 RAG 필터 통과 여부
  legalNote?: string; // 법규 검토 메모
  supportingWitnesses: WitnessId[];
}

// ===== API 계약 =====
// POST /api/deliberate
export interface DeliberateRequest {
  agendaId: AgendaId;
  claim: string;
}

export interface DeliberateResponse {
  agendaId: AgendaId;
  claim: string;
  testimonies: Testimony[];
  stressScore: StressScore;
  compromises: Compromise[];
  // 증언 근거 공공데이터 출처 — 심사위원이 datasetId·출처기관을 확인하고
  // data.go.kr 원문으로 이동할 수 있도록 url을 함께 노출한다(데이터 출처 투명성).
  documentsUsed: { id: string; title: string; source: string; url: string }[];
  isMock: boolean;
  timestamp: string;
}

// ===== 모듈 함수 시그니처 계약 (executor 참고용) =====
// lib/data-loader.ts  : export function loadAllData(): PublicDataDoc[]
// lib/rag.ts          : export function retrieveDocs(agendaId: AgendaId, claim: string): PublicDataDoc[]
//                       export function extractConflictSignals(docs: PublicDataDoc[]): ConflictSignal
// lib/witnesses.ts    : export function getWitnessesForAgenda(agendaId: AgendaId): Witness[]
// lib/stress-score.ts : export function computeStressScore(testimonies: Testimony[], compromises: Compromise[], signal?: ConflictSignal): StressScore
// lib/compromise.ts   : export async function deriveCompromises(agendaId, claim, testimonies, docs): Promise<Compromise[]>
// lib/legal-rag.ts    : export function legalFilter(compromises: Compromise[], agendaId: AgendaId): Compromise[]
// lib/orchestrator.ts : export async function deliberate(req: DeliberateRequest): Promise<DeliberateResponse>
