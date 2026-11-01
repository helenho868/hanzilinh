(function () {
  var $ = function (id) { return document.getElementById(id); };
  var KNOWN_KEY = HL.knownKey();
  var BEST_KEY = HL.bestKey();

  var words = [];
  var cfg = { count: 10, type: "mix" };
  var qs = [], i = 0, score = 0, wrong = [];

  function shuffle(a) {
    a = a.slice();
    for (var k = a.length - 1; k > 0; k--) { var j = Math.floor(Math.random() * (k + 1)); var t = a[k]; a[k] = a[j]; a[j] = t; }
    return a;
  }
  function getKnown() {
    try { return JSON.parse(localStorage.getItem(KNOWN_KEY) || "[]"); } catch (e) { return []; }
  }
  function getBest() {
    try { return JSON.parse(localStorage.getItem(BEST_KEY) || "null"); } catch (e) { return null; }
  }
  function setBest(v) { try { localStorage.setItem(BEST_KEY, JSON.stringify(v)); } catch (e) {} }

  /* Hai nghĩa "trùng" nhau nếu một phần nghĩa này chứa phần nghĩa kia
     (ví dụ "không" và "không có"), để tránh đáp án gây nhầm lẫn. */
  function parts(s) {
    return s.split(/[,;()?]/).map(function (x) { return x.trim().toLowerCase(); }).filter(Boolean);
  }
  function overlap(a, b) {
    var pa = parts(a), pb = parts(b);
    for (var x = 0; x < pa.length; x++) for (var y = 0; y < pb.length; y++) {
      if (pa[x] === pb[y] || pa[x].indexOf(pb[y]) >= 0 || pb[y].indexOf(pa[x]) >= 0) return true;
    }
    return false;
  }

  function pickDistractors(w, type) {
    var pool = shuffle(words.filter(function (o) { return o.hanzi !== w.hanzi; }));
    var out = [];
    for (var k = 0; k < pool.length && out.length < 3; k++) {
      var o = pool[k], ok = true;
      if (type === "pinyin") ok = o.pinyin !== w.pinyin;
      else ok = !overlap(o.vi, w.vi);
      if (ok) out.push(o);
    }
    return out;
  }

  function makeQuestion(w, type) {
    var d = pickDistractors(w, type);
    var opts = shuffle([w].concat(d));
    var q = { w: w, type: type };
    if (type === "mean") {
      q.prompt = w.hanzi; q.promptZh = true; q.label = "Chọn nghĩa đúng của chữ này";
      q.options = opts.map(function (o) { return o.vi; }); q.answer = w.vi;
    } else if (type === "pinyin") {
      q.prompt = w.hanzi; q.promptZh = true; q.label = "Chọn phiên âm đúng của chữ này";
      q.options = opts.map(function (o) { return o.pinyin; }); q.answer = w.pinyin;
    } else {
      q.prompt = w.vi; q.promptZh = false; q.label = "Chọn chữ Hán có nghĩa này";
      q.options = opts.map(function (o) { return o.hanzi; }); q.optZh = true; q.answer = w.hanzi;
    }
    return q;
  }

  function build() {
    var pool = words.slice();
    if ($("prefNew").checked) {
      var kn = getKnown();
      var fresh = shuffle(pool.filter(function (w) { return kn.indexOf(w.key) < 0; }));
      var rest = shuffle(pool.filter(function (w) { return kn.indexOf(w.key) >= 0; }));
      pool = fresh.concat(rest);
    } else {
      pool = shuffle(pool);
    }
    pool = pool.slice(0, cfg.count);
    var types = ["mean", "pinyin", "hanzi"];
    qs = pool.map(function (w, n) {
      var t = cfg.type === "mix" ? types[n % 3] : cfg.type;
      return makeQuestion(w, t);
    });
    qs = shuffle(qs);
  }

  function show() {
    var q = qs[i];
    $("qcount").textContent = "Câu " + (i + 1) + " / " + qs.length;
    $("qscore").textContent = "Đúng " + score;
    $("prog").style.width = (i / qs.length * 100) + "%";
    $("qtype").textContent = q.label;
    var m = $("qmain"); m.textContent = q.prompt; m.className = "qmain" + (q.promptZh ? " zh" : "");
    $("fb").classList.add("hide"); $("next").classList.add("hide");
    var box = $("opts"); box.innerHTML = "";
    q.options.forEach(function (t) {
      var b = document.createElement("button");
      b.type = "button"; b.className = "opt" + (q.optZh ? " zh" : ""); b.textContent = t;
      b.onclick = function () { pick(t); };
      box.appendChild(b);
    });
  }

  function explain(w) {
    return w.hanzi + " (" + w.pinyin + ") nghĩa là: " + w.vi + ".";
  }

  function pick(t) {
    var q = qs[i], ok = t === q.answer, bs = $("opts").children;
    for (var k = 0; k < bs.length; k++) {
      bs[k].disabled = true;
      if (bs[k].textContent === q.answer) bs[k].classList.add("ok");
      else if (bs[k].textContent === t) bs[k].classList.add("no");
    }
    if (ok) score++; else wrong.push(q.w);
    $("qscore").textContent = "Đúng " + score;
    var f = $("fb"); f.className = "fb " + (ok ? "ok" : "no");
    f.innerHTML = "";
    var b = document.createElement("b"); b.textContent = ok ? "Chính xác! " : "Chưa đúng. ";
    f.appendChild(b); f.appendChild(document.createTextNode(explain(q.w)));
    var nx = $("next"); nx.textContent = i < qs.length - 1 ? "Câu tiếp theo" : "Xem kết quả";
    nx.classList.remove("hide"); nx.focus();
  }

  function finish() {
    $("play").classList.add("hide"); $("result").classList.remove("hide");
    var total = qs.length;
    $("sc").textContent = score + " / " + total;
    var r = score / total;
    $("ms").textContent = r === 1 ? "Tuyệt vời! Bạn làm đúng toàn bộ."
      : r >= 0.8 ? "Rất tốt! Xem lại vài từ sai bên dưới nhé."
      : r >= 0.5 ? "Khá ổn. Ôn lại các từ sai rồi làm đề mới nhé."
      : "Cố lên! Hãy ôn thẻ từ vựng rồi làm lại.";
    var best = getBest();
    var pct = Math.round(r * 100);
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
        d.appendChild(h); d.appendChild(m); rv.appendChild(d);
      });
    }
  }

  function showBest() {
    var b = getBest();
    $("best").textContent = b ? "Điểm cao nhất của bạn: " + b.score + " / " + b.total + " (" + b.pct + "%)" : "";
  }

  function chips(id, key) {
    var btns = document.querySelectorAll("#" + id + " .chip");
    btns.forEach(function (b) {
      b.onclick = function () {
        btns.forEach(function (x) { x.setAttribute("aria-pressed", "false"); });
        b.setAttribute("aria-pressed", "true");
        var v = b.getAttribute("data-v");
        cfg[key] = key === "count" ? parseInt(v, 10) : v;
      };
    });
  }
  chips("countChips", "count"); chips("typeChips", "type");

  $("start").onclick = function () {
    i = 0; score = 0; wrong = [];
    build();
    $("setup").classList.add("hide"); $("result").classList.add("hide"); $("play").classList.remove("hide");
    show();
  };
  $("next").onclick = function () { i++; if (i < qs.length) show(); else finish(); };
  $("again").onclick = function () {
    $("result").classList.add("hide"); $("setup").classList.remove("hide"); showBest();
    window.scrollTo(0, 0);
  };

  HL.renderLevelChips("levelChips");
  HL.renderStdChips("stdChips");
  $("title").textContent = "Luyện đề từ vựng " + HL.label();
  document.title = "Luyện đề từ vựng " + HL.label() + " - HanziLinh";
  $("toCards").href = "vocab.html?level=" + HL.level + "&std=" + HL.std;
  fetch(HL.dataUrl())
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function (d) {
      words = HL.assignKeys(d.words);
      $("info").textContent = "Đề tạo ngẫu nhiên từ " + d.count + " từ theo chuẩn " + d.standard + (d.level > 1 && d.note ? " (chỉ từ mới của cấp " + d.level + ")" : "") + ". Mỗi lần làm là một đề khác.";
      $("setup").classList.remove("hide"); showBest();
    })
    .catch(function () {
      $("info").textContent = "Chưa có dữ liệu cho cấp độ này hoặc không tải được. Hãy thử tải lại trang.";
    });
})();
