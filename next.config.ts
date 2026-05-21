import type { NextConfig } from "next";

// HTTP 보안 헤더 (security 리뷰 [HIGH]).
// 모든 라우트에 클릭재킹·MIME 스니핑·정보 누출 방어 헤더를 부착한다.
const securityHeaders = [
  // 클릭재킹 방어 — 어떤 사이트도 본 앱을 iframe으로 임베드 불가
  { key: "X-Frame-Options", value: "DENY" },
  // MIME 타입 스니핑 차단
  { key: "X-Content-Type-Options", value: "nosniff" },
  // 리퍼러 최소 노출 — 외부로 경로 정보 누출 방지
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // 브라우저 기능 권한 최소화 (불필요한 센서·미디어 접근 차단)
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  // 콘텐츠 보안 정책 — XSS 완화.
  // Next.js 런타임은 인라인 스타일/스크립트를 사용하므로 'unsafe-inline' 허용.
  // connect-src는 자기 출처만 — 브라우저에서 외부 API 직접 호출 없음(서버 경유).
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self' data:",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // 전 경로 적용
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
