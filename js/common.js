/* Dùng chung cho trang từ vựng và trang luyện đề.
   level: cấp HSK (mặc định 1). std: chuẩn HSK, "3" (mặc định) hoặc "2". */
(function () {
  var p = new URLSearchParams(location.search);
  var HL = {
    level: parseInt(p.get("level"), 10) || 1,
    std: p.get("std") === "2" ? "2" : "3"
  };
  /* Cấp độ hiện tại có dữ liệu chuẩn 2.0 không? Nếu không thì chỉ dùng chuẩn 3.0. */
  HL.hasStd2 = function () {
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
    return HL.std === "2" ? "data/hsk" + HL.level + "-vocab.json"
                          : "data/hsk" + HL.level + "-v3-vocab.json";
  };
  /* Khóa lưu tiến độ. Chuẩn 2.0 giữ nguyên khóa cũ để không mất dữ liệu đã lưu. */
  HL.knownKey = function () {
    return "hanzilinh_known_hsk" + HL.level + (HL.std === "2" ? "" : "_v3");
  };
  HL.bestKey = function () {
    return "hanzilinh_best_hsk" + HL.level + (HL.std === "2" ? "" : "_v3");
  };
  HL.levelName = function (id) {
    for (var i = 0; i < LEVELS.length; i++) if (LEVELS[i].id === id) return LEVELS[i].name || String(id);
    return String(id);
  };
  HL.label = function () { return "HSK " + HL.levelName(HL.level) + " (chuẩn " + HL.std + ".0)"; };

  /* Vẽ hai nút chọn chuẩn 3.0 / 2.0 vào phần tử có id đã cho. */
  HL.renderStdChips = function (id) {
    var box = document.getElementById(id);
    if (!box) return;
    box.innerHTML = "";
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

  /* Nút chuyển giữa các cấp độ đã có nội dung. */
  HL.renderLevelChips = function (id) {
    var box = document.getElementById(id);
    if (!box || typeof LEVELS === "undefined") return;
    box.innerHTML = "";
    LEVELS.filter(function (l) { return l.ready; }).forEach(function (l) {
      var b = document.createElement("button");
      b.type = "button"; b.className = "chip"; b.textContent = "HSK " + (l.name || l.id);
      b.setAttribute("aria-pressed", l.id === HL.level ? "true" : "false");
      b.onclick = function () {
        if (l.id === HL.level) return;
        var q = new URLSearchParams(location.search);
        q.set("level", l.id); q.set("std", l.has2 === false ? "3" : HL.std);
        location.search = q.toString();
      };
      box.appendChild(b);
    });
  };

  window.HL = HL;
})();
