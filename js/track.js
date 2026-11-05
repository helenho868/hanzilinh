/* Ghi nhớ trang học gần nhất trên máy này, để trang chủ có nút "Tiếp tục học". */
(function () {
  var names = { "vocab.html": "Từ vựng", "quiz.html": "Ôn tập từ vựng", "fill.html": "Điền chỗ trống", "drag.html": "Kéo thả", "dialogue.html": "Hội thoại", "reading.html": "Đọc hiểu", "exam.html": "Luyện theo cấp độ", "bothu.html": "Bộ thủ", "hat.html": "Hát tiếng Trung" };
  var f = location.pathname.split("/").pop();
  if (!names[f]) return;
  var lv = "";
  if (window.HL && f !== "bothu.html") lv = HL.series === "yct" ? "YCT " + HL.level : "HSK " + HL.levelName(HL.level);
  try { localStorage.setItem("hanzilinh_last", JSON.stringify({ n: names[f], l: lv, u: f + location.search, t: Date.now() })); } catch (e) {}
})();
