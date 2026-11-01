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
    card.appendChild(el("span", "lv", "HSK " + (l.name || l.id)));
    card.appendChild(el("span", "zh", "HSK" + l.zh));
    var wt;
    if (l.words3 && l.has2 === false) {
      wt = l.words3.toLocaleString("vi-VN") + " từ (HSK 3.0)" + (l.new3 ? ", gồm " + l.new3 + " từ mới" : "");
    } else if (l.words3) {
      wt = l.words3.toLocaleString("vi-VN") + " từ (HSK 3.0), " + l.words.toLocaleString("vi-VN") + " từ (HSK 2.0)";
    } else {
      wt = l.words.toLocaleString("vi-VN") + " từ";
    }
    card.appendChild(el("span", "words", wt));
    card.appendChild(el("span", "state", l.ready ? "Vào học" : "Sắp có"));
    li.appendChild(card);
    ul.appendChild(li);
  });

  var tl = document.getElementById("tools");
  TOOLS.forEach(function (t) {
    var li = el("li");
    var card = el(t.ready && t.href ? "a" : "div", "tool");
    if (t.ready && t.href) card.href = t.href;
    card.appendChild(el("span", "ic", t.ic));
    var box = el("div");
    box.appendChild(el("h3", "", t.name));
    box.appendChild(el("p", "", t.desc));
    box.appendChild(el("span", "state", t.ready ? "Vào học" : "Sắp có"));
    card.appendChild(box);
    li.appendChild(card);
    tl.appendChild(li);
  });
})();
