/** @type {import('next').NextConfig} */
const securityHeaders = [
  // Block clickjacking
  { key: "X-Frame-Options", value: "DENY" },
  // Disable MIME-type sniffing
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Tight referrer policy
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Limit dangerous browser APIs
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
  // HSTS (Vercel sets a similar one but we add it for completeness)
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  // Conservative CSP — uses Next.js inline runtime so 'unsafe-inline' is required for now
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
    ].join("; "),
  },
];

const nextConfig = {
  // Hide framework identifier (defense in depth; avoid fingerprinting).
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
