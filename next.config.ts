import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

/** Origins the browser may talk to: the API, its Socket.IO gateway (http + ws) and Google sign-in. */
function originOf(value: string | undefined) {
  try {
    return value ? new URL(value).origin : null;
  } catch {
    return null;
  }
}
const apiOrigin = originOf(process.env.NEXT_PUBLIC_API_BASE_URL);
const socketOrigin = originOf(process.env.NEXT_PUBLIC_SOCKET_URL) ?? apiOrigin;
const wsOrigin = socketOrigin?.replace(/^http/, "ws") ?? null;
const google = "https://accounts.google.com";
const secureApi = !apiOrigin || apiOrigin.startsWith("https://");

/**
 * Content Security Policy without nonces (nonces don't work with partial prerendering): scripts
 * only from this site and Google sign-in, requests only to the API and Google, member photos and
 * voice notes from https storage. `'unsafe-eval'` is for React's dev tooling only.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} ${google}/gsi/client`,
  `style-src 'self' 'unsafe-inline' ${google}/gsi/style`,
  "img-src 'self' blob: data: https:",
  "media-src 'self' blob: https:",
  "font-src 'self'",
  ["connect-src 'self'", apiOrigin, socketOrigin, wsOrigin, `${google}/gsi/`].filter(Boolean).join(" "),
  `frame-src ${google}/gsi/`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(secureApi && !isDev ? ["upgrade-insecure-requests"] : []),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // The camera (selfie), microphone (voice notes) and location (onboarding) are used by this site only.
  { key: "Permissions-Policy", value: "camera=(self), microphone=(self), geolocation=(self), payment=(), usb=()" },
  // Google's sign-in popup must be able to report back.
  { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
];

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    agentFeedback: true,
  },
  poweredByHeader: false,
  cacheComponents: true,
  partialPrefetching: true,
  reactCompiler: true,
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
