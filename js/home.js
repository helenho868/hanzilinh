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

  var bl = document.getElementById("levelsBoya");
  if (bl && typeof BOYA_LEVELS !== "undefined") BOYA_LEVELS.forEach(function (l) {
    var li = el("li"), card = el("div", "level soon"), head = el("span", "lhead");
    head.appendChild(el("span", "lv", l.name)); head.appendChild(el("span", "zh", l.zh)); head.appendChild(el("span", "state", "Sắp có"));
    card.appendChild(head); card.appendChild(el("span", "words", "Nội dung đang chuẩn bị"));
    li.appendChild(card); bl.appendChild(li);
  });

  /* Chọn giáo trình: chỉ hiện cấp độ của giáo trình đã chọn, và các công cụ mở đúng bộ đó. */
  var book = "hsk";
  try { var sv = localStorage.getItem("hanzilinh_book"); if (sv === "yct" || sv === "boya") book = sv; } catch (e) {}
  var secs = { hsk: document.getElementById("cap-do"), yct: document.getElementById("cap-do-yct"), boya: document.getElementById("cap-do-boya") };
  function applyBook() {
    Object.keys(secs).forEach(function (k) { if (secs[k]) secs[k].classList.toggle("hide", k !== book); });
    document.querySelectorAll("#books .chip").forEach(function (b) { b.setAttribute("aria-pressed", b.getAttribute("data-id") === book ? "true" : "false"); });
    document.querySelectorAll("#tools a.tool").forEach(function (a) {
      var h = a.getAttribute("data-base"); if (!h) return;
      a.href = (h.indexOf("bothu") >= 0 || h.indexOf("hat.html") >= 0 || book !== "yct") ? h : h + "&series=yct";
    });
  }
  var bx = document.getElementById("books");
  if (bx && typeof BOOKS !== "undefined") BOOKS.forEach(function (b) {
    var btn = el("button", "chip", b.name + (b.ready ? "" : " (sắp có)"));
    btn.type = "button"; btn.setAttribute("data-id", b.id);
    if (!b.ready && !b.frame) btn.disabled = true;
    else btn.onclick = function () { book = b.id; try { localStorage.setItem("hanzilinh_book", book); } catch (e) {} applyBook(); };
    bx.appendChild(btn);
  });

  var tl = document.getElementById("tools");
  TOOLS.forEach(function (t) {
    if (t.hidden) return; /* tạm ẩn khỏi trang chủ, trang vẫn còn trong thư mục */
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
    function add(label, known, total, ex, last, href) {
      if (!known && !ex && !last) return; rows++;
      var r = el("div", "prow"), l = el("div", "pl");
      l.appendChild(el("b", "", label)); l.appendChild(el("span", "", known + "/" + total + " từ" + (ex ? " · đề thi " + ex.pct + "%" : "")));
      r.appendChild(l);
      var bar = el("div", "pbar"), i = document.createElement("i"); i.style.width = Math.min(100, Math.round(known * 100 / total)) + "%"; bar.appendChild(i); r.appendChild(bar);
      if (last && last.h) {
        var c = el("p", "pcont"); c.appendChild(document.createTextNode("Từ cuối: "));
        c.appendChild(el("span", "zh", last.h)); c.appendChild(document.createTextNode(" (" + last.p + "), thẻ " + last.i + "/" + last.n + " "));
        var a = el("a", "plink", "Học tiếp"); a.href = href; c.appendChild(a); r.appendChild(c);
      }
      pb.appendChild(r);
    }
    LEVELS.forEach(function (l) { if (l.ready) add("HSK " + (l.name || l.id), cnt("hanzilinh_known_hsk" + l.id + "_v3"), l.new3 || l.words3, best("hanzilinh_exambest_hsk" + l.id), best("hanzilinh_lastword_hsk" + l.id + "_v3"), "vocab.html?level=" + l.id); });
    if (typeof YCT_LEVELS !== "undefined") YCT_LEVELS.forEach(function (l) { if (l.ready) add("YCT " + l.id, cnt("hanzilinh_known_yct" + l.id), l.new, best("hanzilinh_exambest_yct" + l.id), best("hanzilinh_lastword_yct" + l.id), "vocab.html?series=yct&level=" + l.id); });
    if (!rows) pb.appendChild(el("p", "muted", "Chưa có số liệu. Ở trang Từ vựng, bấm \"Đã thuộc\" cho từ bạn nhớ, tiến độ sẽ hiện ở đây. Dữ liệu chỉ lưu trên máy này."));
  })();
})();
