(function () {
  var $ = function (i) { return document.getElementById(i); };
  var BEST = "hanzilinh_ta_best_";
  var mod = null, submitted = false;
  function mk(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
  // chỉ cho phép thẻ <u> trong nội dung đề
  function rich(el, s) {
    String(s).split(/(<u>|<\/u>)/).reduce(function (cur, part) {
      if (part === "<u>") { var u = document.createElement("u"); el.appendChild(u); return u; }
      if (part === "</u>") return el;
      if (part) cur.appendChild(document.createTextNode(part)); return cur;
    }, el);
  }
  /* Gọi API trên máy chủ Cloudflare. Key chỉ gửi một lần khi mở khóa; sau đó dùng phiên (token) có hạn 2 giờ.
     Không lưu key trên máy. Phiên lưu trong sessionStorage, tự mất khi đóng tab. */
  var TK = "hanzilinh_ta_tok", token = "", list = [];
  function ss(f) { try { return f(); } catch (e) { return null; } }
  function api(path, payload) {
    var ctl = typeof AbortController !== "undefined" ? new AbortController() : null;
    var t = ctl ? setTimeout(function () { ctl.abort(); }, 15000) : 0;
    return fetch("/api/baitap/" + path, {
      method: "POST", credentials: "same-origin", cache: "no-store",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload), signal: ctl ? ctl.signal : undefined
    }).then(function (r) {
      clearTimeout(t);
      return r.json().catch(function () { return {}; }).then(function (j) { return { ok: r.ok, status: r.status, data: j || {} }; });
    }, function () { clearTimeout(t); return { ok: false, status: 0, data: {} }; });
  }
  function errText(res) {
    if (res.status === 429) return "Bạn thử quá nhiều lần. Vui lòng đợi một phút rồi thử lại.";
    if (res.status === 401 || res.status === 400 || res.status === 403) return "Key không đúng. Vui lòng kiểm tra lại.";
    if (res.status === 0) return "Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.";
    return "Có lỗi xảy ra. Vui lòng thử lại sau.";
  }
  function busy(on, msg) {
    var btn = $("unlockBtn"); btn.disabled = on; btn.textContent = on ? "Đang mở..." : "Mở khóa";
    $("lock").setAttribute("aria-busy", on ? "true" : "false");
    if (msg != null) $("lockErr").textContent = msg;
  }
  function backToLock(msg) {
    token = ""; mod = null; list = []; ss(function () { sessionStorage.removeItem(TK); sessionStorage.removeItem("hanzilinh_ta_key"); });
    $("list").classList.add("hide"); $("run").classList.add("hide"); $("lock").classList.remove("hide");
    $("key").value = ""; $("lockErr").textContent = msg || ""; $("key").focus();
  }

  function unlock(k) {
    if (!k) { $("lockErr").textContent = "Vui lòng nhập key."; return; }
    busy(true, "");
    api("unlock", { key: k }).then(function (res) {
      busy(false);
      if (!res.ok || typeof res.data.token !== "string" || !Array.isArray(res.data.list)) { $("lockErr").textContent = errText(res); return; }
      token = res.data.token; list = res.data.list;
      ss(function () { sessionStorage.setItem(TK, JSON.stringify({ t: token, l: list })); });
      $("key").value = "";
      showList(list);
    });
  }
  function showList(l) {
    $("lock").classList.add("hide"); $("run").classList.add("hide"); $("list").classList.remove("hide");
    $("listErr").textContent = "";
    var ul = $("mods"); ul.replaceChildren();
    l.forEach(function (m) {
      if (!m || typeof m.id !== "string") return;
      var li = mk("li"), b = mk("button", "mod"); b.type = "button";
      b.appendChild(mk("b", "", String(m.title || "")));
      b.appendChild(mk("span", "", String(m.desc || "") + " (" + (Number(m.n) || 0) + " câu tính điểm)"));
      var best = ss(function () { return localStorage.getItem(BEST + m.id); });
      if (best && /^\d+(\.\d+)?$/.test(best)) b.appendChild(mk("span", "best", "Điểm cao nhất: " + best));
      b.addEventListener("click", function () { start(m, b); });
      li.appendChild(b); ul.appendChild(li);
    });
    window.scrollTo(0, 0);
  }
  function start(m, btn) {
    btn.disabled = true; btn.setAttribute("aria-busy", "true"); $("listErr").textContent = "Đang tải bài...";
    api("module", { token: token, id: m.id }).then(function (res) {
      btn.disabled = false; btn.removeAttribute("aria-busy");
      if (res.status === 401) { backToLock("Phiên đã hết hạn. Vui lòng nhập lại key."); return; }
      if (!res.ok || !res.data.module || !Array.isArray(res.data.module.sections)) { $("listErr").textContent = errText(res); return; }
      $("listErr").textContent = "";
      mod = res.data.module; submitted = false; render();
      $("list").classList.add("hide"); $("run").classList.remove("hide"); window.scrollTo(0, 0);
    });
  }
  function norm(s) { return String(s).toLowerCase().replace(/[’‘`]/g, "'").replace(/[^a-z0-9' ]+/g, " ").replace(/\s+/g, " ").trim(); }
  function items() { var a = []; mod.sections.forEach(function (s) { s.items.forEach(function (i) { a.push(i); }); }); return a; }
  function kind(i) { return i.o ? "mc" : (i.a === "T" || i.a === "F") ? "tf" : "tx"; }
  function render() {
    var box = $("run"); box.textContent = "";
    box.appendChild(mk("h2", "", mod.title));
    var sc = mk("div", "score hide"); sc.id = "score"; box.appendChild(sc);
    mod.sections.forEach(function (s) {
      var sec = mk("div", "sec");
      sec.appendChild(mk("h2", "", s.t));
      if (s.instr) sec.appendChild(mk("p", "ins", s.instr));
      if (s.dict) sec.appendChild(mk("div", "dict", s.dict));
      if (s.passage) sec.appendChild(mk("div", "passage", s.passage));
      s.items.forEach(function (i) {
        var q = mk("div", "q"); i._el = q;
        var qt = mk("p", "qt"); qt.appendChild(mk("b", "", "Câu " + i.n + ".")); rich(qt, i.q); q.appendChild(qt);
        if (i.imgNote) q.appendChild(mk("p", "cap", i.imgNote));
        var k = kind(i);
        if (k === "mc") i.o.forEach(function (o, n) {
          var l = mk("label", "opt"), r = document.createElement("input"); r.type = "radio"; r.name = "q" + i.n; r.value = n;
          r.addEventListener("change", count); l.appendChild(r); var t = mk("span"); t.appendChild(mk("b", "", "ABCD"[n] + ". ")); rich(t, o); l.appendChild(t); q.appendChild(l); l._n = n;
        });
        else if (k === "tf") ["T", "F"].forEach(function (v) {
          var l = mk("label", "opt"), r = document.createElement("input"); r.type = "radio"; r.name = "q" + i.n; r.value = v; r.addEventListener("change", count);
          l.appendChild(r); l.appendChild(mk("span", "", v === "T" ? "True" : "False")); q.appendChild(l); l._n = v;
        });
        else if (i.a !== null) {
          var t = document.createElement("input"); t.type = "text"; t.autocomplete = "off"; t.autocapitalize = "off"; t.spellcheck = false; t.name = "q" + i.n; t.setAttribute("aria-label", "Câu " + i.n); t.addEventListener("input", count); q.appendChild(t);
        }
        sec.appendChild(q);
      });
      box.appendChild(sec);
    });
    var bar = mk("div", "bar"); var cnt = mk("span", "cnt"); cnt.id = "cnt"; bar.appendChild(cnt);
    var sub = mk("button", "btn", "Nộp bài"); sub.type = "button"; sub.id = "submit"; sub.addEventListener("click", submit); bar.appendChild(sub);
    var back = mk("button", "btn2", "Về danh sách"); back.type = "button"; back.addEventListener("click", function () { $("run").classList.add("hide"); $("list").classList.remove("hide"); showList(list); }); bar.appendChild(back);
    box.appendChild(bar); count();
  }
  function val(i) {
    var q = i._el; if (i.a === null) return null;
    if (kind(i) === "tx") return q.querySelector("input[type=text]").value.trim();
    var c = q.querySelector("input:checked"); return c ? c.value : "";
  }
  function count() { if (submitted) return; var d = 0, t = 0; items().forEach(function (i) { if (i.a === null) return; t++; if (val(i)) d++; }); $("cnt").textContent = "Đã trả lời " + d + "/" + t; }
  function isRight(i, v) {
    var k = kind(i);
    if (k === "mc") return String(v) === String(i.a);
    if (k === "tf") return v === i.a;
    var n = norm(v); return i.a.some(function (a) { return norm(a) === n; });
  }
  function ansText(i) {
    var k = kind(i);
    if (k === "mc") return "ABCD"[i.a] + ". " + i.o[i.a].replace(/<\/?u>/g, "");
    if (k === "tf") return i.a === "T" ? "True" : "False";
    return i.a[0];
  }
  function submit() {
    var all = items(), un = all.filter(function (i) { return i.a !== null && !val(i); }).length;
    if (un && !confirm("Còn " + un + " câu chưa trả lời. Bạn vẫn muốn nộp bài?")) return;
    submitted = true; var ok = 0, tot = 0;
    all.forEach(function (i) {
      var q = i._el, fb = mk("div", "fb");
      if (i.a === null) { fb.appendChild(mk("span", "tag", "Không tính điểm. ")); fb.appendChild(document.createTextNode(i.e)); q.appendChild(fb); return; }
      tot++; var v = val(i), good = v !== "" && isRight(i, v);
      if (good) ok++;
      q.classList.add(good ? "ok" : "bad"); fb.classList.add(good ? "good" : "bad");
      var k = kind(i);
      q.querySelectorAll("input").forEach(function (x) { x.disabled = true; });
      if (k !== "tx") q.querySelectorAll("label.opt").forEach(function (l) {
        if (String(l._n) === String(i.a)) l.classList.add("right"); else if (String(l._n) === String(v)) l.classList.add("wrong");
      });
      if (good) {
        fb.appendChild(mk("span", "tag", "Đúng."));
        var d = mk("details"); d.appendChild(mk("summary", "", "Xem giải thích")); d.appendChild(mk("div", "", i.e)); fb.appendChild(d);
      } else {
        fb.appendChild(mk("span", "tag", v ? "Chưa đúng. " : "Chưa trả lời. "));
        fb.appendChild(document.createTextNode("Đáp án đúng: " + ansText(i) + ". "));
        fb.appendChild(mk("div", "", "Giải thích: " + i.e));
      }
      q.appendChild(fb);
    });
    var s10 = tot ? Math.round(ok / tot * 100) / 10 : 0, sc = $("score");
    sc.classList.remove("hide"); sc.textContent = "";
    sc.appendChild(mk("div", "big", ok + "/" + tot + " câu đúng"));
    sc.appendChild(mk("div", "", "Điểm quy đổi (thang 10): " + s10));
    sc.appendChild(mk("div", "", "Kéo xuống để xem từng câu: câu sai có đáp án và lời giải thích."));
    var prev = ss(function () { return parseFloat(localStorage.getItem(BEST + mod.id)); });
    if (isNaN(prev) || ok / tot * 10 > prev) ss(function () { localStorage.setItem(BEST + mod.id, String(s10)); });
    $("submit").classList.add("hide"); $("cnt").textContent = "Đã nộp bài";
    var again = mk("button", "btn", "Làm lại"); again.type = "button"; again.addEventListener("click", function () { submitted = false; render(); window.scrollTo(0, 0); });
    $("cnt").parentNode.insertBefore(again, $("cnt").nextSibling);
    window.scrollTo(0, 0);
  }

  $("lockForm").addEventListener("submit", function (e) { e.preventDefault(); unlock($("key").value.trim()); });
  $("relock").addEventListener("click", function () { backToLock(""); });
  ss(function () { sessionStorage.removeItem("hanzilinh_ta_key"); }); /* xóa key cũ do bản trước lưu */
  var saved = ss(function () { return JSON.parse(sessionStorage.getItem(TK) || "null"); });
  if (saved && typeof saved.t === "string" && Array.isArray(saved.l)) { token = saved.t; list = saved.l; showList(list); }
})();
