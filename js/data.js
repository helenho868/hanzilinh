/* Dữ liệu dùng chung cho cả trang.
   words: số từ theo chuẩn HSK 2.0. words3: tổng số từ theo chuẩn HSK 3.0 (nếu đã có dữ liệu).
   new3: số từ mới của cấp đó theo HSK 3.0. has2: có dữ liệu chuẩn 2.0 hay không.
   ready: true khi cấp độ đã có nội dung, href là đường dẫn đến trang của cấp đó. */
var LEVELS = [
  { id: 1, zh: "一级", words: 150, words3: 300, has2: true,  ready: true, href: "vocab.html?level=1" },
  { id: 2, zh: "二级", words: 300, words3: 500, new3: 200, has2: false, ready: true, href: "vocab.html?level=2" },
  { id: 3, zh: "三级", words: 600, words3: 1000, new3: 500, has2: false, ready: true, href: "vocab.html?level=3" },
  { id: 4, zh: "四级", words: 1200, words3: 2000, new3: 1000, has2: false, ready: true, href: "vocab.html?level=4" },
  { id: 5, zh: "五级", words: 2500, words3: 3600, new3: 1600, has2: false, ready: true, href: "vocab.html?level=5" },
  { id: 6, zh: "六级", words: 5000, words3: 5400, new3: 1800, has2: false, ready: true, href: "vocab.html?level=6" },
  { id: 7, name: "7–9", zh: "七至九级", words: 11000, words3: 11000, new3: 5600, has2: false, ready: true, href: "vocab.html?level=7" }
];

/* YCT (kỳ thi tiếng Trung cho thiếu nhi), 4 cấp viết. words: tổng số từ (cộng dồn), new: số từ mới của cấp.
   ready: true khi cấp đó đã có dữ liệu. */
var YCT_LEVELS = [
  { id: 1, zh: "一级", words: 80,  new: 80,  ready: true,  href: "vocab.html?series=yct&level=1" },
  { id: 2, zh: "二级", words: 150, new: 70,  ready: true,  href: "vocab.html?series=yct&level=2" },
  { id: 3, zh: "三级", words: 300, new: 150, ready: false, href: "vocab.html?series=yct&level=3" },
  { id: 4, zh: "四级", words: 600, new: 300, ready: false, href: "vocab.html?series=yct&level=4" }
];

/* Boya (博雅汉语), sơ cấp: Khởi bước (起步篇) I và II. Chia theo cấp độ. Chưa có nội dung. */
var BOYA_LEVELS = [
  { id: 1, name: "Khởi bước I",  zh: "起步篇 I",  ready: false },
  { id: 2, name: "Khởi bước II", zh: "起步篇 II", ready: false }
];

/* Giáo trình / bộ đề. ready: true khi đã có nội dung (dùng được trong các công cụ).
   frame: true khi trang chủ đã có khung cấp độ nhưng chưa có nội dung. */
var BOOKS = [
  { id: "hsk",  name: "HSK",     ready: true },
  { id: "yct",  name: "YCT",     ready: true },
  { id: "boya", name: "Boya",    ready: false, frame: true },
  { id: "301",  name: "301 câu", ready: false }
];

/* Các công cụ học. ready: true khi đã làm xong. */
var TOOLS = [
  { ic: "词", name: "Từ vựng",         desc: "Thẻ từ vựng theo cấp HSK, đánh dấu từ đã thuộc.", ready: true, href: "vocab.html?level=1" },
  { ic: "题", name: "Ôn tập từ vựng", desc: "Trắc nghiệm từ vựng, có chấm điểm và giải thích.", ready: true, href: "quiz.html?level=1" },
  { ic: "填", name: "Điền chỗ trống",  desc: "Chọn từ đúng để điền vào chỗ trống trong câu ví dụ.", ready: true, href: "fill.html?level=1" },
  { ic: "拖", name: "Kéo thả",        desc: "Kéo từ vào đúng câu ví dụ, mỗi phần 5 câu.", ready: true, href: "drag.html?level=1" },
  { ic: "话", name: "Hội thoại",       desc: "Đoạn hội thoại ngắn theo chủ đề, có nghe và tập vai.", ready: true, href: "dialogue.html?level=1" },
  { ic: "读", name: "Đọc hiểu",        desc: "Bài đọc ngắn từ dễ đến khó, kèm câu hỏi trắc nghiệm.", ready: true, href: "reading.html?level=1" },
  { ic: "歌", name: "Hát tiếng Trung", desc: "Xem video hát có phụ đề, bấm là tự phát, hát theo từng câu.", ready: true, href: "hat.html" },
  { ic: "考", name: "Luyện theo cấp độ", desc: "Đề thi thử từng cấp, có phần nghe, đọc, viết, đếm ngược và chấm điểm.", ready: true, href: "exam.html?level=1" },
  { ic: "部", name: "Bộ thủ",          desc: "214 bộ thủ: tên Hán Việt, nghĩa, ví dụ và bài kiểm tra.", ready: true, href: "bothu.html" }
];
