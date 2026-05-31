// 6시점 — Anthropic Claude API 클라이언트 + 공통 헬퍼
// 참조: docs.anthropic.com (Citations API, Prompt Caching, TypeScript SDK)
import Anthropic from '@anthropic-ai/sdk';
import type { Citation, ModelId, TestimonySegment } from './types';

/** API 키 미설정 시 mock 모드 — 키 없이도 데모 시연 가능 */
export const USE_MOCK = !process.env.ANTHROPIC_API_KEY;

// maxRetries: 0 (performance 리뷰 [P1]).
// SDK 자체 재시도를 끈다 — callWithFallback이 RateLimit/Overload 시 Haiku로
// 즉시 폴백하므로, SDK 재시도(지수 백오프)는 라이브 데모 응답 지연만 가중한다.
export const anthropic: Anthropic | null = USE_MOCK
  ? null
  : new Anthropic({ maxRetries: 0 });

/** dated 모델 ID (정확한 pinned 버전) */
export const MODEL_IDS: Record<ModelId, string> = {
  'claude-opus-4-7': 'claude-opus-4-7',
  'claude-haiku-4-5': 'claude-haiku-4-5',
};

/**
 * 공공데이터 문서 블록 빌더.
 * citations 활성화 + (옵션) ephemeral 캐싱.
 *
 * ⚠️ Anthropic API 제약: 한 요청에 cache_control breakpoint는 **최대 4개**까지만
 * 허용된다. 문서마다 cache_control을 붙이면 문서가 5개일 때
 * "A maximum of 4 blocks with cache_control may be provided. Found 5." 400 오류가
 * 발생한다. 따라서 기본값은 cache 없음으로 두고, 호출부에서 **마지막 문서 1개**에만
 * cache:true를 지정해 그 지점까지의 prefix 전체를 단일 breakpoint로 캐시한다.
 */
export function buildDocumentBlock(
  doc: {
    title: string;
    content: string;
    source?: string;
  },
  options: { cache?: boolean } = {},
): Anthropic.Messages.DocumentBlockParam {
  return {
    type: 'document',
    source: {
      type: 'text',
      media_type: 'text/plain',
      data: doc.content,
    },
    title: doc.title,
    ...(doc.source ? { context: `출처: ${doc.source}` } : {}),
    citations: { enabled: true },
    ...(options.cache ? { cache_control: { type: 'ephemeral' as const } } : {}),
  };
}

/** Citations API 응답을 TestimonySegment[] 로 파싱 */
export function parseCitedResponse(message: Anthropic.Message): TestimonySegment[] {
  return message.content
    .filter((b): b is Anthropic.Messages.TextBlock => b.type === 'text')
    .map((b) => ({
      text: b.text,
      citations: (((b as { citations?: unknown[] }).citations ?? []) as Array<
        Record<string, unknown>
      >).map(
        (c): Citation => ({
          citedText: (c.cited_text as string) ?? '',
          documentTitle: (c.document_title as string) ?? '',
          documentIndex: (c.document_index as number) ?? 0,
          startCharIndex: c.start_char_index as number | undefined,
          endCharIndex: c.end_char_index as number | undefined,
        }),
      ),
    }));
}

/**
 * 폴백 대상 오류인지 판정한다 (Opus → Haiku 자동 강등).
 *
 * 라이브 데모/공개검증에서 1차 모델(Opus)이 일시적으로 응답하지 못하는
 * 4가지 대표 장애를 모두 흡수해, 증언석이 "일시 오류" 메시지로 도배되지 않게 한다.
 *  - RateLimitError(429): 분당 토큰/요청 한도 초과
 *  - InternalServerError(5xx): Anthropic 측 일시 과부하·내부 오류
 *  - APIConnectionTimeoutError: 요청이 SDK 타임아웃 안에 끝나지 못함
 *  - APIConnectionError: 네트워크 단절·DNS·소켓 등 연결 실패
 *
 * 주의(SDK 에러 클래스 실측): 이 버전의 @anthropic-ai/sdk에는 `APITimeoutError`가
 * 존재하지 않는다. 타임아웃은 `APIConnectionTimeoutError`이며 이는
 * `APIConnectionError`의 서브클래스다. 따라서 `APIConnectionError` 검사만으로도
 * 타임아웃이 함께 잡히지만, 의도를 코드에 드러내기 위해 둘 다 명시한다.
 */
function isFallbackError(err: unknown): boolean {
  return (
    err instanceof Anthropic.RateLimitError ||
    err instanceof Anthropic.InternalServerError ||
    err instanceof Anthropic.APIConnectionTimeoutError ||
    err instanceof Anthropic.APIConnectionError
  );
}

/**
 * Opus 우선 호출, 일시적 장애(레이트리밋·과부하·타임아웃·연결오류) 시 Haiku 폴백.
 * 라이브 데모 발표 안전망 (v3 critic 수술 4).
 */
export async function callWithFallback(
  primary: ModelId,
  fallback: ModelId,
  params: Omit<Anthropic.MessageCreateParamsNonStreaming, 'model'>,
): Promise<Anthropic.Message> {
  if (!anthropic) {
    throw new Error('Anthropic 클라이언트 미초기화 (mock 모드)');
  }
  try {
    return await anthropic.messages.create({ ...params, model: MODEL_IDS[primary] });
  } catch (err) {
    if (isFallbackError(err)) {
      return anthropic.messages.create({ ...params, model: MODEL_IDS[fallback] });
    }
    throw err;
  }
}
