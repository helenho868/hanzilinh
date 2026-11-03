(function () {
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text) e.textContent = text;
    return e;
  }

  var ul = document.getElementById("levels");
  LEVELS.forEach(function (l) {
    var li = el("li");
    var card = el(l.ready ? "a" : "div", "level" + (l.ready ? "" : " soon"));
    if (l.ready) card.href = l.href;
    var head = el("span", "lhead");
    head.appendChild(el("span", "lv", "HSK " + (l.name || l.id)));
    head.appendChild(el("span", "zh", "HSK" + l.zh));
    head.appendChild(el("span", "state", l.ready ? "→" : "Sắp có"));
    card.appendChild(head);
    var wt;
    if (l.words3 && l.has2 === false) {
      wt = l.words3.toLocaleString("vi-VN") + " từ (HSK 3.0)" + (l.new3 ? ", gồm " + l.new3.toLocaleString("vi-VN") + " từ mới" : "");
    } else if (l.words3) {
      wt = l.words3.toLocaleString("vi-VN") + " từ (HSK 3.0), " + l.words.toLocaleString("vi-VN") + " từ (HSK 2.0)";
    } else {
      wt = l.words.toLocaleString("vi-VN") + " từ";
    }
    card.appendChild(el("span", "words", wt));
    li.appendChild(card);
    ul.appendChild(li);
  });

  var yl = document.getElementById("levelsYct");
  if (yl && typeof YCT_LEVELS !== "undefined") YCT_LEVELS.forEach(function (l) {
    var li = el("li");
    var card = el(l.ready ? "a" : "div", "level" + (l.ready ? "" : " soon"));
    if (l.ready) card.href = l.href;
    var head = el("span", "lhead");
    head.appendChild(el("span", "lv", "YCT " + l.id));
    head.appendChild(el("span", "zh", "YCT" + l.zh));
    head.appendChild(el("span", "state", l.ready ? "→" : "Sắp có"));
    card.appendChild(head);
    card.appendChild(el("span", "words", l.words.toLocaleString("vi-VN") + " từ" + (l.id > 1 ? ", gồm " + l.new.toLocaleString("vi-VN") + " từ mới" : "")));
    li.appendChild(card);
    yl.appendChild(li);
  });

  /* Chọn giáo trình: chỉ hiện cấp độ của giáo trình đã chọn, và các công cụ mở đúng bộ đó. */
  var book = "hsk";
  try { var sv = localStorage.getItem("hanzilinh_book"); if (sv === "yct") book = "yct"; } catch (e) {}
  var secs = { hsk: document.getElementById("cap-do"), yct: document.getElementById("cap-do-yct") };
  function applyBook() {
    Object.keys(secs).forEach(function (k) { if (secs[k]) secs[k].classList.toggle("hide", k !== book); });
    document.querySelectorAll("#books .chip").forEach(function (b) { b.setAttribute("aria-pressed", b.getAttribute("data-id") === book ? "true" : "false"); });
    document.querySelectorAll("#tools a.tool").forEach(function (a) {
      var h = a.getAttribute("data-base"); if (!h) return;
      a.href = (h.indexOf("bothu") >= 0 || book === "hsk") ? h : h + "&series=yct";
    });
  }
  var bx = document.getElementById("books");
  if (bx && typeof BOOKS !== "undefined") BOOKS.forEach(function (b) {
    var btn = el("button", "chip", b.name + (b.ready ? "" : " (sắp có)"));
    btn.type = "button"; btn.setAttribute("data-id", b.id);
    if (!b.ready) btn.disabled = true;
    else btn.onclick = function () { book = b.id; try { localStorage.setItem("hanzilinh_book", book); } catch (e) {} applyBook(); };
    bx.appendChild(btn);
  });

  var tl = document.getElementById("tools");
  TOOLS.forEach(function (t) {
    var li = el("li");
    var card = el(t.ready && t.href ? "a" : "div", "tool");
    if (t.ready && t.href) { card.href = t.href; card.setAttribute("data-base", t.href); }
    card.appendChild(el("span", "ic", t.ic));
    var box = el("div");
    box.appendChild(el("h3", "", t.name));
    box.appendChild(el("p", "", t.desc));
    box.appendChild(el("span", "state", t.ready ? "Vào học" : "Sắp có"));
    card.appendChild(box);
    li.appendChild(card);
    tl.appendChild(li);
  });
  applyBook();

  /* ---- Tiếp tục học ---- */
  var rb = document.getElementById("resumeBody");
  (function () {
    var last = null;
    try { last = JSON.parse(localStorage.getItem("hanzilinh_last") || "null"); } catch (e) {}
    if (last && last.u) {
      rb.appendChild(el("p", "resume-t", last.n + (last.l ? ", " + last.l : "")));
      var when = Math.max(0, Math.round((Date.now() - last.t) / 60000));
      var txt = when < 60 ? "Cách đây " + Math.max(1, when) + " phút" : when < 1440 ? "Cách đây " + Math.round(when / 60) + " giờ" : "Cách đây " + Math.round(when / 1440) + " ngày";
      rb.appendChild(el("p", "muted", txt));
      var row = el("div", "btnrow"), a = el("a", "mini", "Học tiếp"); a.href = last.u; row.appendChild(a); rb.appendChild(row);
    } else {
      rb.appendChild(el("p", "muted", "Bạn chưa học gì trên máy này. Chọn một cấp độ và mở Từ vựng để bắt đầu."));
      var r2 = el("div", "btnrow"), b = el("a", "mini", "Bắt đầu với HSK 1"); b.href = "vocab.html?level=1"; r2.appendChild(b); rb.appendChild(r2);
    }
  })();

  /* ---- Tiến độ: số từ đã đánh dấu thuộc và kết quả tốt nhất ở Luyện theo cấp độ ---- */
  (function () {
    var pb = document.getElementById("progressBody"), rows = 0;
    function cnt(key) { try { return (JSON.parse(localStorage.getItem(key) || "[]") || []).length; } catch (e) { return 0; } }
    function best(key) { try { return JSON.parse(localStorage.getItem(key) || "null"); } catch (e) { return null; } }
    function add(label, known, total, ex) {
      if (!known && !ex) return; rows++;
      var r = el("div", "prow"), l = el("div", "pl");
      l.appendChild(el("b", "", label)); l.appendChild(el("span", "", known + "/" + total + " từ" + (ex ? " · đề thi " + ex.pct + "%" : "")));
      r.appendChild(l);
      var bar = el("div", "pbar"), i = document.createElement("i"); i.style.width = Math.min(100, Math.round(known * 100 / total)) + "%"; bar.appendChild(i); r.appendChild(bar);
      pb.appendChild(r);
    }
    LEVELS.forEach(function (l) { if (l.ready) add("HSK " + (l.name || l.id), cnt("hanzilinh_known_hsk" + l.id + "_v3"), l.new3 || l.words3, best("hanzilinh_exambest_hsk" + l.id)); });
    if (typeof YCT_LEVELS !== "undefined") YCT_LEVELS.forEach(function (l) { if (l.ready) add("YCT " + l.id, cnt("hanzilinh_known_yct" + l.id), l.new, best("hanzilinh_exambest_yct" + l.id)); });
    if (!rows) pb.appendChild(el("p", "muted", "Chưa có số liệu. Ở trang Từ vựng, bấm \"Đã thuộc\" cho từ bạn nhớ, tiến độ sẽ hiện ở đây. Dữ liệu chỉ lưu trên máy này."));
  })();

  /* ---- Từ của hôm nay: mỗi ngày một từ, cùng một từ cho cả ngày trên máy này ---- */
  (function () {
    var box = document.getElementById("wotdBody");
    var now = new Date(), day = Math.floor((new Date(now.getFullYear(), now.getMonth(), now.getDate()) - new Date(2024, 0, 1)) / 86400000);
    var files = ["hsk1-v3", "hsk2-v3", "hsk3-v3"];
    if (book === "yct") files = ["yct1", "yct2"];
    var f = files[day % files.length];
    fetch("data/" + f + "-vocab.json").then(function (r) { return r.json(); }).then(function (d) {
      var ws = d.words.filter(function (w) { return w.ex && w.ex.zh; });
      var w = ws[(day * 7919) % ws.length];
      box.innerHTML = "";
      box.appendChild(el("p", "wd-zh", w.hanzi));
      box.appendChild(el("p", "wd-py", w.pinyin));
      box.appendChild(el("p", "wd-vi", (w.emoji ? w.emoji + " " : "") + w.vi));
      var ex = el("div", "wd-ex"); ex.appendChild(el("p", "z", w.ex.zh)); ex.appendChild(el("p", "p", w.ex.py)); ex.appendChild(el("p", "v", w.ex.vi)); box.appendChild(ex);
      var lv = f.indexOf("yct") === 0 ? "YCT " + f.charAt(3) : "HSK " + f.charAt(3);
      box.appendChild(el("p", "muted", "Lấy từ " + lv));
      if (window.speechSynthesis && typeof SpeechSynthesisUtterance !== "undefined") {
        var row = el("div", "btnrow"), b = el("button", "mini alt", "▶ Nghe từ"), b2 = el("button", "mini alt", "▶ Nghe câu");
        function say(t) { try { speechSynthesis.cancel(); var u = new SpeechSynthesisUtterance(t); u.lang = "zh-CN"; u.rate = 0.85; var vs = speechSynthesis.getVoices() || []; for (var i = 0; i < vs.length; i++) if (/^zh/i.test(vs[i].lang)) { u.voice = vs[i]; break; } speechSynthesis.speak(u); } catch (e) {} }
        b.type = b2.type = "button"; b.onclick = function () { say(w.hanzi); }; b2.onclick = function () { say(w.ex.zh); };
        row.appendChild(b); row.appendChild(b2); box.appendChild(row);
      }
    }).catch(function () { box.innerHTML = ""; box.appendChild(el("p", "muted", "Chưa tải được từ hôm nay.")); });
  })();
})();
