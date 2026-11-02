(function () {
  var $ = function (id) { return document.getElementById(id); };
  var KNOWN_KEY = HL.knownKey();
  var BEST_KEY = HL.bestKey().replace("_best_", "_fillbest_");

  var words = [];
  var cfg = { time: "off", count: 10 };
  var qs = [], i = 0, score = 0, wrong = [];


  /* Đếm ngược: 1 phút cho mỗi câu, tính cho cả bài. Dùng mốc thời gian kết thúc nên vẫn đúng khi tab bị ẩn. */
  var timerId = null, endAt = 0, answered = false;
  function fmt(sec) { var m = Math.floor(sec / 60), s = sec % 60; return m + ":" + (s < 10 ? "0" : "") + s; }
  function stopTimer() { if (timerId) { clearInterval(timerId); timerId = null; } $("qtimer").classList.add("hide"); }
  function tick() {
    var left = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
    var t = $("qtimer"); t.textContent = "⏱ " + fmt(left);
    t.classList.toggle("low", left <= 60);
    if (left <= 0) timeUp();
  }
  function startTimer() {
    stopTimer();
    if (cfg.time !== "on") return;
    endAt = Date.now() + qs.length * 60000;
    $("qtimer").classList.remove("hide");
    tick(); timerId = setInterval(tick, 250);
  }
  function timeUp() {
    stopTimer();
    for (var k = answered ? i + 1 : i; k < qs.length; k++) wrong.push(qs[k].w);
    finish(true);
  }

  function shuffle(a) {
    a = a.slice();
    for (var k = a.length - 1; k > 0; k--) { var j = Math.floor(Math.random() * (k + 1)); var t = a[k]; a[k] = a[j]; a[j] = t; }
    return a;
  }
  function getKnown() { try { return JSON.parse(localStorage.getItem(KNOWN_KEY) || "[]"); } catch (e) { return []; } }
  function getBest() { try { return JSON.parse(localStorage.getItem(BEST_KEY) || "null"); } catch (e) { return null; } }
  function setBest(v) { try { localStorage.setItem(BEST_KEY, JSON.stringify(v)); } catch (e) {} }

  /* Chọn 3 từ gây nhiễu: khác chữ Hán, ưu tiên cùng độ dài, không chứa nhau với từ đúng. */
  function pickDistractors(w) {
    var pool = shuffle(words.filter(function (o) {
      return o.hanzi !== w.hanzi && o.hanzi.indexOf(w.hanzi) < 0 && w.hanzi.indexOf(o.hanzi) < 0 &&
             o.ex.zh.indexOf(o.hanzi) >= 0;
    }));
    var same = pool.filter(function (o) { return o.hanzi.length === w.hanzi.length; });
    var other = pool.filter(function (o) { return o.hanzi.length !== w.hanzi.length; });
    var out = [], seen = {};
    same.concat(other).forEach(function (o) {
      if (out.length < 3 && !seen[o.hanzi]) { seen[o.hanzi] = 1; out.push(o); }
    });
    return out;
  }

  function build() {
    var pool = words.filter(function (w) { return w.ex && w.ex.zh && w.ex.zh.indexOf(w.hanzi) >= 0; });
    if ($("prefNew").checked) {
      var kn = getKnown();
      pool = shuffle(pool.filter(function (w) { return kn.indexOf(w.key) < 0; }))
        .concat(shuffle(pool.filter(function (w) { return kn.indexOf(w.key) >= 0; })));
    } else pool = shuffle(pool);
    qs = pool.slice(0, cfg.count).map(function (w) {
      var opts = shuffle([w].concat(pickDistractors(w))).map(function (o) { return o.hanzi; });
      return { w: w, options: opts, answer: w.hanzi };
    });
  }

  function renderSentence(q, fill, cls) {
    var parts = q.w.ex.zh.split(q.w.hanzi), s = $("sent");
    s.innerHTML = "";
    parts.forEach(function (p, n) {
      s.appendChild(document.createTextNode(p));
      if (n < parts.length - 1) {
        var b = document.createElement("span"); b.className = "blank" + (cls ? " " + cls : "");
        b.textContent = fill || " "; s.appendChild(b);
      }
    });
  }

  function show() {
    var q = qs[i]; answered = false;
    $("qcount").textContent = "Câu " + (i + 1) + " / " + qs.length;
    $("qscore").textContent = "Đúng " + score;
    $("prog").style.width = (i / qs.length * 100) + "%";
    renderSentence(q);
    $("hint").textContent = "Nghĩa câu: " + q.w.ex.vi;
    $("fb").classList.add("hide"); $("next").classList.add("hide");
    var box = $("opts"); box.innerHTML = "";
    q.options.forEach(function (t) {
      var b = document.createElement("button");
      b.type = "button"; b.className = "opt zh"; b.textContent = t;
      b.onclick = function () { pick(t); };
      box.appendChild(b);
    });
  }

  function pick(t) {
    answered = true;
    var q = qs[i], ok = t === q.answer, bs = $("opts").children;
    for (var k = 0; k < bs.length; k++) {
      bs[k].disabled = true;
      if (bs[k].textContent === q.answer) bs[k].classList.add("ok");
      else if (bs[k].textContent === t) bs[k].classList.add("no");
    }
    if (ok) score++; else wrong.push(q.w);
    $("qscore").textContent = "Đúng " + score;
    renderSentence(q, q.answer, ok ? "ok" : "no");
    var f = $("fb"); f.className = "fb " + (ok ? "ok" : "no"); f.innerHTML = "";
    var b = document.createElement("b"); b.textContent = ok ? "Chính xác! " : "Chưa đúng. Đáp án: " + q.answer + ". ";
    f.appendChild(b);
    f.appendChild(document.createTextNode(q.w.hanzi + " (" + q.w.pinyin + ") nghĩa là: " + q.w.vi + "."));
    var p = document.createElement("p"); p.className = "pyline"; p.textContent = q.w.ex.py;
    f.appendChild(p);
    var nx = $("next"); nx.textContent = i < qs.length - 1 ? "Câu tiếp theo" : "Xem kết quả";
    nx.classList.remove("hide"); nx.focus();
  }

  function finish(timedOut) {
    stopTimer();
    $("play").classList.add("hide"); $("result").classList.remove("hide");
    var total = qs.length, r = score / total;
    $("sc").textContent = score + " / " + total;
    $("ms").textContent = (timedOut ? "Hết giờ! " : "") + (r === 1 ? "Tuyệt vời! Bạn làm đúng toàn bộ."
      : r >= 0.8 ? "Rất tốt! Xem lại vài từ sai bên dưới nhé."
      : r >= 0.5 ? "Khá ổn. Ôn lại các từ sai rồi làm bài mới nhé."
      : "Cố lên! Hãy ôn thẻ từ vựng rồi làm lại.");
    var best = getBest(), pct = Math.round(r * 100);
    if (!best || pct > best.pct) setBest({ pct: pct, score: score, total: total });
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
    $("best").textContent = b ? "Điểm cao nhất của bạn: " + b.score + " / " + b.total + " (" + b.pct + "%)" : "";
  }

  var btns = document.querySelectorAll("#countChips .chip");
  btns.forEach(function (b) {
    b.onclick = function () {
      btns.forEach(function (x) { x.setAttribute("aria-pressed", "false"); });
      b.setAttribute("aria-pressed", "true");
      cfg.count = parseInt(b.getAttribute("data-v"), 10); if (typeof updateTimeNote === "function") updateTimeNote();
    };
  });


  var tbtns = document.querySelectorAll("#timeChips .chip");
  tbtns.forEach(function (b) {
    b.onclick = function () {
      tbtns.forEach(function (x) { x.setAttribute("aria-pressed", "false"); });
      b.setAttribute("aria-pressed", "true");
      cfg.time = b.getAttribute("data-v"); updateTimeNote();
    };
  });
  function updateTimeNote() {
    $("timeNote").textContent = cfg.time === "on"
      ? "Có đếm ngược: 1 phút cho mỗi câu, tức " + cfg.count + " phút cho " + cfg.count + " câu. Hết giờ thì bài tự nộp, câu chưa làm tính là sai."
      : "Làm thong thả, không bị áp lực thời gian.";
  }

  $("start").onclick = function () {
    i = 0; score = 0; wrong = [];
    build();
    $("setup").classList.add("hide"); $("result").classList.add("hide"); $("play").classList.remove("hide");
    show(); startTimer();
  };
  $("next").onclick = function () { i++; if (i < qs.length) show(); else finish(); };
  $("again").onclick = function () {
    $("result").classList.add("hide"); $("setup").classList.remove("hide"); showBest();
    window.scrollTo(0, 0);
  };

  HL.renderLevelChips("levelChips");
  HL.renderStdChips("stdChips");
  $("title").textContent = "Điền chỗ trống " + HL.label();
  document.title = "Điền chỗ trống " + HL.label() + " - HanziLinh";
  $("toCards").href = "vocab.html?level=" + HL.level + "&std=" + HL.std;
  fetch(HL.dataUrl())
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function (d) {
      words = HL.assignKeys(d.words);
      if (!words.some(function (w) { return w.ex && w.ex.zh && w.ex.zh.indexOf(w.hanzi) >= 0; })) {
        $("info").textContent = "Cấp độ và chuẩn này chưa có câu ví dụ nên chưa làm được bài điền chỗ trống. Hãy chọn chuẩn HSK 3.0.";
        return;
      }
      $("info").textContent = "Mỗi câu bỏ trống một từ trong " + d.count + " từ theo chuẩn " + d.standard + ". Chọn từ đúng để điền vào chỗ trống. Mỗi lần làm là một bài khác.";
      $("setup").classList.remove("hide"); showBest();
    })
    .catch(function () {
      $("info").textContent = "Chưa có dữ liệu cho cấp độ này hoặc không tải được. Hãy thử tải lại trang.";
    });
})();
