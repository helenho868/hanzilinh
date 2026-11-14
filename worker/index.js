/*
 * HanziLinh – Cloudflare Worker
 * - Trang tĩnh (HTML, CSS, JS, dữ liệu học miễn phí) do Workers Static Assets phục vụ, kèm header trong file _headers.
 * - Chỉ đường dẫn /api/* chạy qua mã này (cấu hình "run_worker_first" trong wrangler.jsonc).
 *
 * API Bài tập tiếng Anh
 *   POST /api/baitap/unlock   body {"key": "..."}           → {"token": "...", "list": [...]}
 *   POST /api/baitap/module   body {"token": "...", "id": "..."} → {"module": {...}}
 *
 * Biến môi trường cần có trên Cloudflare (Settings → Variables and Secrets):
 *   ACCESS_KEY  (Secret)  key mở bài tập. Đổi key = mọi phiên cũ tự hết hạn.
 * Liên kết (bindings) khai báo trong wrangler.jsonc:
 *   BAITAP      Workers KV, khóa "baitap:v1" chứa {"list":[...], "modules":{"<id>":{...}}}
 *   LIMITER     Rate Limiting, giới hạn số lần thử key theo địa chỉ IP
 */

const ALLOWED_ORIGINS = new Set(["https://hanzilinh.com", "https://www.hanzilinh.com"]);
const TOKEN_TTL = 2 * 60 * 60; // giây: phiên mở bài tập dùng được 2 giờ
const MAX_BODY = 2048; // byte: chặn yêu cầu lớn bất thường
const KV_KEY = "baitap:v1";
const enc = new TextEncoder();

/* Thông báo chung, không tiết lộ lý do cụ thể để kẻ tấn công không dò được. */
const MSG_FAIL = "Không mở được bài tập. Vui lòng kiểm tra key và thử lại.";
const MSG_BUSY = "Bạn thử quá nhiều lần. Vui lòng đợi một phút rồi thử lại.";
const MSG_ERR = "Có lỗi xảy ra. Vui lòng thử lại sau.";

function securityHeaders(origin) {
  const h = {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'",
    "Vary": "Origin"
  };
  if (origin) {
    h["Access-Control-Allow-Origin"] = origin;
    h["Access-Control-Allow-Methods"] = "POST";
    h["Access-Control-Allow-Headers"] = "Content-Type";
    h["Access-Control-Max-Age"] = "600";
  }
  return h;
}

function json(data, status, origin) {
  return new Response(JSON.stringify(data), { status, headers: securityHeaders(origin) });
}

function b64url(bytes) {
  let s = "";
  const u = new Uint8Array(bytes);
  for (let i = 0; i < u.length; i++) s += String.fromCharCode(u[i]);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/* So sánh hai chuỗi trong thời gian không đổi (chống đo thời gian để đoán key). */
async function sameSecret(a, b) {
  const [ha, hb] = await Promise.all([
    crypto.subtle.digest("SHA-256", enc.encode(String(a))),
    crypto.subtle.digest("SHA-256", enc.encode(String(b)))
  ]);
  return crypto.subtle.timingSafeEqual(ha, hb);
}

/* Phiên = "<hết hạn>.<chữ ký HMAC>", ký bằng ACCESS_KEY. Đổi ACCESS_KEY thì mọi phiên cũ mất hiệu lực. */
async function hmacKey(env) {
  return crypto.subtle.importKey("raw", enc.encode("hanzilinh-token|" + env.ACCESS_KEY), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}
async function makeToken(env) {
  const exp = Math.floor(Date.now() / 1000) + TOKEN_TTL;
  const sig = await crypto.subtle.sign("HMAC", await hmacKey(env), enc.encode("v1." + exp));
  return "v1." + exp + "." + b64url(sig);
}
async function checkToken(env, token) {
  if (typeof token !== "string" || token.length > 200) return false;
  const m = /^v1\.(\d{10})\.([A-Za-z0-9_-]{43})$/.exec(token);
  if (!m) return false;
  if (Number(m[1]) < Math.floor(Date.now() / 1000)) return false;
  const sig = await crypto.subtle.sign("HMAC", await hmacKey(env), enc.encode("v1." + m[1]));
  return sameSecret(b64url(sig), m[2]);
}

async function readBody(request) {
  const type = request.headers.get("Content-Type") || "";
  if (!type.toLowerCase().startsWith("application/json")) return null;
  const len = Number(request.headers.get("Content-Length") || "0");
  if (len > MAX_BODY) return null;
  const text = await request.text();
  if (text.length > MAX_BODY) return null;
  try {
    const v = JSON.parse(text);
    return v && typeof v === "object" && !Array.isArray(v) ? v : null;
  } catch (e) {
    return null;
  }
}

async function loadData(env) {
  if (!env.BAITAP) return null;
  return env.BAITAP.get(KV_KEY, { type: "json", cacheTtl: 300 });
}

async function limited(env, request, bucket) {
  if (!env.LIMITER) return false;
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const { success } = await env.LIMITER.limit({ key: bucket + ":" + ip });
  return !success;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function originOk(origin, env) {
  if (!origin) return false;
  if (ALLOWED_ORIGINS.has(origin)) return true;
  return !!env.DEV_ORIGIN && origin === env.DEV_ORIGIN; // chỉ dùng khi chạy thử trên máy (file .dev.vars)
}

async function handleApi(request, env, url) {
  const origin = request.headers.get("Origin");

  // Chỉ chấp nhận yêu cầu từ chính hanzilinh.com (trình duyệt luôn gửi Origin với POST).
  if (!originOk(origin, env)) return json({ error: MSG_FAIL }, 403, null);
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: securityHeaders(origin) });
  if (request.method !== "POST") return json({ error: MSG_FAIL }, 405, origin);
  if (!env.ACCESS_KEY || String(env.ACCESS_KEY).length < 8) return json({ error: MSG_ERR }, 503, origin);

  const body = await readBody(request);
  if (!body) return json({ error: MSG_FAIL }, 400, origin);

  if (url.pathname === "/api/baitap/unlock") {
    if (await limited(env, request, "unlock")) return json({ error: MSG_BUSY }, 429, origin);
    const key = typeof body.key === "string" ? body.key.trim() : "";
    const ok = key.length >= 1 && key.length <= 128 && (await sameSecret(key, env.ACCESS_KEY));
    if (!ok) {
      await sleep(400 + Math.floor(Math.random() * 300)); // làm chậm việc dò key
      return json({ error: MSG_FAIL }, 401, origin);
    }
    const data = await loadData(env);
    if (!data || !Array.isArray(data.list)) return json({ error: MSG_ERR }, 503, origin);
    return json({ token: await makeToken(env), list: data.list }, 200, origin);
  }

  if (url.pathname === "/api/baitap/module") {
    if (await limited(env, request, "module")) return json({ error: MSG_BUSY }, 429, origin);
    if (!(await checkToken(env, body.token))) return json({ error: MSG_FAIL, expired: true }, 401, origin);
    const id = typeof body.id === "string" ? body.id : "";
    if (!/^[a-z0-9-]{1,64}$/.test(id)) return json({ error: MSG_FAIL }, 400, origin);
    const data = await loadData(env);
    const mod = data && data.modules && Object.prototype.hasOwnProperty.call(data.modules, id) ? data.modules[id] : null;
    if (!mod) return json({ error: MSG_FAIL }, 404, origin);
    return json({ module: mod }, 200, origin);
  }

  return json({ error: MSG_FAIL }, 404, origin);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/")) {
      try {
        return await handleApi(request, env, url);
      } catch (e) {
        return json({ error: MSG_ERR }, 500, null);
      }
    }
    return env.ASSETS.fetch(request);
  }
};
