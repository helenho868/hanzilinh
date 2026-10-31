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
    card.appendChild(el("span", "lv", "HSK " + l.id));
    card.appendChild(el("span", "zh", "HSK" + l.zh));
    card.appendChild(el("span", "words", l.words.toLocaleString("vi-VN") + " từ"));
    card.appendChild(el("span", "state", l.ready ? "Vào học" : "Sắp có"));
    li.appendChild(card);
    ul.appendChild(li);
  });

  var tl = document.getElementById("tools");
  TOOLS.forEach(function (t) {
    var li = el("li", "tool");
    li.appendChild(el("span", "ic", t.ic));
    var box = el("div");
    box.appendChild(el("h3", "", t.name));
    box.appendChild(el("p", "", t.desc));
    box.appendChild(el("span", "state", t.ready ? "Sẵn sàng" : "Sắp có"));
    li.appendChild(box);
    tl.appendChild(li);
  });
})();
