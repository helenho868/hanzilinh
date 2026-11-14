/* Sao lưu / khôi phục tiến độ học (localStorage) để chuyển giữa điện thoại và máy tính.
   Mã sao lưu = "HZL1." + Base64 của JSON {v:1, t:<thời điểm>, d:{<khóa>: <giá trị chuỗi>}}.
   Khi khôi phục, mọi dữ liệu đều được kiểm tra theo đúng kiểu của từng khóa; dữ liệu lạ bị bỏ qua. */
(function () {
  var PREFIX = "HZL1.";
  var MAX_CODE = 50 * 1024;          // giới hạn độ dài mã sao lưu (ký tự)
  var MAX_VALUE = 40 * 1024;         // giới hạn một giá trị
  var BAD_KEYS = { "__proto__": 1, "constructor": 1, "prototype": 1 };
  var PAGES = ["vocab.html", "quiz.html", "fill.html", "drag.html", "dialogue.html", "reading.html", "exam.html",
    "bothu.html", "hat.html", "thanhngu.html", "cautruc.html", "nghenoi.html", "baitap.html"];

  /* ---- Các kiểu dữ liệu hợp lệ ---- */
  function isNum(x, min, max) { return typeof x === "number" && isFinite(x) && x >= min && x <= max; }
  function isStr(x, max) { return typeof x === "string" && x.length <= max && !/[\u0000-\u001f\u007f<>]/.test(x); }
  function plain(o) { return o !== null && typeof o === "object" && !Array.isArray(o) && Object.getPrototypeOf(o) === Object.prototype; }
  function okKey(k) { return typeof k === "string" && !BAD_KEYS[k] && k.length <= 80 && !/[\u0000-\u001f\u007f<>]/.test(k); }
  /* Chỉ giữ các trường cho phép, mỗi trường đúng kiểu; trả null nếu thiếu trường bắt buộc. */
  function pick(o, spec, required) {
    if (!plain(o)) return null;
    var out = {};
    for (var f in spec) {
      if (!Object.prototype.hasOwnProperty.call(o, f)) continue;
      if (spec[f](o[f])) out[f] = o[f];
    }
    for (var i = 0; i < (required || []).length; i++) if (!(required[i] in out)) return null;
    return out;
  }
  var N = function (min, max) { return function (x) { return isNum(x, min, max); }; };
  var S = function (max) { return function (x) { return isStr(x, max); }; };
  var B = function (x) { return typeof x === "boolean"; };

  /* Danh sách từ đã thuộc: mảng chuỗi (chữ Hán, có thể kèm "#nghĩa"). */
  function wordList(v) {
    if (!Array.isArray(v) || v.length > 12000) return null;
    var out = [], seen = {};
    for (var i = 0; i < v.length; i++) {
      if (!okKey(v[i]) || seen[v[i]]) continue;
      seen[v[i]] = 1; out.push(v[i]);
    }
    return out;
  }
  /* Đối tượng ánh xạ id → giá trị (điểm đọc hiểu, bộ thủ đã thuộc...). */
  function map(v, valueOk, max) {
    if (!plain(v)) return null;
    var out = {}, n = 0;
    for (var k in v) {
      if (!Object.prototype.hasOwnProperty.call(v, k) || !okKey(k)) continue;
      var x = valueOk(v[k]); if (x === undefined) continue;
      out[k] = x; if (++n > (max || 2000)) break;
    }
    return out;
  }
  var score = { pct: N(0, 100), score: N(0, 1e4), total: N(0, 1e4), secs: N(0, 1e7) };
  var exam = { pct: N(0, 100), r: N(0, 1e4), t: N(0, 1e4), best: N(0, 100), n: N(0, 1e6) };
  /* Trang "Học tiếp": chỉ nhận đường dẫn tới đúng các trang của HanziLinh, tham số an toàn. */
  function safeUrl(u) {
    if (typeof u !== "string" || u.length > 200) return false;
    var m = /^([a-z]+\.html)(\?[A-Za-z0-9=&_-]*)?$/.exec(u);
    return !!m && PAGES.indexOf(m[1]) >= 0;
  }

  /* Mỗi mẫu khóa: kiểu JSON (json: hàm kiểm tra → giá trị sạch hoặc null) hoặc chuỗi thô (raw). */
  var RULES = [
    { re: /^hanzilinh_known_(hsk[1-9](_v3)?|yct[1-4])$/, json: wordList },
    { re: /^hanzilinh_(best|fillbest|dragbest)_(hsk[1-9](_v3)?|yct[1-4])$/, json: function (v) { return pick(v, score, ["pct"]); } },
    { re: /^hanzilinh_exambest_(hsk|yct)[1-9]$/, json: function (v) { return pick(v, exam, ["pct"]); } },
    { re: /^hanzilinh_examtest_(hsk|yct)[1-9]_([1-9]|10)$/, json: function (v) { return pick(v, exam, ["pct"]); } },
    { re: /^hanzilinh_lastword_(hsk[1-9](_v3)?|yct[1-4])$/, json: function (v) { return pick(v, { k: S(80), h: S(40), p: S(80), i: N(0, 2e4), n: N(0, 2e4), t: N(0, 1e14) }, ["h"]); } },
    { re: /^hanzilinh_readbest_(hsk|yct)[1-9](_v3)?$/, json: function (v) { return map(v, function (x) { return isNum(x, 0, 1000) ? x : undefined; }); } },
    { re: /^hanzilinh_radknown$/, json: function (v) { return map(v, function (x) { return x === true || x === 1 ? x : undefined; }, 400); } },
    { re: /^hanzilinh_radbest$/, json: function (v) { return map(v, function (x) { return isNum(x, 0, 1e4) ? x : pick(x, { score: N(0, 1e4), secs: N(0, 1e7) }, ["score"]) || undefined; }, 50); } },
    { re: /^hanzilinh_(dlg|read)_prefs$/, json: function (v) { return pick(v, { py: B, vi: B }); } },
    { re: /^hanzilinh_last$/, json: function (v) { return pick(v, { n: S(60), l: S(40), u: safeUrl, t: N(0, 1e14) }, ["n", "u"]); } },
    { re: /^hanzilinh_reveal$/, raw: function (v) { return v === "0" || v === "1"; } },
    { re: /^hanzilinh_book$/, raw: function (v) { return v === "hsk" || v === "yct" || v === "boya"; } },
    { re: /^hanzilinh_ta_best_[a-z0-9-]{1,64}$/, raw: function (v) { return /^\d{1,2}(\.\d)?$/.test(v) && parseFloat(v) <= 10; } }
  ];
  function ruleFor(k) { for (var i = 0; i < RULES.length; i++) if (RULES[i].re.test(k)) return RULES[i]; return null; }

  /* Kiểm tra một cặp khóa/giá trị; trả về chuỗi sạch để lưu, hoặc null nếu không hợp lệ. */
  function clean(k, v) {
    if (!okKey(k) || typeof v !== "string" || v.length > MAX_VALUE) return null;
    var r = ruleFor(k); if (!r) return null;
    if (r.raw) return r.raw(v) ? v : null;
    var parsed; try { parsed = JSON.parse(v); } catch (e) { return null; }
    var c = r.json(parsed);
    return c == null ? null : JSON.stringify(c);
  }

  function utf8ToB64(s) { var b = new TextEncoder().encode(s), t = ""; for (var i = 0; i < b.length; i++) t += String.fromCharCode(b[i]); return btoa(t); }
  function b64ToUtf8(s) { var t = atob(s), b = new Uint8Array(t.length); for (var i = 0; i < t.length; i++) b[i] = t.charCodeAt(i); return new TextDecoder("utf-8", { fatal: true }).decode(b); }

  /* Tạo mã sao lưu từ dữ liệu hiện có trên máy (chỉ các khóa hợp lệ). */
  function exportCode() {
    var d = {}, n = 0;
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i), v = localStorage.getItem(k), c = clean(k, v);
        if (c != null) { d[k] = c; n++; }
      }
    } catch (e) { return { code: "", count: 0 }; }
    var code = PREFIX + utf8ToB64(JSON.stringify({ v: 1, t: Date.now(), d: d }));
    return { code: code, count: n, tooBig: code.length > MAX_CODE };
  }

  /* Đọc và kiểm tra mã sao lưu. Không ghi gì nếu mã sai. */
  function parseCode(input) {
    var s = String(input || "").replace(/\s+/g, "");
    if (!s) return { error: "Bạn chưa dán mã sao lưu." };
    if (s.length > MAX_CODE) return { error: "Mã sao lưu quá dài (tối đa 50 KB)." };
    if (s.indexOf(PREFIX) !== 0 || !/^[A-Za-z0-9+/=]+$/.test(s.slice(PREFIX.length))) return { error: "Mã sao lưu không đúng định dạng của HanziLinh." };
    var obj;
    try { obj = JSON.parse(b64ToUtf8(s.slice(PREFIX.length))); } catch (e) { return { error: "Mã sao lưu bị hỏng hoặc chép thiếu." }; }
    if (!plain(obj) || obj.v !== 1 || !plain(obj.d)) return { error: "Mã sao lưu không đúng định dạng của HanziLinh." };
    var ok = {}, n = 0, skipped = 0;
    for (var k in obj.d) {
      if (!Object.prototype.hasOwnProperty.call(obj.d, k)) continue;
      var c = clean(k, obj.d[k]);
      if (c == null) { skipped++; continue; }
      ok[k] = c; n++;
    }
    if (!n) return { error: "Mã sao lưu không có dữ liệu tiến độ hợp lệ." };
    return { data: ok, count: n, skipped: skipped, time: isNum(obj.t, 0, 1e14) ? obj.t : 0 };
  }

  /* Ghi dữ liệu đã kiểm tra. Ghi đè các khóa trùng, giữ nguyên các khóa khác trên máy. */
  function apply(parsed) {
    var n = 0;
    try { for (var k in parsed.data) { localStorage.setItem(k, parsed.data[k]); n++; } } catch (e) { return { error: "Không ghi được dữ liệu (bộ nhớ trình duyệt đầy hoặc bị chặn).", written: n }; }
    return { written: n };
  }

  window.HLBackup = { exportCode: exportCode, parseCode: parseCode, apply: apply, clean: clean, safeUrl: safeUrl };
})();
