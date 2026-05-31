// 6시점 — 공유 상수: 5대 의제, 14 증언자 메타, 색상
import type { Agenda, AgendaId, WitnessId, WitnessTier, ModelId } from './types';

// ===== 청문회 시각언어 색상 =====
export const COLORS = {
  paper: '#F8F4E9', // 진중한 미색 배경
  paperDark: '#ECE3CC', // 미색 음영
  navy: '#1A2A4A', // 짙은 남색 (메인 텍스트·헤더)
  red: '#A93030', // 빨간 단색 액센트
  ink: '#2B2B2B', // 본문 잉크
  muted: '#6B6655', // 보조 텍스트
} as const;

// ===== 5대 의제 =====
export const AGENDAS: Record<AgendaId, Agenda> = {
  consolidation: {
    id: 'consolidation',
    title: '학교 통폐합·이전',
    description: '학령인구 절벽에 따른 학교 통폐합·이전·전환 정책',
    dynamicWitnesses: ['resident', 'closed-school-alumni'],
  },
  neulbom: {
    id: 'neulbom',
    title: '늘봄학교 효과·확대',
    description: '늘봄학교 운영 효과 검증과 확대 정책',
    dynamicWitnesses: ['care-worker', 'dual-income-parent'],
  },
  'basic-literacy': {
    id: 'basic-literacy',
    title: '기초학력·AI 디지털교과서',
    description: '기초학력 보장과 AI 디지털교과서(AIDT) 정책',
    dynamicWitnesses: ['struggling-student', 'edtech-developer'],
  },
  'teacher-admin': {
    id: 'teacher-admin',
    title: '교원 행정 부담 자동화',
    description: '교원 행정업무 경감과 AI 기반 자동화 정책',
    dynamicWitnesses: ['school-nonregular', 'admin-staff'],
  },
  inclusion: {
    id: 'inclusion',
    title: '다문화·특수교육 포용',
    description: '다문화·특수교육 학생 포용과 격차 해소 정책',
    dynamicWitnesses: ['multicultural-family', 'korean-teacher'],
  },
};

export const AGENDA_LIST: Agenda[] = Object.values(AGENDAS);

// ===== 핵심 4 증언자 (모든 의제 공통) =====
export const CORE_WITNESS_IDS: WitnessId[] = ['student', 'parent', 'teacher', 'authority'];

// ===== 14 증언자 메타 정보 =====
interface WitnessMeta {
  name: string;
  role: string;
  tier: WitnessTier;
  model: ModelId;
  accentColor: string;
}

export const WITNESS_META: Record<WitnessId, WitnessMeta> = {
  // 핵심 4 — Opus 4.7
  student: { name: '학생', role: '학습권·진로·통학 당사자', tier: 'core', model: 'claude-opus-4-7', accentColor: '#3A6B8C' },
  parent: { name: '학부모', role: '자녀 교육·돌봄·통학 부담', tier: 'core', model: 'claude-opus-4-7', accentColor: '#8C6B3A' },
  teacher: { name: '교사', role: '교육과정·행정·이직', tier: 'core', model: 'claude-opus-4-7', accentColor: '#3A8C5F' },
  authority: { name: '교육청', role: '예산·정원·법규·정책', tier: 'core', model: 'claude-opus-4-7', accentColor: '#1A2A4A' },
  // 통폐합 동적 2 — Haiku 4.5
  resident: { name: '지역주민', role: '마을 정체성·인구', tier: 'dynamic', model: 'claude-haiku-4-5', accentColor: '#8C3A5F' },
  'closed-school-alumni': { name: '폐교 졸업생', role: '사라진 학교의 기억', tier: 'dynamic', model: 'claude-haiku-4-5', accentColor: '#6B3A8C' },
  // 늘봄 동적 2
  'care-worker': { name: '돌봄전담사', role: '늘봄 현장 운영 인력', tier: 'dynamic', model: 'claude-haiku-4-5', accentColor: '#8C5F3A' },
  'dual-income-parent': { name: '맞벌이 학부모', role: '돌봄 공백 당사자', tier: 'dynamic', model: 'claude-haiku-4-5', accentColor: '#3A7A8C' },
  // 기초학력 동적 2
  'struggling-student': { name: '기초학력 미달 당사자', role: '학습 결손 경험자', tier: 'dynamic', model: 'claude-haiku-4-5', accentColor: '#8C7A3A' },
  'edtech-developer': { name: '에듀테크 개발자', role: 'AI 교육 도구 개발', tier: 'dynamic', model: 'claude-haiku-4-5', accentColor: '#3A8C8C' },
  // 교원행정 동적 2
  'school-nonregular': { name: '학교 비정규직', role: '교육 지원 인력', tier: 'dynamic', model: 'claude-haiku-4-5', accentColor: '#8C4A3A' },
  'admin-staff': { name: '행정실 직원', role: '학교 행정 실무자', tier: 'dynamic', model: 'claude-haiku-4-5', accentColor: '#5F3A8C' },
  // 다문화·특수 동적 2
  'multicultural-family': { name: '다문화 가정', role: '다문화 학생 학부모', tier: 'dynamic', model: 'claude-haiku-4-5', accentColor: '#8C3A8C' },
  'korean-teacher': { name: '한국어 강사', role: '다문화 학생 한국어 교육', tier: 'dynamic', model: 'claude-haiku-4-5', accentColor: '#3A5F8C' },
};

/** 의제에 참여하는 6 증언자 ID (핵심 4 + 동적 2) */
export function witnessIdsForAgenda(agendaId: AgendaId): WitnessId[] {
  return [...CORE_WITNESS_IDS, ...AGENDAS[agendaId].dynamicWitnesses];
}

// ===== 정책 스트레스 점수 3축 가중치 =====
// 가중치 근거: 설계자 가정치 — 민감도 분석상 ±0.1 변동 시 등급 판정 불변, 운영 데이터로 재보정 예정
export const STRESS_WEIGHTS = {
  consensus: 40, // 이해관계자 합의도 — 정책 갈등 비용 최대 기여 변수
  legalConflict: 30, // 법규·행정 충돌도
  stability: 30, // 정책 안정성
} as const;

export const APP_NAME = '6시점';
export const APP_FULL_NAME = '6시점 교육정책 스트레스 테스트';
export const APP_TAGLINE = '교육 정책 결정 전, 6명의 이해관계자가 동시에 증언합니다 — 모두 공공데이터로.';
