/* Dùng chung cho trang từ vựng và trang luyện đề.
   level: cấp HSK (mặc định 1). std: chuẩn HSK, "3" (mặc định) hoặc "2". */
(function () {
  var p = new URLSearchParams(location.search);
  var HL = {
    series: p.get("series") === "yct" ? "yct" : "hsk",
    level: parseInt(p.get("level"), 10) || 1,
    std: p.get("std") === "2" ? "2" : "3"
  };
  /* Phần cuối đường dẫn để giữ nguyên bộ (HSK hoặc YCT) khi chuyển trang. */
  HL.sq = function () { return HL.series === "yct" ? "&series=yct" : ""; };
  HL.levelList = function () {
    if (HL.series === "yct") return typeof YCT_LEVELS === "undefined" ? [] : YCT_LEVELS;
    return typeof LEVELS === "undefined" ? [] : LEVELS;
  };
  /* Cấp độ hiện tại có dữ liệu chuẩn 2.0 không? Nếu không thì chỉ dùng chuẩn 3.0. */
  HL.hasStd2 = function () {
    if (HL.series === "yct") return false;
    if (typeof LEVELS === "undefined") return true;
    for (var i = 0; i < LEVELS.length; i++) if (LEVELS[i].id === HL.level) return LEVELS[i].has2 !== false;
    return true;
  };
  if (!HL.hasStd2()) HL.std = "3";

  /* Mỗi từ có một khóa riêng để lưu tiến độ. Từ đầu tiên giữ khóa là chữ Hán (tương thích dữ liệu đã lưu),
     các từ đồng hình sau đó (ví dụ 花 hoa / 花 tiêu) thêm nghĩa vào khóa để không bị lẫn. */
  HL.assignKeys = function (words) {
    var seen = {};
    words.forEach(function (w) {
      w.key = seen[w.hanzi] ? w.hanzi + "#" + w.vi : w.hanzi;
      seen[w.hanzi] = 1;
    });
    return words;
  };

  HL.dataUrl = function () {
    if (HL.series === "yct") return "data/yct" + HL.level + "-vocab.json";
    return HL.std === "2" ? "data/hsk" + HL.level + "-vocab.json"
                          : "data/hsk" + HL.level + "-v3-vocab.json";
  };
  /* Khóa lưu tiến độ. Chuẩn 2.0 giữ nguyên khóa cũ để không mất dữ liệu đã lưu. */
  HL.knownKey = function () {
    if (HL.series === "yct") return "hanzilinh_known_yct" + HL.level;
    return "hanzilinh_known_hsk" + HL.level + (HL.std === "2" ? "" : "_v3");
  };
  HL.bestKey = function () {
    if (HL.series === "yct") return "hanzilinh_best_yct" + HL.level;
    return "hanzilinh_best_hsk" + HL.level + (HL.std === "2" ? "" : "_v3");
  };
  HL.levelName = function (id) {
    var L = HL.levelList();
    for (var i = 0; i < L.length; i++) if (L[i].id === id) return L[i].name || String(id);
    return String(id);
  };
  HL.label = function () {
    if (HL.series === "yct") return "YCT " + HL.level;
    return "HSK " + HL.levelName(HL.level) + " (chuẩn " + HL.std + ".0)";
  };

  /* Vẽ hai nút chọn chuẩn 3.0 / 2.0 vào phần tử có id đã cho. */
  HL.renderStdChips = function (id) {
    var box = document.getElementById(id);
    if (!box) return;
    box.innerHTML = "";
    if (HL.series === "yct") return;
    var opts = HL.hasStd2() ? [["3", "Chuẩn HSK 3.0"], ["2", "Chuẩn HSK 2.0"]] : [["3", "Chuẩn HSK 3.0"]];
    opts.forEach(function (x) {
      var b = document.createElement("button");
      b.type = "button"; b.className = "chip"; b.textContent = x[1];
      b.setAttribute("aria-pressed", HL.std === x[0] ? "true" : "false");
      b.onclick = function () {
        if (HL.std === x[0]) return;
        var q = new URLSearchParams(location.search);
        q.set("level", HL.level); q.set("std", x[0]);
        location.search = q.toString();
      };
      box.appendChild(b);
    });
  };

  /* Nút chọn bộ (HSK / YCT) và các cấp độ đã có nội dung của bộ đó. */
  HL.renderLevelChips = function (id) {
    var box = document.getElementById(id);
    if (!box) return;
    box.innerHTML = "";
    var books = typeof BOOKS === "undefined" ? [{ id: "hsk", name: "HSK", ready: true }, { id: "yct", name: "YCT", ready: true }] : BOOKS;
    var row = document.createElement("label"); row.className = "bookrow";
    var cap = document.createElement("span"); cap.textContent = "Giáo trình"; row.appendChild(cap);
    var sel = document.createElement("select"); sel.className = "booksel"; sel.setAttribute("aria-label", "Giáo trình");
    books.forEach(function (s) {
      var o = document.createElement("option"); o.value = s.id; o.textContent = s.name + (s.ready ? "" : " (sắp có)");
      if (!s.ready) o.disabled = true;
      if (s.id === HL.series) o.selected = true;
      sel.appendChild(o);
    });
    sel.onchange = function () {
      if (sel.value === HL.series) return;
      var q = new URLSearchParams(location.search);
      q.set("level", 1); q.delete("std");
      if (sel.value === "yct") q.set("series", "yct"); else q.delete("series");
      location.search = q.toString();
    };
    row.appendChild(sel); box.appendChild(row);
    HL.levelList().filter(function (l) { return l.ready; }).forEach(function (l) {
      var b = document.createElement("button");
      b.type = "button"; b.className = "chip"; b.textContent = (HL.series === "yct" ? "YCT " : "HSK ") + (l.name || l.id);
      b.setAttribute("aria-pressed", l.id === HL.level ? "true" : "false");
      b.onclick = function () {
        if (l.id === HL.level) return;
        var q = new URLSearchParams(location.search);
        q.set("level", l.id);
        if (HL.series === "yct") q.delete("std"); else q.set("std", l.has2 === false ? "3" : HL.std);
        location.search = q.toString();
      };
      box.appendChild(b);
    });
  };

  window.HL = HL;
})();
