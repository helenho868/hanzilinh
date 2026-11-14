(function () {
  var $ = function (id) { return document.getElementById(id); };
  var data = null, cur = -1, showPy = true, showVi = false, token = 0, answered = 0, correct = 0;
  var PREF = "hanzilinh_read_prefs";
  try { var pr = JSON.parse(localStorage.getItem(PREF) || "{}"); if (pr.py === false) showPy = false; if (pr.vi === true) showVi = true; } catch (e) {}
  function savePrefs() { try { localStorage.setItem(PREF, JSON.stringify({ py: showPy, vi: showVi })); } catch (e) {} }
  function mk(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text) e.textContent = text; return e; }
  var BK = "hanzilinh_readbest_" + HL.series + HL.level + (HL.series === "hsk" ? "_v3" : "");
  function bests() { try { return JSON.parse(localStorage.getItem(BK) || "{}"); } catch (e) { return {}; } }
  function saveBest(id, n) { try { var b = bests(); if (!(b[id] >= n)) { b[id] = n; localStorage.setItem(BK, JSON.stringify(b)); } } catch (e) {} }

  var canSpeak = !!window.speechSynthesis && typeof window.SpeechSynthesisUtterance !== "undefined";
  function zhVoice() {
    try { var vs = speechSynthesis.getVoices() || []; for (var k = 0; k < vs.length; k++) if (/^zh/i.test(vs[k].lang)) return vs[k]; } catch (e) {}
    return null;
  }
  function utter(text, onend) {
    var u = new SpeechSynthesisUtterance(text); u.lang = "zh-CN"; u.rate = 0.8;
    var v = zhVoice(); if (v) u.voice = v;
    if (onend) { u.onend = onend; u.onerror = onend; }
    return u;
  }
  function noSpeech() {
    var n = $("voiceNote"); n.textContent = "Trình duyệt này không hỗ trợ phát âm. Nếu bạn đang mở link trong Messenger/Zalo, hãy bấm dấu ⋯ rồi chọn “Mở bằng trình duyệt” (Chrome) để nghe.";
    n.classList.remove("hide");
  }
  function stopAll() {
    token++;
    try { if (canSpeak) speechSynthesis.cancel(); } catch (e) {}
    $("playAll").classList.remove("hide"); $("stopAll").classList.add("hide");
    document.querySelectorAll(".para.cur").forEach(function (n) { n.classList.remove("cur"); });
  }
  function playAll() {
    if (!canSpeak) { noSpeech(); return; }
    if (cur < 0) return;
    stopAll(); var my = token;
    $("playAll").classList.add("hide"); $("stopAll").classList.remove("hide");
    var ps = data.passages[cur].text, nodes = document.querySelectorAll(".para");
    (function next(i) {
      if (my !== token) return;
      if (i >= ps.length) { stopAll(); return; }
      document.querySelectorAll(".para.cur").forEach(function (n) { n.classList.remove("cur"); });
      nodes[i].classList.add("cur"); nodes[i].scrollIntoView({ block: "nearest", behavior: "smooth" });
      try { speechSynthesis.speak(utter(ps[i].zh, function () { setTimeout(function () { next(i + 1); }, 350); })); } catch (e) { stopAll(); }
    })(0);
  }

  function renderList() {
    var ul = $("rlist"); ul.replaceChildren(); var b = bests();
    data.passages.forEach(function (p, i) {
      var li = mk("li"), btn = mk("button", "dcard"); btn.type = "button";
      btn.appendChild(mk("span", "n", String(i + 1)));
      btn.appendChild(mk("span", "t", p.title));
      if (b[p.id] !== undefined) btn.appendChild(mk("span", "best", "Tốt nhất " + b[p.id] + "/" + p.questions.length));
      var chars = p.text.reduce(function (a, x) { return a + x.zh.replace(/[^一-鿿]/g, "").length; }, 0);
      btn.appendChild(mk("span", "s", chars + " chữ Hán, " + p.questions.length + " câu hỏi"));
      btn.onclick = function () { openPassage(i); };
      li.appendChild(btn); ul.appendChild(li);
    });
  }
  function renderPassage() {
    var p = data.passages[cur], box = $("passage"); box.replaceChildren();
    p.text.forEach(function (l) {
      var d = mk("div", "para");
      d.appendChild(mk("span", "zh", l.zh)); d.appendChild(mk("span", "py", l.py)); d.appendChild(mk("span", "vi", l.vi));
      box.appendChild(d);
    });
    applyToggles();
  }
  function applyToggles() {
    var v = $("rdView"); v.classList.toggle("hidepy", !showPy); v.classList.toggle("hidevi", !showVi);
  }
  function renderQs() {
    var p = data.passages[cur], box = $("qs"); box.replaceChildren(); answered = 0; correct = 0;
    $("rscore").classList.add("hide");
    p.questions.forEach(function (q, qi) {
      var card = mk("div", "q");
      card.appendChild(mk("div", "qz", (qi + 1) + ". " + q.zh));
      card.appendChild(mk("div", "qv", q.vi));
      var os = mk("div", "opts"), btns = [];
      q.opts.forEach(function (o, oi) {
        var b = mk("button", "opt", String.fromCharCode(65 + oi) + ". " + o); b.type = "button"; btns.push(b);
        b.onclick = function () {
          if (os.classList.contains("done")) return;
          os.classList.add("done");
          btns[q.a].classList.add("ok");
          if (oi === q.a) correct++; else b.classList.add("no");
          card.appendChild(mk("p", "why", (oi === q.a ? "Đúng. " : "Chưa đúng. ") + q.why));
          answered++;
          if (answered === p.questions.length) finish(p);
        };
        os.appendChild(b);
      });
      card.appendChild(os); box.appendChild(card);
    });
  }
  function finish(p) {
    saveBest(p.id, correct);
    var s = $("rscore"); s.classList.remove("hide");
    s.textContent = "Bạn đúng " + correct + "/" + p.questions.length + " câu." + (correct === p.questions.length ? " Rất tốt!" : " Hãy đọc lại bài rồi thử lần nữa.");
  }
  function openPassage(i, noHash) {
    stopAll(); cur = i;
    var p = data.passages[i];
    $("rtitle").textContent = (i + 1) + ". " + p.title;
    $("listView").classList.add("hide"); $("rdView").classList.remove("hide");
    $("prevR").disabled = i === 0; $("nextR").disabled = i === data.passages.length - 1;
    renderPassage(); renderQs(); window.scrollTo(0, 0);
    if (!noHash) { try { history.replaceState(null, "", "#" + (i + 1)); } catch (e) {} }
  }
  function openList() {
    stopAll(); cur = -1; renderList(); $("rdView").classList.add("hide"); $("listView").classList.remove("hide");
    try { history.replaceState(null, "", location.pathname + location.search); } catch (e) {}
    window.scrollTo(0, 0);
  }
  $("back").onclick = openList;
  $("prevR").onclick = function () { if (cur > 0) openPassage(cur - 1); };
  $("nextR").onclick = function () { if (cur < data.passages.length - 1) openPassage(cur + 1); };
  $("tPy").onclick = function () { showPy = !showPy; this.setAttribute("aria-pressed", showPy); savePrefs(); applyToggles(); };
  $("tVi").onclick = function () { showVi = !showVi; this.setAttribute("aria-pressed", showVi); savePrefs(); applyToggles(); };
  $("playAll").onclick = playAll; $("stopAll").onclick = stopAll;
  $("tPy").setAttribute("aria-pressed", showPy); $("tVi").setAttribute("aria-pressed", showVi);

  HL.renderLevelChips("levelChips");
  $("title").textContent = "Đọc hiểu " + HL.label().replace(/ \(chuẩn.*\)/, "");
  document.title = $("title").textContent + " - HanziLinh";
  $("toVocab").href = "vocab.html?level=" + HL.level + "&std=3" + HL.sq();
  fetch("data/" + HL.series + HL.level + "-reading.json")
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function (d) {
      data = d; renderList();
      $("info").textContent = d.count + " bài đọc, dùng từ vựng của cấp này trở xuống. Đọc bài rồi trả lời câu hỏi để kiểm tra mức hiểu.";
      $("listView").classList.remove("hide");
      var h = parseInt((location.hash || "").slice(1), 10);
      if (h >= 1 && h <= d.count) openPassage(h - 1, true);
    })
    .catch(function () { $("info").textContent = "Cấp độ này chưa có bài đọc hoặc không tải được. Hãy thử tải lại trang."; });
})();
