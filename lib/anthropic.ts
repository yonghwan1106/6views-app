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
 * citations 활성화 + ephemeral 캐싱(동일 문서 6회 재사용 시 ~80% 비용 절감).
 */
export function buildDocumentBlock(doc: {
  title: string;
  content: string;
  source?: string;
}): Anthropic.Messages.DocumentBlockParam {
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
    cache_control: { type: 'ephemeral' },
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
 * Opus 우선 호출, RateLimit/Overload 시 Haiku 폴백.
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
    if (
      err instanceof Anthropic.RateLimitError ||
      err instanceof Anthropic.InternalServerError
    ) {
      return anthropic.messages.create({ ...params, model: MODEL_IDS[fallback] });
    }
    throw err;
  }
}
