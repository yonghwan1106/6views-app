// lib/sanitize.ts — 프롬프트 인젝션 방어 (security 리뷰 [HIGH])
// 사용자 claim이 LLM 시스템 프롬프트·user 메시지에 삽입되기 전 정제한다.
// - 인젝션 패턴(역할 변경·지시 무시 등) 탐지·중화
// - 따옴표·역따옴표 이스케이프로 프롬프트 경계 탈출 차단
// 결정론적 순수 함수 — LLM 미사용.

/**
 * 프롬프트 인젝션 의심 패턴.
 * 한국어·영어 대표 표현을 망라한다. 대소문자 무시(i) 적용.
 */
const INJECTION_PATTERNS: RegExp[] = [
  // 지시 무시·재정의 (한국어)
  /이전\s*(의|에)?\s*(지시|명령|지침|프롬프트|규칙)[^\n]{0,8}(무시|잊|취소|폐기|덮어)/i,
  /(위|앞)의?\s*(지시|명령|지침|규칙)[^\n]{0,8}(무시|잊|취소)/i,
  /(지금부터|이제부터)[^\n]{0,12}(너는|당신은|역할)/i,
  /(시스템\s*프롬프트)[^\n]{0,12}(무시|공개|출력|보여)/i,
  /(새로운|다른)\s*(역할|규칙|지시)[^\n]{0,8}(부여|수행|따르)/i,
  // 지시 무시·재정의 (영어)
  /ignore\s+(all\s+)?(previous|prior|above|the\s+above)\s+(instructions?|prompts?|rules?|context)/i,
  /disregard\s+(all\s+)?(previous|prior|above)\s+(instructions?|prompts?|rules?)/i,
  /forget\s+(everything|all|your)\s+(above|previous|instructions?|prompt)/i,
  /you\s+are\s+now\s+(a|an|no\s+longer)/i,
  /(reveal|show|print|repeat|output)\s+(your|the)\s+(system\s+)?(prompt|instructions?)/i,
  // 역할 강제·탈옥
  /(역할|롤)\s*(을|를)?\s*(변경|전환|벗어)/i,
  /(jailbreak|developer\s*mode|dan\s*mode)/i,
  // 대화 경계 위조 (가짜 메시지 헤더 삽입)
  /\b(system|assistant|user)\s*[:：]\s*/i,
  /\[\/?\s*(system|inst|instruction)\s*\]/i,
  /<\/?\s*(system|instruction|im_start|im_end)\s*>/i,
];

/** 인젝션 패턴 매칭 시 대체할 중립 토큰 */
const NEUTRALIZED_TOKEN = '[정제됨]';

export interface SanitizeResult {
  /** 정제된 안전한 텍스트 (LLM 삽입용) */
  sanitized: string;
  /** 인젝션 패턴이 1건 이상 탐지·중화되었는지 */
  flagged: boolean;
  /** 탐지된 패턴 수 (서버 로그용) */
  detectionCount: number;
}

/** 허용 제어문자 코드 (탭·줄바꿈·캐리지리턴) */
const ALLOWED_CONTROL_CODES = new Set<number>([0x09, 0x0a, 0x0d]);

/** 제어문자(0x00-0x1F, 0x7F)를 제거한다 — 허용 3종은 보존. */
function stripControlChars(input: string): string {
  let out = '';
  for (const ch of input) {
    const code = ch.charCodeAt(0);
    const isControl = (code <= 0x1f || code === 0x7f) && !ALLOWED_CONTROL_CODES.has(code);
    if (!isControl) out += ch;
  }
  return out;
}

/**
 * 사용자 claim을 LLM 삽입 전 정제한다.
 *
 * 처리 순서:
 * 1. 제어문자 제거 (널·escape 등 — 탭·줄바꿈·캐리지리턴은 유지)
 * 2. 인젝션 패턴을 [정제됨] 토큰으로 중화
 * 3. 따옴표·역따옴표·중괄호를 전각으로 치환해 프롬프트 경계 탈출 차단
 *
 * @param raw 사용자 원본 입력
 * @returns SanitizeResult — sanitized 텍스트 + flagged 여부
 */
export function sanitizeClaim(raw: string): SanitizeResult {
  // 1) 제어문자 제거
  let text = stripControlChars(raw);

  // 2) 인젝션 패턴 탐지·중화
  let detectionCount = 0;
  for (const pattern of INJECTION_PATTERNS) {
    text = text.replace(pattern, () => {
      detectionCount += 1;
      return NEUTRALIZED_TOKEN;
    });
  }

  // 3) 프롬프트 경계 탈출 차단 — 따옴표·역따옴표 이스케이프
  //    claim은 항상 "..." 안에 삽입되므로 큰따옴표·역따옴표를 전각으로 중화한다.
  const escaped = text
    .replace(/\\/g, '＼') // 역슬래시 → 전각(이스케이프 시퀀스 무력화)
    .replace(/"/g, '＂') // 큰따옴표 → 전각
    .replace(/`/g, '｀') // 역따옴표 → 전각
    .replace(/\{/g, '｛') // 중괄호 → 전각(JSON 경계 위조 차단)
    .replace(/\}/g, '｝');

  return {
    sanitized: escaped.trim(),
    flagged: detectionCount > 0,
    detectionCount,
  };
}

/**
 * LLM 응답 등 외부 텍스트에서 따옴표만 안전하게 이스케이프한다.
 * (claim 외 짧은 문자열 삽입용 — 인젝션 패턴 검사는 생략)
 */
export function escapeForPrompt(text: string): string {
  return text
    .replace(/\\/g, '＼')
    .replace(/"/g, '＂')
    .replace(/`/g, '｀');
}
