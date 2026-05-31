// 6시점 — POST /api/deliberate
// 교육정책 주장을 받아 6 증언자 심의를 수행하고 DeliberateResponse를 반환한다.
import { NextResponse } from 'next/server';
import type { DeliberateRequest, AgendaId } from '@/lib/types';
import { AGENDAS } from '@/lib/constants';
import { deliberate } from '@/lib/orchestrator';
import { sanitizeClaim } from '@/lib/sanitize';

// 심의 1건은 6 증언자 병렬 LLM 호출 + 절충안 도출로 시간이 걸린다.
// Vercel 함수 최대 실행 시간을 60초로 상향한다 (performance 리뷰 [P3]).
export const maxDuration = 60;

// 주장(claim) 입력 길이 제한
const CLAIM_MAX_LENGTH = 500;

// ===== Rate Limiting (security 리뷰 [CRITICAL]) =====
// IP 기반 일일 한도 — 인메모리 Map 방식.
// ⚠️ 한계(정직 표기): 인메모리 카운터는 서버리스/다중 인스턴스 환경에서
//    인스턴스(=람다)별로 분리되므로 IP당 실제 허용량은 (한도 × 활성 인스턴스 수)가
//    되어 전역 한도로는 부정확하다. 콜드스타트 때마다 초기화되기도 한다.
//    엄밀한 전역 제한이 필요하면 Upstash Redis 등 공유 저장소가 필요하다.
//    본 앱은 비용 폭주를 막는 1차 방어선 용도이며, 그 한계를 인지한 채 사용한다.
// 📌 데모용 한도: 본선 공개검증에서 심사위원 여러 명이 동시에 접속·연속 시연할 수
//    있으므로 5건은 너무 빡빡하다. 데모 친화적으로 50건으로 상향한다.
//    (남용 방지 + 시연 편의의 절충값. 운영 전환 시 환경변수로 조정 권장.)
const DAILY_LIMIT = 50;
const DAY_MS = 24 * 60 * 60 * 1000;

interface RateRecord {
  count: number;
  /** 카운트 윈도우 시작 시각(ms) */
  windowStart: number;
}

const rateMap = new Map<string, RateRecord>();

/** 요청 IP를 추출한다 (프록시 헤더 우선, 실패 시 'unknown'). */
function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    // x-forwarded-for: "client, proxy1, proxy2" — 첫 항목이 원 클라이언트
    return forwarded.split(',')[0].trim();
  }
  return req.headers.get('x-real-ip')?.trim() || 'unknown';
}

/**
 * IP의 일일 호출 한도를 검사하고 카운트를 증가시킨다.
 * @returns allowed=false면 한도 초과. retryAfterSec은 윈도우 리셋까지 초.
 */
function checkRateLimit(ip: string): { allowed: boolean; retryAfterSec: number } {
  const now = Date.now();
  const record = rateMap.get(ip);

  // 윈도우 없음 또는 24시간 경과 → 새 윈도우 시작
  if (!record || now - record.windowStart >= DAY_MS) {
    rateMap.set(ip, { count: 1, windowStart: now });
    return { allowed: true, retryAfterSec: 0 };
  }

  if (record.count >= DAILY_LIMIT) {
    const retryAfterSec = Math.ceil((record.windowStart + DAY_MS - now) / 1000);
    return { allowed: false, retryAfterSec };
  }

  record.count += 1;
  return { allowed: true, retryAfterSec: 0 };
}

/**
 * rateMap에 누적된 만료 레코드를 정리한다(메모리 누수 방지).
 * 매 요청마다 호출하되, 맵이 일정 크기 이상일 때만 순회한다.
 */
function pruneRateMap(): void {
  if (rateMap.size < 1000) return;
  const now = Date.now();
  for (const [ip, record] of rateMap) {
    if (now - record.windowStart >= DAY_MS) {
      rateMap.delete(ip);
    }
  }
}

/** 유효한 AgendaId인지 검증 */
function isValidAgendaId(value: unknown): value is AgendaId {
  return typeof value === 'string' && value in AGENDAS;
}

export async function POST(req: Request): Promise<NextResponse> {
  // ----- Rate Limiting -----
  pruneRateMap();
  const ip = getClientIp(req);
  const rate = checkRateLimit(ip);
  if (!rate.allowed) {
    return NextResponse.json(
      {
        error: `일일 요청 한도(${DAILY_LIMIT}건)를 초과했습니다. 잠시 후 다시 시도해 주세요.`,
      },
      {
        status: 429,
        headers: { 'Retry-After': String(rate.retryAfterSec) },
      },
    );
  }

  // ----- 요청 본문 파싱 -----
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: '요청 본문이 올바른 JSON 형식이 아닙니다.' },
      { status: 400 },
    );
  }

  // ----- 입력 검증 -----
  if (typeof body !== 'object' || body === null) {
    return NextResponse.json(
      { error: '요청 본문은 객체여야 합니다.' },
      { status: 400 },
    );
  }

  const { agendaId, claim } = body as Partial<DeliberateRequest>;

  if (!isValidAgendaId(agendaId)) {
    return NextResponse.json(
      { error: '유효하지 않은 의제(agendaId)입니다.' },
      { status: 400 },
    );
  }

  if (typeof claim !== 'string') {
    return NextResponse.json(
      { error: '정책 주장(claim)은 문자열이어야 합니다.' },
      { status: 400 },
    );
  }

  const trimmedClaim = claim.trim();
  if (trimmedClaim.length === 0) {
    return NextResponse.json(
      { error: '정책 주장(claim)을 입력해 주세요.' },
      { status: 400 },
    );
  }
  if (trimmedClaim.length > CLAIM_MAX_LENGTH) {
    return NextResponse.json(
      { error: `정책 주장(claim)은 ${CLAIM_MAX_LENGTH}자 이내로 입력해 주세요.` },
      { status: 400 },
    );
  }

  // ----- 프롬프트 인젝션 방어 (security 리뷰 [HIGH]) -----
  // 정제된 claim만 이후 LLM 호출·응답에 사용한다.
  const { sanitized: safeClaim, flagged } = sanitizeClaim(trimmedClaim);
  if (flagged) {
    // 인젝션 패턴 탐지는 서버 로그에만 남긴다(사용자에게 상세 노출 금지).
    console.warn('[deliberate] 프롬프트 인젝션 의심 패턴 탐지·중화. ip=%s', ip);
  }
  if (safeClaim.length === 0) {
    return NextResponse.json(
      { error: '정책 주장(claim)을 다시 입력해 주세요.' },
      { status: 400 },
    );
  }

  // ----- 심의 수행 -----
  try {
    const result = await deliberate({ agendaId, claim: safeClaim });
    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    console.error('[deliberate] 심의 처리 중 오류:', err);
    return NextResponse.json(
      { error: '심의 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.' },
      { status: 500 },
    );
  }
}
