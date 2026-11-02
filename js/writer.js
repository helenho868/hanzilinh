/* Cửa sổ dạy cách viết chữ Hán: xem thứ tự nét và tập viết theo từng chữ.
   Dùng thư viện Hanzi Writer (tải khi mở lần đầu) và dữ liệu nét trong data/strokes/. */
(function () {
  var $ = function (id) { return document.getElementById(id); };
  var libPromise = null, writer = null, chars = [], idx = 0, word = null;
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  function isHan(c) { return c >= "一" && c <= "鿿"; }
  function hanChars(s) { return Array.prototype.filter.call(s, isHan); }

  function loadLib() {
    if (window.HanziWriter) return Promise.resolve();
    if (libPromise) return libPromise;
    libPromise = new Promise(function (ok, bad) {
      var s = document.createElement("script");
      s.src = "js/vendor/hanzi-writer.min.js";
      s.onload = ok; s.onerror = function () { libPromise = null; bad(new Error("lib")); };
      document.head.appendChild(s);
    });
    return libPromise;
  }
  function loader(ch, done, fail) {
    fetch("data/strokes/" + encodeURIComponent(ch) + ".json")
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(done).catch(fail);
  }
  function cssVar(n) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); }
  function note(t) { $("wnote").textContent = t; }

  function renderChips() {
    var box = $("wchars"); box.innerHTML = "";
    $("wchars").classList.toggle("hide", chars.length < 2);
    chars.forEach(function (c, i) {
      var b = document.createElement("button");
      b.type = "button"; b.className = "chip zh"; b.textContent = c;
      b.setAttribute("aria-pressed", i === idx ? "true" : "false");
      b.setAttribute("aria-label", "Chữ thứ " + (i + 1) + ": " + c);
      b.onclick = function () { show(i); };
      box.appendChild(b);
    });
  }

  function show(i) {
    idx = i; renderChips();
    if (writer) { try { writer.cancelQuiz(); } catch (e) {} }
    var stage = $("wstage"); stage.innerHTML = ""; note("Đang tải nét viết...");
    var size = Math.max(200, Math.min(280, window.innerWidth - 90));
    stage.style.width = size + "px"; stage.style.height = size + "px";
    var ch = chars[i];
    writer = HanziWriter.create(stage, ch, {
      width: size, height: size, padding: 14, showOutline: true, showCharacter: true,
      strokeColor: cssVar("--ink"), outlineColor: cssVar("--line"), highlightColor: cssVar("--jade"),
      radicalColor: cssVar("--seal"), drawingColor: cssVar("--ink"),
      strokeAnimationSpeed: 1, delayBetweenStrokes: 250, charDataLoader: loader,
      onLoadCharDataSuccess: function (d) {
        var n = d.strokes.length;
        $("wsub").textContent = word.pinyin + " – " + word.vi;
        note("Chữ " + ch + " có " + n + " nét. Màu đỏ là bộ thủ. Bấm “Xem nét bút” hoặc “Tập viết”.");
        if (!reduce) play();
      },
      onLoadCharDataError: function () { note("Chưa có dữ liệu nét viết cho chữ " + ch + "."); }
    });
  }
  function play() {
    if (!writer) return;
    writer.cancelQuiz(); writer.showCharacter(); writer.animateCharacter();
  }
  function quiz() {
    if (!writer) return;
    note("Dùng chuột hoặc ngón tay viết nét thứ nhất vào khung.");
    writer.quiz({
      showHintAfterMisses: 2, leniency: 1.2,
      onCorrectStroke: function (d) {
        note("Đúng! Nét " + (d.strokeNum + 1) + " / " + (d.strokeNum + 1 + d.strokesRemaining) + ".");
      },
      onMistake: function (d) { note("Chưa đúng, thử lại nét thứ " + (d.strokeNum + 1) + "."); },
      onComplete: function (s) {
        var m = s.totalMistakes;
        note("Hoàn thành chữ " + chars[idx] + (m ? " với " + m + " lần viết sai." : " không sai nét nào.") +
             (idx < chars.length - 1 ? " Bấm chữ tiếp theo ở phía trên." : ""));
      }
    });
  }

  function open(w) {
    var cs = hanChars(w.hanzi);
    if (!cs.length) return;
    word = w; chars = cs; idx = 0;
    $("wtitle").textContent = w.hanzi;
    $("wsub").textContent = w.pinyin + " – " + w.vi;
    var dlg = $("wdlg");
    if (typeof dlg.showModal === "function") { if (!dlg.open) dlg.showModal(); } else dlg.setAttribute("open", "");
    note("Đang tải...");
    loadLib().then(function () { show(0); })
      .catch(function () { note("Không tải được thư viện vẽ nét. Hãy thử tải lại trang."); });
  }
  function close() {
    if (writer) { try { writer.cancelQuiz(); } catch (e) {} }
    $("wstage").innerHTML = ""; writer = null;
    var dlg = $("wdlg");
    if (dlg.open && typeof dlg.close === "function") dlg.close(); else dlg.removeAttribute("open");
  }

  $("wplay").onclick = play;
  $("wquiz").onclick = quiz;
  $("wreset").onclick = function () { show(idx); };
  $("wclose").onclick = close;
  $("wdlg").addEventListener("click", function (e) { if (e.target === $("wdlg")) close(); });
  $("wdlg").addEventListener("cancel", function () { if (writer) { try { writer.cancelQuiz(); } catch (e) {} } });

  window.HLWriter = { open: open, canWrite: function (s) { return hanChars(s).length > 0; } };
})();
