(function () {
  var $ = function (id) { return document.getElementById(id); };
  var KEY = HL.knownKey();
  var LKEY = KEY.replace("hanzilinh_known_", "hanzilinh_lastword_"), saveOn = false;

  var revealMode = false;
  try { revealMode = localStorage.getItem("hanzilinh_reveal") === "1"; } catch (e) {}
  var all = [], deck = [], ci = 0, known = {}, onlyNew = false, shuffled = false;

  try { (JSON.parse(localStorage.getItem(KEY) || "[]")).forEach(function (k) { known[k] = 1; }); } catch (e) {}
  function save() { try { localStorage.setItem(KEY, JSON.stringify(Object.keys(known))); } catch (e) {} }
  function shuffle(a) {
    a = a.slice();
    for (var k = a.length - 1; k > 0; k--) { var j = Math.floor(Math.random() * (k + 1)); var t = a[k]; a[k] = a[j]; a[j] = t; }
    return a;
  }
  function knownCount() { return all.filter(function (w) { return known[w.key]; }).length; }

  /* ---- Thẻ ---- */
  function setBack(d) {
    $("fe").textContent = d.emoji || "";
    $("fe").classList.toggle("hide", !d.emoji);
    $("fp").textContent = d.pinyin;
    $("fv").textContent = d.vi;
    var ex = $("fx");
    $("spkx").classList.toggle("hide", !d.ex);
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
    $("fc").classList.toggle("flip", revealMode);
    $("fcount").textContent = "Thẻ " + (ci + 1) + " / " + deck.length;
    $("fknown").textContent = "Đã thuộc " + knownCount() + " / " + all.length;
    /* Nhớ từ đang học để lần sau học tiếp (mỗi cấp độ một từ). */
    if (saveOn) { try { localStorage.setItem(LKEY, JSON.stringify({ k: d.key, h: d.hanzi, p: d.pinyin, i: all.indexOf(d) + 1, n: all.length, t: Date.now() })); } catch (e) {} }
  }
  function go(n) { if (!deck.length) return; $("resume").classList.add("hide"); ci = (ci + n + deck.length) % deck.length; card(); }
  function rebuild(doShuffle) {
    var base = onlyNew ? all.filter(function (w) { return !known[w.key]; }) : all;
    deck = doShuffle ? shuffle(base) : base.slice();
    ci = 0; card();
  }

  /* Khi đã bật "Xem phiên âm, nghĩa", các thẻ kế tiếp tự hiện sẵn phiên âm và nghĩa (nhớ cả lần sau). */
  function setMode(on) { revealMode = on; try { localStorage.setItem("hanzilinh_reveal", on ? "1" : "0"); } catch (e) {} }
  $("fc").onclick = function () { this.classList.toggle("flip"); setMode(this.classList.contains("flip")); };
  /* Nút "Xem phiên âm, nghĩa": lật thẻ giống bấm vào thẻ; nhãn đổi theo trạng thái thẻ. */
  function syncReveal() {
    var on = $("fc").classList.contains("flip");
    $("reveal").textContent = on ? "Ẩn phiên âm, nghĩa" : "Xem phiên âm, nghĩa";
    $("reveal").setAttribute("aria-pressed", on ? "true" : "false");
  }
  $("reveal").onclick = function () { if (deck.length) { $("fc").classList.toggle("flip"); setMode($("fc").classList.contains("flip")); } };
  new MutationObserver(syncReveal).observe($("fc"), { attributes: true, attributeFilter: ["class"] });
  syncReveal();
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
    known[deck[ci].key] = 1; save();
    if (onlyNew) { deck.splice(ci, 1); if (ci >= deck.length) ci = 0; card(); } else { go(1); }
    renderList();
  };
  $("no").onclick = function () {
    if (!deck.length) return;
    delete known[deck[ci].key]; save(); go(1); renderList();
  };
  $("shuf").onclick = function () { shuffled = true; rebuild(true); };
  $("onlyNew").onclick = function () {
    onlyNew = !onlyNew; this.setAttribute("aria-pressed", onlyNew); rebuild(shuffled);
  };
  var canSpeak = !!window.speechSynthesis && typeof window.SpeechSynthesisUtterance !== "undefined";
  function zhVoice() {
    try {
      var vs = speechSynthesis.getVoices() || [];
      for (var k = 0; k < vs.length; k++) if (/^zh/i.test(vs[k].lang)) return vs[k];
    } catch (e) {}
    return null;
  }
  function noSpeech() {
    var n = $("voiceNote2"); if (!n) { n = document.createElement("p"); n.id = "voiceNote2"; n.className = "voice-note"; var anchor = $("spk").parentNode; anchor.parentNode.insertBefore(n, anchor.nextSibling); }
    n.textContent = "Trình duyệt này không hỗ trợ phát âm. Nếu bạn đang mở link trong Messenger/Zalo, hãy bấm dấu ⋯ rồi chọn “Mở bằng trình duyệt” (Chrome) để nghe.";
    n.classList.remove("hide");
  }
  function speak(text) {
    if (!canSpeak) { noSpeech(); return; }
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
  $("wr").onclick = function () { if (deck.length) HLWriter.open(deck[ci]); };
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
    var ul = $("list"); ul.replaceChildren();
    var shown = all.filter(function (w) {
      return !q || w.hanzi.indexOf(q) >= 0 || norm(w.pinyin).indexOf(q) >= 0 || norm(w.vi).indexOf(q) >= 0;
    });
    if (!shown.length) { ul.appendChild(mk("li", "empty", "Không tìm thấy từ nào.")); return; }
    shown.forEach(function (w) {
      var li = mk("li", known[w.key] ? "known" : "");
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
      var a = mk("span", "acts");
      if (HLWriter.canWrite(w.hanzi)) {
        var bw = mk("button", "say", "Cách viết");
        bw.type = "button"; bw.setAttribute("data-write", w.key);
        bw.setAttribute("aria-label", "Xem cách viết từ " + w.hanzi);
        a.appendChild(bw);
      }
      if (true) {
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
      }
      if (a.children.length) li.appendChild(a);
      ul.appendChild(li);
    });
  }
  $("q").oninput = renderList;
  $("list").addEventListener("click", function (e) {
    var w = e.target.closest ? e.target.closest("button[data-write]") : null;
    if (w) { var k = w.getAttribute("data-write"); for (var n = 0; n < all.length; n++) if (all[n].key === k) { HLWriter.open(all[n]); break; } return; }
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
  HL.renderLevelChips("levelChips");
  HL.renderStdChips("stdChips");
  $("title").textContent = "Từ vựng " + HL.label();
  document.title = "Từ vựng " + HL.label() + " - HanziLinh";
  $("toQuiz").href = "quiz.html?level=" + HL.level + "&std=" + HL.std + HL.sq();
  fetch(HL.dataUrl())
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function (d) {
      all = HL.assignKeys(d.words);
      var withEx = d.words.filter(function (w) { return w.ex; }).length;
      var exText = withEx === d.count ? "Mỗi từ đều có câu ví dụ."
        : withEx ? "Đã có câu ví dụ cho " + withEx + " từ, các từ còn lại sẽ được thêm dần." : "";
      $("info").textContent = d.count + " từ, theo chuẩn " + d.standard + ". " + (d.note ? d.note + " " : "") + exText + " Tiến độ được lưu trên trình duyệt của bạn.";
      rebuild(false); renderList();
      /* Học tiếp: mở lại đúng từ cuối của lần học trước và báo cho người học biết. */
      var last = null;
      try { last = JSON.parse(localStorage.getItem(LKEY) || "null"); } catch (e) {}
      if (last && last.k) {
        var at = deck.map(function (w) { return w.key; }).indexOf(last.k);
        if (at > 0) {
          ci = at; card();
          $("resumeText").textContent = "Học tiếp từ lần trước: " + last.h + " (" + last.p + "), thẻ " + (at + 1) + "/" + deck.length + ".";
          $("resume").classList.remove("hide");
        }
      }
      $("restart").onclick = function () { ci = 0; $("resume").classList.add("hide"); card(); };
      saveOn = true; card();
    })
    .catch(function () {
      $("info").textContent = "Chưa có dữ liệu cho cấp độ này hoặc không tải được. Hãy thử tải lại trang.";
      $("p1").classList.add("hide"); document.querySelector(".tabs").classList.add("hide");
    });
})();
