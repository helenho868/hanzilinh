(function () {
  var $ = function (id) { return document.getElementById(id); };
  var KEY = HL.knownKey();

  var all = [], deck = [], ci = 0, known = {}, onlyNew = false, shuffled = false;

  try { (JSON.parse(localStorage.getItem(KEY) || "[]")).forEach(function (k) { known[k] = 1; }); } catch (e) {}
  function save() { try { localStorage.setItem(KEY, JSON.stringify(Object.keys(known))); } catch (e) {} }
  function shuffle(a) {
    a = a.slice();
    for (var k = a.length - 1; k > 0; k--) { var j = Math.floor(Math.random() * (k + 1)); var t = a[k]; a[k] = a[j]; a[j] = t; }
    return a;
  }
  function knownCount() { return all.filter(function (w) { return known[w.hanzi]; }).length; }

  /* ---- Thẻ ---- */
  function setBack(d) {
    $("fe").textContent = d.emoji || "";
    $("fe").classList.toggle("hide", !d.emoji);
    $("fp").textContent = d.pinyin;
    $("fv").textContent = d.vi;
    var ex = $("fx");
    $("spkx").classList.toggle("hide", !(d.ex && canSpeak));
    if (d.ex) {
      $("fxz").textContent = d.ex.zh; $("fxp").textContent = d.ex.py; $("fxv").textContent = d.ex.vi;
      ex.classList.remove("hide");
    } else {
      ex.classList.add("hide");
    }
  }
  function card() {
    if (!deck.length) {
      $("fz").textContent = "完";
      setBack({ pinyin: "", vi: "Bạn đã thuộc hết các từ" });
      $("fc").classList.add("flip");
      $("fcount").textContent = "Không còn thẻ";
      $("fknown").textContent = "Đã thuộc " + knownCount() + " / " + all.length;
      return;
    }
    var d = deck[ci];
    $("fz").textContent = d.hanzi;
    setBack(d);
    $("fc").classList.remove("flip");
    $("fcount").textContent = "Thẻ " + (ci + 1) + " / " + deck.length;
    $("fknown").textContent = "Đã thuộc " + knownCount() + " / " + all.length;
  }
  function go(n) { if (!deck.length) return; ci = (ci + n + deck.length) % deck.length; card(); }
  function rebuild(doShuffle) {
    var base = onlyNew ? all.filter(function (w) { return !known[w.hanzi]; }) : all;
    deck = doShuffle ? shuffle(base) : base.slice();
    ci = 0; card();
  }

  $("fc").onclick = function () { this.classList.toggle("flip"); };
  $("nxt").onclick = function () { go(1); };
  $("prev").onclick = function () { go(-1); };
  /* Phím mũi tên trái/phải để lùi/tiến khi đang ở tab thẻ và không gõ vào ô tìm kiếm. */
  document.addEventListener("keydown", function (e) {
    if ($("p1").classList.contains("hide")) return;
    var t = e.target && e.target.tagName;
    if (t === "INPUT" || t === "TEXTAREA") return;
    if (e.key === "ArrowRight") { go(1); } else if (e.key === "ArrowLeft") { go(-1); }
  });
  $("yes").onclick = function () {
    if (!deck.length) return;
    known[deck[ci].hanzi] = 1; save();
    if (onlyNew) { deck.splice(ci, 1); if (ci >= deck.length) ci = 0; card(); } else { go(1); }
    renderList();
  };
  $("no").onclick = function () {
    if (!deck.length) return;
    delete known[deck[ci].hanzi]; save(); go(1); renderList();
  };
  $("shuf").onclick = function () { shuffled = true; rebuild(true); };
  $("onlyNew").onclick = function () {
    onlyNew = !onlyNew; this.setAttribute("aria-pressed", onlyNew); rebuild(shuffled);
  };
  var canSpeak = !!window.speechSynthesis && typeof window.SpeechSynthesisUtterance !== "undefined";
  if (!canSpeak) { $("spk").classList.add("hide"); }
  function zhVoice() {
    try {
      var vs = speechSynthesis.getVoices() || [];
      for (var k = 0; k < vs.length; k++) if (/^zh/i.test(vs[k].lang)) return vs[k];
    } catch (e) {}
    return null;
  }
  function speak(text) {
    if (!canSpeak) return;
    try {
      var u = new SpeechSynthesisUtterance(text);
      u.lang = "zh-CN"; u.rate = 0.8;
      var v = zhVoice(); if (v) u.voice = v;
      speechSynthesis.cancel(); speechSynthesis.speak(u);
    } catch (e) {}
  }
  /* Nếu thiết bị đã tải xong danh sách giọng đọc mà không có giọng tiếng Trung, báo cho học viên. */
  function voiceNote() {
    var n = $("voiceNote"); if (!n || !canSpeak) return;
    var vs = []; try { vs = speechSynthesis.getVoices() || []; } catch (e) {}
    n.classList.toggle("hide", !(vs.length && !zhVoice()));
  }
  if (canSpeak) {
    voiceNote();
    try { speechSynthesis.addEventListener("voiceschanged", voiceNote); } catch (e) {}
  }
  $("spk").onclick = function () { if (deck.length) speak(deck[ci].hanzi); };
  $("spkx").onclick = function () { if (deck.length && deck[ci].ex) speak(deck[ci].ex.zh); };

  /* ---- Danh sách ---- */
  function norm(s) {
    return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d");
  }
  function mk(tag, cls, text) {
    var e = document.createElement(tag); if (cls) e.className = cls; if (text) e.textContent = text; return e;
  }
  function renderList() {
    var q = norm($("q").value.trim());
    var ul = $("list"); ul.innerHTML = "";
    var shown = all.filter(function (w) {
      return !q || w.hanzi.indexOf(q) >= 0 || norm(w.pinyin).indexOf(q) >= 0 || norm(w.vi).indexOf(q) >= 0;
    });
    if (!shown.length) { ul.appendChild(mk("li", "empty", "Không tìm thấy từ nào.")); return; }
    shown.forEach(function (w) {
      var li = mk("li", known[w.hanzi] ? "known" : "");
      li.appendChild(mk("span", "h", (w.emoji ? w.emoji + " " : "") + w.hanzi));
      li.appendChild(mk("span", "p", w.pinyin));
      li.appendChild(mk("span", "m", w.vi));
      if (w.ex) {
        var x = mk("span", "x");
        x.appendChild(mk("span", "xz", w.ex.zh));
        x.appendChild(mk("span", "xp", w.ex.py));
        x.appendChild(mk("span", "xv", w.ex.vi));
        li.appendChild(x);
      }
      if (canSpeak) {
        var a = mk("span", "acts");
        var b1 = mk("button", "say", "Nghe từ");
        b1.type = "button"; b1.setAttribute("data-say", w.hanzi);
        b1.setAttribute("aria-label", "Nghe từ " + w.hanzi);
        a.appendChild(b1);
        if (w.ex) {
          var b2 = mk("button", "say", "Nghe câu");
          b2.type = "button"; b2.setAttribute("data-say", w.ex.zh);
          b2.setAttribute("aria-label", "Nghe câu ví dụ của từ " + w.hanzi);
          a.appendChild(b2);
        }
        li.appendChild(a);
      }
      ul.appendChild(li);
    });
  }
  $("q").oninput = renderList;
  $("list").addEventListener("click", function (e) {
    var b = e.target.closest ? e.target.closest("button[data-say]") : null;
    if (b) speak(b.getAttribute("data-say"));
  });

  /* ---- Tab ---- */
  function tab(n) {
    $("p1").classList.toggle("hide", n !== 1);
    $("p2").classList.toggle("hide", n !== 2);
    $("t1").setAttribute("aria-selected", n === 1);
    $("t2").setAttribute("aria-selected", n === 2);
  }
  $("t1").onclick = function () { tab(1); };
  $("t2").onclick = function () { tab(2); };

  /* ---- Tải dữ liệu ---- */
  HL.renderStdChips("stdChips");
  $("title").textContent = "Từ vựng " + HL.label();
  document.title = "Từ vựng " + HL.label() + " - HanziLinh";
  $("toQuiz").href = "quiz.html?level=" + HL.level + "&std=" + HL.std;
  fetch(HL.dataUrl())
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function (d) {
      all = d.words;
      var withEx = d.words.filter(function (w) { return w.ex; }).length;
      var exText = withEx === d.count ? "Mỗi từ đều có câu ví dụ."
        : withEx ? "Đã có câu ví dụ cho " + withEx + " từ, các từ còn lại sẽ được thêm dần." : "";
      $("info").textContent = d.count + " từ, theo chuẩn " + d.standard + ". " + exText + " Tiến độ được lưu trên trình duyệt của bạn.";
      rebuild(false); renderList();
    })
    .catch(function () {
      $("info").textContent = "Chưa có dữ liệu cho cấp độ này hoặc không tải được. Hãy thử tải lại trang.";
      $("p1").classList.add("hide"); document.querySelector(".tabs").classList.add("hide");
    });
})();
