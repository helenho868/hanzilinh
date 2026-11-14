(function () {
  var $ = function (id) { return document.getElementById(id); };
  var RS = [], view = [], cur = -1, stroke = 0, query = "", mode = "hv";
  var KK = "hanzilinh_radknown", BK = "hanzilinh_radbest";
  function mk(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text) e.textContent = text; return e; }
  function load(k) { try { return JSON.parse(localStorage.getItem(k) || "{}"); } catch (e) { return {}; } }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  var known = load(KK);
  function norm(s) { return (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d"); }

  var canSpeak = !!window.speechSynthesis && typeof window.SpeechSynthesisUtterance !== "undefined";
  function speak(t) {
    if (!canSpeak) {
      var n = $("voiceNote"); n.textContent = "Trình duyệt này không hỗ trợ phát âm. Nếu bạn đang mở link trong Messenger/Zalo, hãy bấm dấu ⋯ rồi chọn “Mở bằng trình duyệt” (Chrome) để nghe.";
      n.classList.remove("hide"); return;
    }
    try {
      var u = new SpeechSynthesisUtterance(t); u.lang = "zh-CN"; u.rate = 0.8;
      var vs = speechSynthesis.getVoices() || []; for (var k = 0; k < vs.length; k++) if (/^zh/i.test(vs[k].lang)) { u.voice = vs[k]; break; }
      speechSynthesis.cancel(); speechSynthesis.speak(u);
    } catch (e) {}
  }

  /* ---- Danh sách ---- */
  function applyFilter() {
    var q = norm(query.trim());
    view = RS.filter(function (r) {
      if (stroke && r.strokes !== stroke) return false;
      if (!q) return true;
      var hay = [r.hanzi, r.trad, r.variants.join(" "), r.py, r.hv, r.vi].join(" ");
      return norm(hay).indexOf(q) >= 0;
    });
    var g = $("grid"); g.replaceChildren();
    view.forEach(function (r, i) {
      var li = mk("li"), b = mk("button", "rcard" + (known[r.n] ? " known" : "")); b.type = "button";
      b.appendChild(mk("span", "c", r.hanzi)); b.appendChild(mk("span", "h", r.hv)); b.appendChild(mk("span", "p", r.py));
      b.onclick = function () { openDetail(i); };
      li.appendChild(b); g.appendChild(li);
    });
    var kc = Object.keys(known).length;
    $("count").textContent = view.length + " / " + RS.length + " bộ thủ. Đã nhớ " + kc + ".";
  }
  function buildChips() {
    var sel = $("strokeSel"), cnt = {};
    RS.forEach(function (r) { cnt[r.strokes] = (cnt[r.strokes] || 0) + 1; });
    sel.replaceChildren();
    var o0 = mk("option", "", "Tất cả số nét (" + RS.length + " bộ)"); o0.value = "0"; sel.appendChild(o0);
    Object.keys(cnt).map(Number).sort(function (x, y) { return x - y; }).forEach(function (n) {
      var o = mk("option", "", n + " nét (" + cnt[n] + " bộ)"); o.value = String(n); sel.appendChild(o);
    });
    sel.onchange = function () { stroke = parseInt(sel.value, 10) || 0; applyFilter(); };
  }

  /* ---- Chi tiết ---- */
  function openDetail(i) {
    cur = i; var r = view[i];
    $("dCh").textContent = r.hanzi; $("dPy").textContent = r.py; $("dHv").textContent = "Hán Việt: " + r.hv;
    $("dVi").textContent = "Nghĩa: " + r.vi;
    var m = ["Bộ số " + r.n, r.strokes + " nét"];
    if (r.trad) m.push("dạng phồn thể: " + r.trad);
    if (r.variants.length) m.push("dạng biến thể: " + r.variants.join(" "));
    $("dMeta").textContent = m.join(" · ");
    var ul = $("dEx"); ul.replaceChildren();
    if (!r.ex.length) { ul.appendChild(mk("li", "m", "Chưa có ví dụ trong từ vựng HSK 1 đến 7–9 của trang này (bộ thủ ít gặp).")); }
    r.ex.forEach(function (e) {
      var li = mk("li"), w = mk("span", "w");
      for (var k = 0; k < e.w.length; k++) { if (k === e.i) w.appendChild(mk("b", "", e.w[k])); else w.appendChild(document.createTextNode(e.w[k])); }
      li.appendChild(w); li.appendChild(mk("span", "p", e.py)); li.appendChild(mk("span", "m", e.vi + " (HSK " + (e.lv === 7 ? "7–9" : e.lv) + ")"));
      var s = mk("button", "say", "Nghe"); s.type = "button"; s.setAttribute("aria-label", "Nghe " + e.w); s.onclick = function () { speak(e.w); };
      li.appendChild(s); ul.appendChild(li);
    });
    $("voiceNote").classList.add("hide");
    var kb = $("dKnown"); kb.setAttribute("aria-pressed", known[r.n] ? "true" : "false"); kb.textContent = known[r.n] ? "Đã nhớ (bấm để bỏ)" : "Đánh dấu đã nhớ";
    $("dPrev").disabled = i === 0; $("dNext").disabled = i === view.length - 1;
    if (!$("dlg").open) { if ($("dlg").showModal) $("dlg").showModal(); else $("dlg").setAttribute("open", ""); }
  }
  $("dClose").onclick = function () { try { speechSynthesis.cancel(); } catch (e) {} $("dlg").close(); };
  $("dPrev").onclick = function () { if (cur > 0) openDetail(cur - 1); };
  $("dNext").onclick = function () { if (cur < view.length - 1) openDetail(cur + 1); };
  $("dKnown").onclick = function () {
    var r = view[cur]; if (known[r.n]) delete known[r.n]; else known[r.n] = 1;
    save(KK, known); openDetail(cur); applyFilter();
  };
  $("q").oninput = function () { query = this.value; applyFilter(); };

  /* ---- Tabs ---- */
  function tab(n) {
    $("t1").setAttribute("aria-selected", n === 1); $("t2").setAttribute("aria-selected", n === 2);
    $("p1").classList.toggle("hide", n !== 1); $("p2").classList.toggle("hide", n !== 2);
  }
  $("t1").onclick = function () { tab(1); }; $("t2").onclick = function () { tab(2); };

  /* ---- Kiểm tra ---- */
  var qs = [], qi = 0, qsc = 0, perQ = 0, endAt = 0, startAt = 0, timerId = null, finished = false;
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function bk() { return mode + (perQ ? "_t" + perQ : ""); }
  function fmt(s) { s = Math.max(0, s); var m = Math.floor(s / 60), r = s % 60; return m + ":" + (r < 10 ? "0" : "") + r; }
  function showBest() {
    var b = load(BK)[bk()];
    if (b && typeof b === "object") $("qBest").textContent = "Điểm cao nhất: " + b.score + "/10, thời gian " + fmt(b.secs) + ".";
    else if (typeof b === "number") $("qBest").textContent = "Điểm cao nhất: " + b + "/10.";
    else $("qBest").textContent = "Chưa có điểm. Mỗi lần làm 10 bộ thủ ngẫu nhiên.";
  }
  function stopTimer() { if (timerId) { clearInterval(timerId); timerId = null; } $("qTimer").classList.add("hide"); }
  function tick() {
    var left = Math.ceil((endAt - Date.now()) / 1000), t = $("qTimer");
    t.textContent = "⏱ " + fmt(left); t.classList.toggle("low", left <= 15);
    if (left <= 0) finish(true);
  }
  document.querySelectorAll("#qTime .chip").forEach(function (b) {
    b.onclick = function () {
      document.querySelectorAll("#qTime .chip").forEach(function (x) { x.setAttribute("aria-pressed", "false"); });
      b.setAttribute("aria-pressed", "true"); perQ = parseInt(b.getAttribute("data-t"), 10) || 0; showBest();
    };
  });
  document.querySelectorAll("#qMode .chip").forEach(function (b) {
    b.onclick = function () {
      document.querySelectorAll("#qMode .chip").forEach(function (x) { x.setAttribute("aria-pressed", "false"); });
      b.setAttribute("aria-pressed", "true"); mode = b.getAttribute("data-m"); showBest();
    };
  });
  function field(r) { return mode === "hv" ? r.hv : r.vi; }
  function ask() {
    var r = qs[qi];
    $("qNo").textContent = "Câu " + (qi + 1) + "/10"; $("qScore").textContent = "Đúng " + qsc;
    $("qCh").textContent = r.hanzi;
    $("qAsk").textContent = mode === "hv" ? "Tên Hán Việt của bộ thủ này là gì?" : "Bộ thủ này có nghĩa là gì?";
    var opts = [r], pool = shuffle(RS.filter(function (x) { return x.n !== r.n && field(x) !== field(r); }));
    for (var k = 0; opts.length < 4 && k < pool.length; k++) if (!opts.some(function (o) { return field(o) === field(pool[k]); })) opts.push(pool[k]);
    shuffle(opts);
    var box = $("qOpts"); box.replaceChildren(); $("qFb").classList.add("hide"); $("qNext").classList.add("hide");
    var done = false, btns = [];
    opts.forEach(function (o) {
      var b = mk("button", "qopt", field(o)); b.type = "button"; btns.push(b);
      b.onclick = function () {
        if (done) return; done = true;
        btns.forEach(function (x, ix) { if (opts[ix].n === r.n) x.classList.add("ok"); });
        if (o.n === r.n) qsc++; else b.classList.add("no");
        $("qScore").textContent = "Đúng " + qsc;
        $("qFb").textContent = (o.n === r.n ? "Đúng. " : "Chưa đúng. ") + r.hanzi + " (" + r.py + "): " + r.hv + ", " + r.vi + ".";
        $("qFb").classList.remove("hide");
        $("qNext").textContent = qi === 9 ? "Xem kết quả" : "Câu tiếp theo"; $("qNext").classList.remove("hide");
      };
      box.appendChild(b);
    });
  }
  function finish(timeout) {
    if (finished) return; finished = true; stopTimer();
    var secs = Math.round((Date.now() - startAt) / 1000);
    if (perQ) secs = Math.min(secs, perQ * 10);
    $("qPlay").classList.add("hide"); $("qEnd").classList.remove("hide");
    var b = load(BK), key = bk(), old = b[key], oldScore = old && typeof old === "object" ? old.score : old;
    var oldSecs = old && typeof old === "object" ? old.secs : 1e9;
    if (!(oldScore > qsc) && !(oldScore === qsc && oldSecs <= secs)) { b[key] = { score: qsc, secs: secs }; save(BK, b); }
    $("qRes").textContent = (timeout ? "Hết giờ. " : "") + "Bạn đúng " + qsc + "/10 câu, thời gian " + fmt(secs) + "." + (qsc === 10 ? " Rất tốt!" : " Hãy xem lại các bộ thủ trong danh sách rồi thử lại.");
  }
  $("qStart").onclick = function () {
    qs = shuffle(RS.slice()).slice(0, 10); qi = 0; qsc = 0; finished = false; startAt = Date.now(); stopTimer();
    if (perQ) { endAt = startAt + perQ * 10 * 1000; $("qTimer").classList.remove("hide"); tick(); timerId = setInterval(tick, 250); }
    $("qSetup").classList.add("hide"); $("qEnd").classList.add("hide"); $("qPlay").classList.remove("hide"); ask();
  };
  $("qNext").onclick = function () { if (qi === 9) finish(false); else { qi++; ask(); } };
  $("qAgain").onclick = function () { $("qEnd").classList.add("hide"); $("qSetup").classList.remove("hide"); showBest(); };

  fetch("data/radicals.json").then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }).then(function (d) {
    RS = d.radicals; $("info").textContent = "214 bộ thủ Khang Hy, kèm tên Hán Việt, nghĩa và ví dụ lấy từ từ vựng HSK. Bấm vào một bộ để xem chi tiết.";
    buildChips(); applyFilter(); showBest();
  }).catch(function () { $("info").textContent = "Không tải được dữ liệu bộ thủ. Hãy thử tải lại trang."; });
})();
