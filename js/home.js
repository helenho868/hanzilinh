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
})();
