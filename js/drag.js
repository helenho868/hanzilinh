(function () {
  var $ = function (id) { return document.getElementById(id); };
  var KNOWN_KEY = HL.knownKey();
  var BEST_KEY = HL.bestKey().replace("_best_", "_dragbest_");
  var PAGE = 5;

  var words = [], cfg = { count: 5 };
  var pages = [], pi = 0, score = 0, wrong = [], startedAt = 0;
  var pw = [], bankOrder = [], placed = [], sel = -1, checked = false, suppressClick = false;

  function shuffle(a) {
    a = a.slice();
    for (var k = a.length - 1; k > 0; k--) { var j = Math.floor(Math.random() * (k + 1)); var t = a[k]; a[k] = a[j]; a[j] = t; }
    return a;
  }
  function getKnown() { try { return JSON.parse(localStorage.getItem(KNOWN_KEY) || "[]"); } catch (e) { return []; } }
  function getBest() { try { return JSON.parse(localStorage.getItem(BEST_KEY) || "null"); } catch (e) { return null; } }
  function setBest(v) { try { localStorage.setItem(BEST_KEY, JSON.stringify(v)); } catch (e) {} }
  function fmtTime(sec) { var m = Math.floor(sec / 60), s = sec % 60; return m + " phút " + (s < 10 ? "0" : "") + s + " giây"; }

  /* Chia các từ thành từng trang 5 từ; trong một trang không có hai từ trùng hoặc chứa nhau. */
  function build() {
    var pool = words.filter(function (w) { return w.ex && w.ex.zh && w.ex.zh.indexOf(w.hanzi) >= 0; });
    if ($("prefNew").checked) {
      var kn = getKnown();
      pool = shuffle(pool.filter(function (w) { return kn.indexOf(w.key) < 0; }))
        .concat(shuffle(pool.filter(function (w) { return kn.indexOf(w.key) >= 0; })));
    } else pool = shuffle(pool);
    var used = {}, out = [], need = cfg.count / PAGE;
    while (out.length < need) {
      var page = [];
      for (var k = 0; k < pool.length && page.length < PAGE; k++) {
        var c = pool[k];
        if (used[k]) continue;
        var clash = page.some(function (o) { return o.hanzi.indexOf(c.hanzi) >= 0 || c.hanzi.indexOf(o.hanzi) >= 0; });
        if (!clash) { page.push(c); used[k] = 1; }
      }
      if (page.length < PAGE) break;
      out.push(page);
    }
    pages = out;
  }

  function startPage() {
    pw = pages[pi]; checked = false; sel = -1;
    placed = pw.map(function () { return -1; });
    bankOrder = shuffle(pw.map(function (w, n) { return n; }));
    $("qcount").textContent = "Phần " + (pi + 1) + " / " + pages.length;
    $("qscore").textContent = "Đúng " + score;
    $("prog").style.width = (pi / pages.length * 100) + "%";
    $("fb").classList.add("hide");
    render();
    updateAct();
  }

  function isPlaced(w) { return placed.indexOf(w) >= 0; }
  function allPlaced() { return placed.every(function (x) { return x >= 0; }); }

  function updateAct() {
    var b = $("act");
    if (!checked) { b.textContent = "Kiểm tra"; b.disabled = !allPlaced(); }
    else { b.textContent = pi < pages.length - 1 ? "Phần tiếp theo" : "Xem kết quả"; b.disabled = false; }
  }

  function render() {
    var bank = $("bank"); bank.innerHTML = "";
    bankOrder.forEach(function (w) {
      if (isPlaced(w)) return;
      var b = document.createElement("button");
      b.type = "button"; b.className = "wchip" + (sel === w ? " sel" : ""); b.textContent = pw[w].hanzi;
      b.setAttribute("data-w", w); b.disabled = checked;
      bank.appendChild(b);
    });
    var box = $("items"); box.innerHTML = "";
    pw.forEach(function (word, s) {
      var d = document.createElement("div"); d.className = "item";
      var p = document.createElement("p"); p.className = "sent";
      var zh = word.ex.zh, at = zh.indexOf(word.hanzi);
      p.appendChild(document.createTextNode(zh.slice(0, at)));
      var sl = document.createElement("button"); sl.type = "button";
      sl.setAttribute("data-s", s);
      var cur = placed[s];
      sl.className = "slot" + (cur >= 0 ? " filled" : "");
      sl.textContent = cur >= 0 ? pw[cur].hanzi : " ";
      if (cur >= 0) sl.setAttribute("data-w", cur);
      sl.setAttribute("aria-label", "Chỗ trống " + (s + 1) + (cur >= 0 ? ", đang chứa " + pw[cur].hanzi : ", trống"));
      if (checked) { sl.disabled = true; sl.classList.add(cur === s ? "ok" : "no"); }
      p.appendChild(sl);
      p.appendChild(document.createTextNode(zh.slice(at + word.hanzi.length)));
      d.appendChild(p);
      var h = document.createElement("p"); h.className = "hint"; h.textContent = "Nghĩa câu: " + word.ex.vi;
      d.appendChild(h);
      if (checked) {
        var r = document.createElement("p"); r.className = "res " + (cur === s ? "ok" : "no");
        var bb = document.createElement("b"); bb.textContent = cur === s ? "Đúng. " : "Chưa đúng, đáp án là " + word.hanzi + ". ";
        r.appendChild(bb);
        r.appendChild(document.createTextNode(word.hanzi + " (" + word.pinyin + "): " + word.vi + ". " + word.ex.py));
        d.appendChild(r);
      }
      box.appendChild(d);
    });
  }

  function place(w, s) {
    var from = placed.indexOf(w);
    if (from >= 0) placed[from] = -1;
    placed[s] = w; sel = -1;
  }
  function unplace(w) { var f = placed.indexOf(w); if (f >= 0) placed[f] = -1; if (sel === w) sel = -1; }
  function changed() { render(); updateAct(); }

  /* Chạm/nhấp: chọn một từ rồi chạm vào chỗ trống; chạm vào chỗ trống đã điền để trả từ về khung. */
  $("play").addEventListener("click", function (e) {
    if (suppressClick) { suppressClick = false; return; }
    if (checked) return;
    var chip = e.target.closest(".wchip"), slot = e.target.closest(".slot");
    if (chip) { var w = +chip.getAttribute("data-w"); sel = sel === w ? -1 : w; changed(); }
    else if (slot) {
      var s = +slot.getAttribute("data-s");
      if (sel >= 0) { place(sel, s); changed(); }
      else if (placed[s] >= 0) { placed[s] = -1; changed(); }
    } else if (!e.target.closest("#act")) { if (sel >= 0) { sel = -1; changed(); } }
  });

  /* Kéo thả bằng pointer events (dùng được cả chuột và cảm ứng). */
  var drag = null;
  $("play").addEventListener("pointerdown", function (e) {
    if (checked || e.button > 0) return;
    var src = e.target.closest(".wchip, .slot.filled");
    if (!src) return;
    drag = { src: src, w: +src.getAttribute("data-w"), x: e.clientX, y: e.clientY, on: false, ghost: null, id: e.pointerId };
  });
  function target(x, y) {
    var el = document.elementFromPoint(x, y);
    if (!el) return null;
    var sl = el.closest(".slot"); if (sl) return sl;
    return el.closest("#bank");
  }
  function clearOver() { document.querySelectorAll(".over").forEach(function (n) { n.classList.remove("over"); }); }
  window.addEventListener("pointermove", function (e) {
    if (!drag) return;
    if (!drag.on) {
      if (Math.abs(e.clientX - drag.x) + Math.abs(e.clientY - drag.y) < 8) return;
      drag.on = true;
      var g = document.createElement("div"); g.className = "ghost"; g.textContent = pw[drag.w].hanzi;
      document.body.appendChild(g); drag.ghost = g; drag.src.classList.add("drag-src");
    }
    e.preventDefault();
    drag.ghost.style.left = e.clientX + "px"; drag.ghost.style.top = e.clientY + "px";
    clearOver(); var t = target(e.clientX, e.clientY); if (t) t.classList.add("over");
  }, { passive: false });
  function endDrag(e, cancel) {
    if (!drag) return;
    var d = drag; drag = null;
    if (!d.on) return;
    suppressClick = true; setTimeout(function () { suppressClick = false; }, 0);
    clearOver(); d.ghost.remove(); d.src.classList.remove("drag-src");
    if (cancel) return;
    var t = target(e.clientX, e.clientY);
    if (!t) return;
    if (t.id === "bank") unplace(d.w);
    else place(d.w, +t.getAttribute("data-s"));
    changed();
  }
  window.addEventListener("pointerup", function (e) { endDrag(e, false); });
  window.addEventListener("pointercancel", function (e) { endDrag(e, true); });

  $("act").onclick = function () {
    if (!checked) {
      checked = true;
      pw.forEach(function (w, s) { if (placed[s] === s) score++; else wrong.push(w); });
      $("qscore").textContent = "Đúng " + score;
      render(); updateAct();
    } else if (pi < pages.length - 1) { pi++; startPage(); window.scrollTo(0, 0); }
    else finish();
  };

  function finish() {
    $("play").classList.add("hide"); $("result").classList.remove("hide");
    var total = pages.length * PAGE, r = score / total;
    $("sc").textContent = score + " / " + total;
    $("ms").textContent = r === 1 ? "Tuyệt vời! Bạn làm đúng toàn bộ."
      : r >= 0.8 ? "Rất tốt! Xem lại vài từ sai bên dưới nhé."
      : r >= 0.5 ? "Khá ổn. Ôn lại các từ sai rồi làm bài mới nhé."
      : "Cố lên! Hãy ôn thẻ từ vựng rồi làm lại.";
    var secs = Math.round((Date.now() - startedAt) / 1000);
    $("tm").textContent = "Thời gian làm bài: " + fmtTime(secs);
    var best = getBest(), pct = Math.round(r * 100);
    if (!best || pct > best.pct || (pct === best.pct && (best.secs == null || secs < best.secs))) setBest({ pct: pct, score: score, total: total, secs: secs });
    var rv = $("rv"); rv.innerHTML = "";
    if (wrong.length) {
      var hd = document.createElement("p"); hd.className = "revhead"; hd.textContent = "Các từ cần ôn lại";
      rv.appendChild(hd);
      var seen = {};
      wrong.forEach(function (w) {
        if (seen[w.key]) return; seen[w.key] = 1;
        var d = document.createElement("div"); d.className = "rev";
        var h = document.createElement("p"); h.className = "h"; h.textContent = w.hanzi + "  " + w.pinyin;
        var m = document.createElement("p"); m.textContent = w.vi;
        var e = document.createElement("p"); e.textContent = w.ex.zh + " – " + w.ex.vi;
        d.appendChild(h); d.appendChild(m); d.appendChild(e); rv.appendChild(d);
      });
    }
  }

  function showBest() {
    var b = getBest();
    $("best").textContent = b ? "Điểm cao nhất của bạn: " + b.score + " / " + b.total + " (" + b.pct + "%)" + (b.secs != null ? ", làm trong " + fmtTime(b.secs) : "") : "";
  }

  var btns = document.querySelectorAll("#countChips .chip");
  btns.forEach(function (b) {
    b.onclick = function () {
      btns.forEach(function (x) { x.setAttribute("aria-pressed", "false"); });
      b.setAttribute("aria-pressed", "true");
      cfg.count = parseInt(b.getAttribute("data-v"), 10);
    };
  });

  $("start").onclick = function () {
    pi = 0; score = 0; wrong = [];
    build();
    if (!pages.length) { $("info").textContent = "Không đủ từ có câu ví dụ để tạo bài kéo thả ở cấp này."; return; }
    startedAt = Date.now();
    $("setup").classList.add("hide"); $("result").classList.add("hide"); $("play").classList.remove("hide");
    startPage();
  };
  $("again").onclick = function () {
    $("result").classList.add("hide"); $("setup").classList.remove("hide"); showBest();
    window.scrollTo(0, 0);
  };

  HL.renderLevelChips("levelChips");
  HL.renderStdChips("stdChips");
  $("title").textContent = "Kéo thả từ vào câu " + HL.label();
  document.title = "Kéo thả từ vào câu " + HL.label() + " - HanziLinh";
  $("toCards").href = "vocab.html?level=" + HL.level + "&std=" + HL.std + HL.sq();
  fetch(HL.dataUrl())
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function (d) {
      words = HL.assignKeys(d.words);
      if (!words.some(function (w) { return w.ex && w.ex.zh && w.ex.zh.indexOf(w.hanzi) >= 0; })) {
        $("info").textContent = "Cấp độ và chuẩn này chưa có câu ví dụ nên chưa làm được bài kéo thả. Hãy chọn chuẩn HSK 3.0.";
        return;
      }
      $("info").textContent = "Mỗi phần có 5 câu bỏ trống và 5 từ. Kéo từ vào đúng câu rồi bấm Kiểm tra. Từ lấy trong " + d.count + " từ theo chuẩn " + d.standard + ".";
      $("setup").classList.remove("hide"); showBest();
    })
    .catch(function () {
      $("info").textContent = "Chưa có dữ liệu cho cấp độ này hoặc không tải được. Hãy thử tải lại trang.";
    });
})();
