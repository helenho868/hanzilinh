/* Dữ liệu dùng chung cho cả trang.
   Số từ là tổng số từ theo chuẩn HSK 2.0.
   ready: true khi cấp độ đã có nội dung, href là đường dẫn đến trang của cấp đó. */
var LEVELS = [
  { id: 1, zh: "一级", words: 150,  ready: true,  href: "vocab.html?level=1" },
  { id: 2, zh: "二级", words: 300,  ready: false, href: "" },
  { id: 3, zh: "三级", words: 600,  ready: false, href: "" },
  { id: 4, zh: "四级", words: 1200, ready: false, href: "" },
  { id: 5, zh: "五级", words: 2500, ready: false, href: "" },
  { id: 6, zh: "六级", words: 5000, ready: false, href: "" }
];

/* Các công cụ học. ready: true khi đã làm xong. */
var TOOLS = [
  { ic: "词", name: "Từ vựng",         desc: "Thẻ từ vựng theo cấp HSK, đánh dấu từ đã thuộc.", ready: true, href: "vocab.html?level=1" },
  { ic: "题", name: "Luyện đề",        desc: "Trắc nghiệm từ vựng và ngữ pháp, có chấm điểm và giải thích.", ready: false },
  { ic: "填", name: "Điền chỗ trống",  desc: "Kéo thả từ vào chỗ trống trong câu.", ready: false },
  { ic: "话", name: "Hội thoại",       desc: "Đoạn hội thoại ngắn theo chủ đề quen thuộc.", ready: false },
  { ic: "读", name: "Đọc hiểu",        desc: "Đoạn văn từ dễ đến khó kèm câu hỏi.", ready: false },
  { ic: "部", name: "Bộ thủ",          desc: "214 bộ thủ và cách nhớ chữ Hán.", ready: false }
];
