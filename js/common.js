/* Dùng chung cho trang từ vựng và trang luyện đề.
   level: cấp HSK (mặc định 1). std: chuẩn HSK, "3" (mặc định) hoặc "2". */
(function () {
  var p = new URLSearchParams(location.search);
  var HL = {
    level: parseInt(p.get("level"), 10) || 1,
    std: p.get("std") === "2" ? "2" : "3"
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
  HL.label = function () { return "HSK " + HL.level + " (chuẩn " + HL.std + ".0)"; };

  /* Vẽ hai nút chọn chuẩn 3.0 / 2.0 vào phần tử có id đã cho. */
  HL.renderStdChips = function (id) {
    var box = document.getElementById(id);
    if (!box) return;
    box.innerHTML = "";
    [["3", "Chuẩn HSK 3.0"], ["2", "Chuẩn HSK 2.0"]].forEach(function (x) {
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

  window.HL = HL;
})();
