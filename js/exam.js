/* Luyện theo cấp độ: mỗi lần bấm "Bắt đầu" tạo một đề mới từ dữ liệu từ vựng, hội thoại, bài đọc của trang.
   Số câu và các phần nghe / đọc / viết đặt trong SPEC. Phần nghe dùng giọng đọc của trình duyệt. */
(function () {
  var $ = function (id) { return document.getElementById(id); };
  function mk(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined && text !== null) e.textContent = text; return e; }
  function shuffle(a) { a = a.slice(); for (var k = a.length - 1; k > 0; k--) { var j = Math.floor(Math.random() * (k + 1)); var t = a[k]; a[k] = a[j]; a[j] = t; } return a; }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  var LET = "ABCDEF";
  var TF = ["✓ Đúng", "✗ Sai"];

  /* Cấu trúc đề. L = nghe, R = đọc, W = viết. g = loại câu (xem GEN), n = số câu, bank = dùng bảng đáp án chung A–F. */
  var SPEC = {
    yct: {
      1: { min: 30, src: "official", note: "Theo đề mẫu chính thức YCT 1 (Hanban): nghe 20 câu, đọc 15 câu, tổng khoảng 30 phút làm bài.", parts: [
        { s: "L", g: "pic_tf", n: 5, t: "Nghe và xem hình, chọn đúng hay sai" },
        { s: "L", g: "pic_choice", n: 5, t: "Nghe và chọn hình đúng (A, B, C)" },
        { s: "L", g: "tf_sentence", n: 5, t: "Nghe câu và xem câu cho sẵn, chọn đúng hay sai" },
        { s: "L", g: "qa_listen", n: 5, t: "Nghe câu hỏi, chọn câu trả lời (A, B, C)" },
        { s: "R", g: "pinyin_tf", n: 5, t: "Chữ Hán và phiên âm: đúng hay sai" },
        { s: "R", g: "cloze", bank: true, n: 5, t: "Chọn từ A–F điền vào câu (một từ thừa)" },
        { s: "R", g: "dlg_cloze", bank: true, n: 5, t: "Chọn từ A–F điền vào hội thoại (một từ thừa)" }] },
      2: { min: 45, src: "official", note: "Theo đề mẫu chính thức YCT 2 (Hanban): nghe 20 câu, đọc 20 câu, tổng khoảng 45 phút làm bài.", parts: [
        { s: "L", g: "pic_tf", n: 5, t: "Nghe và xem hình, chọn đúng hay sai" },
        { s: "L", g: "pic_match", n: 5, t: "Nghe và chọn hình A–F (một hình thừa)" },
        { s: "L", g: "passage_listen", n: 5, t: "Nghe đoạn ngắn, chọn đáp án (A, B, C)" },
        { s: "L", g: "qa_listen", n: 5, t: "Nghe câu hỏi, chọn câu trả lời (A, B, C)" },
        { s: "R", g: "pic_word_tf", n: 5, t: "Xem hình và từ, chọn đúng hay sai" },
        { s: "R", g: "qa_bank", n: 5, t: "Chọn câu A–F cho đoạn hội thoại (một câu thừa)" },
        { s: "R", g: "qa_bank", n: 5, t: "Ghép câu hỏi với câu trả lời A–F (một câu thừa)" },
        { s: "R", g: "dlg_cloze", bank: true, n: 5, t: "Chọn từ A–F điền vào hội thoại (một từ thừa)" }] }
    },
    hsk: {
      1: { min: 40, note: "HSK 3.0 cấp 1: 40 câu (nghe 20, đọc 20), khoảng 40 phút.", parts: [
        { s: "L", g: "pic_tf", n: 5, t: "Nghe và xem hình, chọn đúng hay sai" },
        { s: "L", g: "pic_match", n: 5, t: "Nghe và chọn hình A–F (một hình thừa)" },
        { s: "L", g: "qa_listen", n: 5, t: "Nghe câu hỏi, chọn câu trả lời" },
        { s: "L", g: "dict", n: 5, t: "Nghe từ, chọn chữ Hán đúng" },
        { s: "R", g: "pinyin_tf", n: 5, t: "Chữ Hán và phiên âm: đúng hay sai" },
        { s: "R", g: "pic_word", n: 5, t: "Xem hình, chọn từ đúng" },
        { s: "R", g: "cloze", bank: true, n: 5, t: "Chọn từ A–F điền vào câu (một từ thừa)" },
        { s: "R", g: "qa_bank", n: 5, t: "Ghép câu hỏi với câu trả lời A–F (một câu thừa)" }] },
      2: { min: 60, note: "HSK 3.0 cấp 2: 60 câu (nghe 25, đọc 25, viết 10), khoảng 60 phút.", parts: [
        { s: "L", g: "pic_tf", n: 5, t: "Nghe và xem hình, chọn đúng hay sai" },
        { s: "L", g: "pic_match", n: 5, t: "Nghe và chọn hình A–F (một hình thừa)" },
        { s: "L", g: "qa_listen", n: 5, t: "Nghe câu hỏi, chọn câu trả lời" },
        { s: "L", g: "passage_listen", n: 5, t: "Nghe đoạn ngắn, chọn đáp án" },
        { s: "L", g: "dict", n: 5, t: "Nghe từ, chọn chữ Hán đúng" },
        { s: "R", g: "word_mean", n: 5, t: "Chọn nghĩa đúng của từ" },
        { s: "R", g: "cloze", bank: true, n: 5, t: "Chọn từ A–F điền vào câu (một từ thừa)" },
        { s: "R", g: "qa_bank", n: 5, t: "Ghép câu hỏi với câu trả lời A–F (một câu thừa)" },
        { s: "R", g: "dlg_cloze", n: 5, t: "Chọn từ điền vào hội thoại" },
        { s: "R", g: "passage", n: 5, t: "Đọc đoạn văn, chọn đáp án" },
        { s: "W", g: "order", n: 5, t: "Sắp xếp các từ thành câu" },
        { s: "W", g: "hanzi_pick", n: 5, t: "Chọn chữ Hán đúng theo phiên âm và nghĩa" }] },
      3: { min: 83, note: "HSK 3.0 cấp 3: 70 câu (nghe 30, đọc 30, viết 10), khoảng 83 phút. Phần nói thi riêng, chưa có ở đây.", parts: [
        { s: "L", g: "dict", n: 10, t: "Nghe từ, chọn chữ Hán đúng" },
        { s: "L", g: "qa_listen", n: 10, t: "Nghe câu hỏi, chọn câu trả lời" },
        { s: "L", g: "passage_listen", n: 10, t: "Nghe đoạn văn, chọn đáp án" },
        { s: "R", g: "cloze", n: 10, t: "Chọn từ điền vào câu" },
        { s: "R", g: "dlg_cloze", n: 10, t: "Chọn từ điền vào hội thoại" },
        { s: "R", g: "passage", n: 10, t: "Đọc đoạn văn, chọn đáp án" },
        { s: "W", g: "order", n: 5, t: "Sắp xếp các từ thành câu" },
        { s: "W", g: "hanzi_pick", n: 5, t: "Chọn chữ Hán đúng theo phiên âm và nghĩa" }] },
      4: { min: 85, note: "HSK 3.0 cấp 4: 70 câu (nghe 32, đọc 32, viết 6), khoảng 85 phút. Phần nói thi riêng, chưa có ở đây.", parts: [
        { s: "L", g: "dict", n: 8, t: "Nghe từ, chọn chữ Hán đúng" },
        { s: "L", g: "qa_listen", n: 12, t: "Nghe câu hỏi, chọn câu trả lời" },
        { s: "L", g: "passage_listen", n: 12, t: "Nghe đoạn văn, chọn đáp án" },
        { s: "R", g: "cloze", n: 12, t: "Chọn từ điền vào câu" },
        { s: "R", g: "dlg_cloze", n: 10, t: "Chọn từ điền vào hội thoại" },
        { s: "R", g: "passage", n: 10, t: "Đọc đoạn văn, chọn đáp án" },
        { s: "W", g: "order", n: 6, t: "Sắp xếp các từ thành câu" }] },
      5: { min: 110, note: "HSK 3.0 cấp 5: 72 câu (nghe 35, đọc 35, viết 2 bài), khoảng 110 phút. Phần nói thi riêng, chưa có ở đây. Bài viết không chấm tự động.", parts: [
        { s: "L", g: "dict", n: 10, t: "Nghe từ, chọn chữ Hán đúng" },
        { s: "L", g: "qa_listen", n: 10, t: "Nghe câu hỏi, chọn câu trả lời" },
        { s: "L", g: "passage_listen", n: 15, t: "Nghe đoạn văn, chọn đáp án" },
        { s: "R", g: "cloze", n: 12, t: "Chọn từ điền vào câu" },
        { s: "R", g: "dlg_cloze", n: 11, t: "Chọn từ điền vào hội thoại" },
        { s: "R", g: "passage", n: 12, t: "Đọc đoạn văn, chọn đáp án" },
        { s: "W", g: "essay", n: 2, t: "Viết đoạn văn bằng các từ cho sẵn (tự viết, không chấm)" }] },
      6: { min: 125, note: "HSK 3.0 cấp 6: 82 câu (nghe 40, đọc 40, viết 2 bài), khoảng 125 phút. Phần nói thi riêng, chưa có ở đây. Bài viết không chấm tự động.", parts: [
        { s: "L", g: "dict", n: 10, t: "Nghe từ, chọn chữ Hán đúng" },
        { s: "L", g: "qa_listen", n: 10, t: "Nghe câu hỏi, chọn câu trả lời" },
        { s: "L", g: "passage_listen", n: 20, t: "Nghe đoạn văn, chọn đáp án" },
        { s: "R", g: "cloze", n: 15, t: "Chọn từ điền vào câu" },
        { s: "R", g: "dlg_cloze", n: 15, t: "Chọn từ điền vào hội thoại" },
        { s: "R", g: "passage", n: 10, t: "Đọc đoạn văn, chọn đáp án" },
        { s: "W", g: "essay", n: 2, t: "Viết đoạn văn bằng các từ cho sẵn (tự viết, không chấm)" }] }
    }
  };
  var SEC = { L: "Phần 1: Nghe", R: "Phần 2: Đọc", W: "Phần 3: Viết" };

  var KEYS = ["什么时候", "为什么", "什么", "谁", "哪儿", "哪", "几", "多少", "怎么样", "怎么", "吗", "呢", "吧"];
  function qkey(zh) { for (var i = 0; i < KEYS.length; i++) if (zh.indexOf(KEYS[i]) >= 0) return KEYS[i]; return ""; }
  function isQ(zh) { var k = qkey(zh); return /[？?]$/.test(zh) && k !== "" && k !== "呢" && k !== "吧"; }

  /* ---------- dữ liệu ---------- */
  var D = { words: [], pairs: [], lines: [], pass: [] };
  var canSpeak = !!window.speechSynthesis && typeof window.SpeechSynthesisUtterance !== "undefined";
  var spec = null, parts = [], answers = [], flat = [], used = {}, timerId = null, endAt = 0, submitted = false;

  function wkey(w) { return w.hanzi + "|" + w.pinyin; }
  /* Lấy n từ từ danh sách, ưu tiên từ chưa dùng trong đề này. */
  function take(list, n) {
    var fresh = shuffle(list.filter(function (w) { return !used[wkey(w)]; }));
    var rest = shuffle(list.filter(function (w) { return used[wkey(w)]; }));
    var out = fresh.concat(rest).slice(0, n);
    out.forEach(function (w) { used[wkey(w)] = 1; });
    return out;
  }
  /* Chỉ dùng emoji làm "hình" cho các từ cụ thể, vẽ được (đồ vật, con vật, đồ ăn, nghề, nơi chốn, hành động quen thuộc). */
  var PIC = {};
  ("爸爸 鼻子 吃 耳朵 哥哥 狗 喝 家 姐姐 看 老师 妈妈 猫 米饭 面条 鸟 牛奶 苹果 商店 手 水 弟弟 学校 眼睛 鱼 月 茶 打电话 电视 房间 红 画 黄 脚 绿 买 妹妹 铅笔 书包 睡觉 同学 学生 香蕉 熊猫 医生 医院 椅子 桌子 坐 热 冷 学习 玩 起床 朋友 高兴 " +
   "白天 杯子 本 病 菜 唱 超市 车 穿 出租车 大学 电话 电脑 电影 电影院 饭店 飞机 歌 公司 鸡蛋 饺子 火车 开车 看病 面包 面条儿 手机 书 书店 水果 衣服 雨 雪 下雨 做饭 写 听 " +
   "白色 包 本子 笔 车站 床 地铁 公交车 黑色 红茶 红色 绿茶 绿色 机场 咖啡 裤子 篮球 门 奶茶 奶奶 爷爷 球 肉 手表 药 药店 足球 跑步 游泳 跳舞 机票 酒店 楼 路 生日 洗手间 洗 笑 男孩儿 女孩儿 小孩儿 吃饭").split(" ").forEach(function (h) { PIC[h] = 1; });
  function withEmoji(list) { return list.filter(function (w) { return w.emoji && PIC[w.hanzi]; }); }
  /* Câu điền từ: với HSK ưu tiên từ từ 2 chữ trở lên (từ một chữ dễ khớp nhiều chỗ trống). */
  function clozeBase() { var all = withEx(D.words); if (HL.series === "yct") return all; var long = all.filter(function (w) { return w.hanzi.length >= 2; }); return long.length >= 40 ? long : all; }
  function withEx(list) { return list.filter(function (w) { return w.ex && w.ex.zh && w.ex.zh.indexOf(w.hanzi) >= 0; }); }
  function distract(w, k, sameLen) {
    var pool = shuffle(D.words.filter(function (o) { return o.hanzi !== w.hanzi && o.hanzi.indexOf(w.hanzi) < 0 && w.hanzi.indexOf(o.hanzi) < 0; }));
    var s = pool.filter(function (o) { return o.hanzi.length === w.hanzi.length; });
    var r = pool.filter(function (o) { return o.hanzi.length !== w.hanzi.length; });
    var out = [], seen = {};
    (sameLen === false ? pool : s.concat(r)).forEach(function (o) { if (out.length < k && !seen[o.hanzi]) { seen[o.hanzi] = 1; out.push(o); } });
    return out;
  }
  /* Kho câu của cấp độ, để kiểm tra một từ khác có "lọt" vào chỗ trống không (giảm câu có hai đáp án). */
  var CORPUS = "";
  function conflicts(sentence, words, ans) {
    var i = sentence.indexOf("＿＿"); if (i < 0) return 0;
    var L = sentence.charAt(i - 1), R = sentence.charAt(i + 2), n = 0;
    words.forEach(function (w) {
      if (w.hanzi === ans.hanzi) return;
      var hit = (L && R) ? CORPUS.indexOf(L + w.hanzi + R) >= 0 : (L ? CORPUS.indexOf(L + w.hanzi) >= 0 : (R ? CORPUS.indexOf(w.hanzi + R) >= 0 : false));
      if (hit) n++;
    });
    return n;
  }
  function scriptW(w) { return { zh: w.hanzi, py: w.pinyin, vi: w.vi }; }
  function mc(o) { o.type = "mc"; return o; }
  function place(opts, correct) { var all = shuffle(opts); return { opts: all, a: all.indexOf(correct) }; }
  function tf(truth) { return { opts: TF, a: truth ? 0 : 1 }; }
  function blank(zh, h) { var i = zh.indexOf(h); return zh.slice(0, i) + "＿＿" + zh.slice(i + h.length); }

  /* ---------- các loại câu ---------- */
  var GEN = {
    pic_tf: function (n) {
      return take(withEmoji(D.words), n).map(function (w) {
        var t = Math.random() < 0.5, other = pick(withEmoji(D.words).filter(function (o) { return o.emoji !== w.emoji; }));
        return mc(Object.assign({ audio: w.hanzi, big: t ? w.emoji : other.emoji, why: "Từ nghe được: " + w.hanzi + " (" + w.pinyin + "), " + w.vi + ".", script: scriptW(w) }, tf(t)));
      });
    },
    pic_choice: function (n) {
      return take(withEmoji(D.words), n).map(function (w) {
        var ds = shuffle(withEmoji(D.words).filter(function (o) { return o.emoji !== w.emoji; })).slice(0, 2);
        var p = place([w.emoji, ds[0].emoji, ds[1].emoji], w.emoji);
        return mc({ audio: w.hanzi, emojiOpts: true, opts: p.opts, a: p.a, why: "Từ nghe được: " + w.hanzi + " (" + w.pinyin + "), " + w.vi + ".", script: scriptW(w) });
      });
    },
    pic_match: function (n, part) {
      var seen = {}, ws = shuffle(withEmoji(D.words)).filter(function (w) { if (seen[w.emoji]) return false; seen[w.emoji] = 1; return true; }).slice(0, 6);
      ws.forEach(function (w) { used[wkey(w)] = 1; });
      part.bank = shuffle(ws.map(function (w) { return w.emoji; })); part.bankEmoji = true;
      return ws.slice(0, n).map(function (w) {
        return mc({ audio: w.hanzi, bankQ: true, opts: part.bank, a: part.bank.indexOf(w.emoji), why: "Từ nghe được: " + w.hanzi + " (" + w.pinyin + "), " + w.vi + ".", script: scriptW(w) });
      });
    },
    tf_sentence: function (n) {
      var ws = take(withEx(D.words), n);
      return ws.map(function (w) {
        var t = Math.random() < 0.5, o = pick(withEx(D.words).filter(function (x) { return x.ex.zh !== w.ex.zh; }));
        return mc(Object.assign({ audio: w.ex.zh, text: (t ? w.ex : o.ex).zh, why: "Câu nghe được: " + w.ex.zh + " (" + w.ex.vi + ").", script: w.ex }, tf(t)));
      });
    },
    qa_listen: function (n) {
      var qs = shuffle(D.pairs), out = [], keys = {};
      for (var i = 0; i < qs.length && out.length < n; i++) {
        var p = qs[i], ds = shuffle(D.pairs.filter(function (o) { return o.key !== p.key && o.a.zh !== p.a.zh && o.a.zh.length >= 2; })).slice(0, 2);
        if (ds.length < 2) continue;
        var pl = place([p.a.zh, ds[0].a.zh, ds[1].a.zh], p.a.zh);
        out.push(mc({ audio: p.q.zh, opts: pl.opts, a: pl.a, why: "Câu hỏi: " + p.q.zh + " (" + p.q.vi + "). Trả lời: " + p.a.zh + " (" + p.a.vi + ").", script: p.q }));
      }
      return out;
    },
    dict: function (n) {
      return take(D.words, n).map(function (w) {
        var ds = distract(w, 3), pl = place([w.hanzi].concat(ds.map(function (o) { return o.hanzi; })), w.hanzi);
        return mc({ audio: w.hanzi, opts: pl.opts, a: pl.a, zhOpts: true, why: w.hanzi + " (" + w.pinyin + "): " + w.vi + ".", script: scriptW(w) });
      });
    },
    passage_listen: function (n) { return passageQs(n, true); },
    passage: function (n) { return passageQs(n, false); },
    pinyin_tf: function (n) {
      return take(D.words, n).map(function (w) {
        var t = Math.random() < 0.5, sy = w.pinyin.split(/\s+/).length;
        var same = D.words.filter(function (x) { return x.pinyin !== w.pinyin && x.pinyin.split(/\s+/).length === sy; });
        var o = pick(same.length ? same : D.words.filter(function (x) { return x.pinyin !== w.pinyin; }));
        return mc(Object.assign({ text: w.hanzi, sub: t ? w.pinyin : o.pinyin, why: w.hanzi + " đọc là " + w.pinyin + " (" + w.vi + ").", script: scriptW(w), zhText: true }, tf(t)));
      });
    },
    pic_word_tf: function (n) {
      return take(withEmoji(D.words), n).map(function (w) {
        var t = Math.random() < 0.5, o = pick(withEmoji(D.words).filter(function (x) { return x.emoji !== w.emoji; }));
        return mc(Object.assign({ text: w.hanzi, big: t ? w.emoji : o.emoji, zhText: true, why: w.hanzi + " (" + w.pinyin + "): " + w.vi + ".", script: scriptW(w) }, tf(t)));
      });
    },
    pic_word: function (n) {
      return take(withEmoji(D.words), n).map(function (w) {
        var ds = distract(w, 3), pl = place([w.hanzi].concat(ds.map(function (o) { return o.hanzi; })), w.hanzi);
        return mc({ big: w.emoji, opts: pl.opts, a: pl.a, zhOpts: true, why: w.hanzi + " (" + w.pinyin + "): " + w.vi + ".", script: scriptW(w) });
      });
    },
    word_mean: function (n) {
      return take(D.words, n).map(function (w) {
        var ds = shuffle(D.words.filter(function (o) { return o.vi !== w.vi && o.hanzi !== w.hanzi; })).slice(0, 3), pl = place([w.vi].concat(ds.map(function (o) { return o.vi; })), w.vi);
        return mc({ text: w.hanzi, sub: w.pinyin, zhText: true, opts: pl.opts, a: pl.a, why: w.hanzi + " (" + w.pinyin + "): " + w.vi + ".", script: scriptW(w) });
      });
    },
    cloze: function (n, part) {
      if (part.bank) {
        var base = clozeBase(), fresh = base.filter(function (w) { return !used[wkey(w)]; });
        if (fresh.length < 12) fresh = base;
        var best = null, bs = 1e9;
        for (var t = 0; t < 30; t++) {
          var c = shuffle(fresh).slice(0, 6), sc = 0;
          c.slice(0, n).forEach(function (w) { sc += conflicts(blank(w.ex.zh, w.hanzi), c, w); });
          if (sc < bs) { bs = sc; best = c; } if (sc === 0) break;
        }
        var ws = best; ws.forEach(function (w) { used[wkey(w)] = 1; });
        part.bank = shuffle(ws.map(function (w) { return w.hanzi; })); part.bankZh = true;
        return ws.slice(0, n).map(function (w) { return mc({ text: blank(w.ex.zh, w.hanzi), zhText: true, bankQ: true, opts: part.bank, a: part.bank.indexOf(w.hanzi), why: w.ex.zh + " (" + w.ex.vi + "). Từ cần điền: " + w.hanzi + " (" + w.pinyin + "), " + w.vi + ".", script: w.ex }); });
      }
      return take(clozeBase(), n).map(function (w) {
        var ds = distract(w, 3), pl = place([w.hanzi].concat(ds.map(function (o) { return o.hanzi; })), w.hanzi);
        return mc({ text: blank(w.ex.zh, w.hanzi), zhText: true, zhOpts: true, opts: pl.opts, a: pl.a, why: w.ex.zh + " (" + w.ex.vi + "). Từ cần điền: " + w.hanzi + " (" + w.pinyin + "), " + w.vi + ".", script: w.ex });
      });
    },
    dlg_cloze: function (n, part) {
      function draw() {
        var cands = shuffle(D.lines.filter(function (c) { return c.w; })), out = [], ws = [];
        for (var i = 0; i < cands.length && out.length < n; i++) {
          var c = cands[i];
          if (ws.some(function (x) { return x.hanzi === c.w.hanzi || x.hanzi.indexOf(c.w.hanzi) >= 0 || c.w.hanzi.indexOf(x.hanzi) >= 0; })) continue;
          ws.push(c.w); out.push(c);
        }
        var bank = ws.slice();
        if (part.bank) { var ex = distract(ws[0], 1, false).filter(function (o) { return ws.every(function (x) { return x.hanzi !== o.hanzi; }); }); bank = ws.concat(ex.slice(0, 6 - ws.length)); }
        var sc = 0; out.forEach(function (c) { sc += conflicts(blank(c.l.zh, c.w.hanzi), bank, c.w); });
        return { out: out, bank: bank, sc: sc };
      }
      var best = draw();
      for (var t = 0; t < 30 && best.sc > 0; t++) { var d = draw(); if (d.sc < best.sc) best = d; }
      var out = best.out, res = [];
      if (part.bank) { part.bank = shuffle(best.bank.map(function (w) { return w.hanzi; })); part.bankZh = true; }
      out.forEach(function (c) {
        var st = (c.prev ? c.prev.zh + "\n" : "") + blank(c.l.zh, c.w.hanzi);
        var why = (c.prev ? c.prev.zh + " (" + c.prev.vi + ")\n" : "") + c.l.zh + " (" + c.l.vi + "). Từ cần điền: " + c.w.hanzi + " (" + c.w.pinyin + "), " + c.w.vi + ".";
        if (part.bank) res.push(mc({ text: st, zhText: true, bankQ: true, opts: part.bank, a: part.bank.indexOf(c.w.hanzi), why: why, script: c.l }));
        else { var ds = distract(c.w, 3), pl = place([c.w.hanzi].concat(ds.map(function (o) { return o.hanzi; })), c.w.hanzi); res.push(mc({ text: st, zhText: true, zhOpts: true, opts: pl.opts, a: pl.a, why: why, script: c.l })); }
      });
      return res;
    },
    qa_bank: function (n, part) {
      var cand = shuffle(D.pairs), chosen = [], keys = {};
      cand.forEach(function (p) { if (chosen.length < n && !keys[p.key] && p.a.zh.length >= 2) { keys[p.key] = 1; chosen.push(p); } });
      if (chosen.length < n) cand.forEach(function (p) { if (chosen.length < n && chosen.indexOf(p) < 0) chosen.push(p); });
      var ex = cand.filter(function (p) { return chosen.indexOf(p) < 0 && !keys[p.key] && p.a.zh.length >= 2; })[0] || cand.filter(function (p) { return chosen.indexOf(p) < 0; })[0];
      var bankItems = chosen.map(function (p) { return p.a.zh; }).concat(ex ? [ex.a.zh] : []);
      part.bank = shuffle(bankItems); part.bankZh = true; part.bankWide = true;
      return chosen.map(function (p) { return mc({ text: p.q.zh, zhText: true, bankQ: true, opts: part.bank, a: part.bank.indexOf(p.a.zh), why: p.q.zh + " (" + p.q.vi + "). Trả lời: " + p.a.zh + " (" + p.a.vi + ").", script: p.q }); });
    },
    order: function (n) {
      var cands = shuffle(D.words.filter(function (w) { return w.ex && w.ex.zh; })), out = [];
      for (var i = 0; i < cands.length && out.length < n; i++) {
        var toks = tokenize(cands[i].ex.zh);
        if (toks.length < 3 || toks.length > 8) continue;
        var sh = shuffle(toks), tries = 0;
        while (sh.join("") === toks.join("") && tries++ < 5) sh = shuffle(toks);
        out.push({ type: "order", tokens: sh, target: toks.join(""), end: /[？?]$/.test(cands[i].ex.zh) ? "？" : "。", why: "Câu đúng: " + cands[i].ex.zh + " (" + cands[i].ex.vi + "). Một số câu có thể sắp xếp theo cách khác cũng đúng nghĩa, nhưng bài chỉ chấm theo câu gốc.", script: cands[i].ex });
      }
      return out;
    },
    hanzi_pick: function (n) {
      return take(D.words, n).map(function (w) {
        var ds = distract(w, 3), pl = place([w.hanzi].concat(ds.map(function (o) { return o.hanzi; })), w.hanzi);
        return mc({ text: w.pinyin, sub: w.vi, opts: pl.opts, a: pl.a, zhOpts: true, why: w.hanzi + " (" + w.pinyin + "): " + w.vi + ".", script: scriptW(w) });
      });
    },
    essay: function (n) {
      var ws = shuffle(D.words.filter(function (w) { return w.hanzi.length >= 2; })), out = [];
      for (var i = 0; i < n; i++) out.push({ type: "essay", words: ws.slice(i * 5, i * 5 + 5), why: "Bài viết không chấm tự động. Hãy tự kiểm tra: đã dùng đủ 5 từ chưa, câu có đúng ngữ pháp và dấu câu chưa." });
      return out;
    }
  };

  /* Câu hỏi bài đọc. Nghe dùng đoạn 1–3, đọc dùng đoạn 4–5 để một bài không lặp lại cùng câu hỏi. */
  function passageQs(n, listen) {
    var ps = D.pass.filter(function (p, i) { return listen ? i < 3 : i >= 3; }), pool = [];
    ps.forEach(function (p) { p.questions.forEach(function (q) { pool.push({ p: p, q: q }); }); });
    var chosen = shuffle(pool).slice(0, n);
    chosen.sort(function (a, b) { return a.p.id - b.p.id; });
    var lastId = null;
    return chosen.map(function (x) {
      var pl = place(x.q.opts, x.q.opts[x.q.a]);
      var lines = x.p.text.map(function (l) { return l.zh; }), firstOfPassage = x.p.id !== lastId; lastId = x.p.id;
      return mc({ audio: listen ? lines : null, passage: (!listen && firstOfPassage) ? lines.join("") : null, passageNote: (!listen && !firstOfPassage), text: x.q.zh, zhText: true, opts: pl.opts, a: pl.a, zhOpts: true, why: x.q.why + " (" + x.q.vi + ")", script: { zh: lines.join(""), py: "", vi: x.p.text.map(function (l) { return l.vi; }).join(" ") } });
    });
  }

  /* Cắt câu thành các từ bằng cách khớp từ dài nhất trong danh sách từ của cấp độ. */
  var VOCSET = null, EXTRA = [];
  function tokenize(zh) {
    if (!VOCSET) { VOCSET = {}; D.words.concat(EXTRA).forEach(function (w) { VOCSET[w.hanzi] = 1; }); }
    var out = [];
    zh.split(/[，。！？、；：,.!?;:“”"‘’（）()\s]+/).forEach(function (clause) {
      var i = 0;
      while (i < clause.length) {
        var best = 1;
        for (var L = Math.min(4, clause.length - i); L > 1; L--) if (VOCSET[clause.substr(i, L)]) { best = L; break; }
        out.push(clause.substr(i, best)); i += best;
      }
    });
    return out;
  }

  /* ---------- dựng đề ---------- */
  function buildTest() {
    used = {}; parts = []; flat = [];
    spec.parts.forEach(function (ps) {
      var part = { s: ps.s, g: ps.g, t: ps.t, bank: ps.bank ? true : false, qs: [] };
      var qs = GEN[ps.g](ps.n, part);
      var pad = ps.s === "L" ? "dict" : (ps.s === "R" ? "cloze" : null);
      if (qs.length < ps.n && pad && !part.bank) qs = qs.concat(GEN[pad](ps.n - qs.length, { bank: false }));
      part.qs = qs.slice(0, ps.n);
      parts.push(part);
    });
    parts.forEach(function (p) { p.qs.forEach(function (q) { q.part = p; q.n = flat.length + 1; flat.push(q); }); });
    answers = flat.map(function () { return null; });
  }

  /* ---------- giọng đọc ---------- */
  function zhVoice() { try { var vs = speechSynthesis.getVoices() || []; for (var k = 0; k < vs.length; k++) if (/^zh/i.test(vs[k].lang)) return vs[k]; } catch (e) {} return null; }
  var speakTok = 0;
  function speakList(lines, btn) {
    if (!canSpeak) { $("nospeech").classList.remove("hide"); return; }
    var my = ++speakTok;
    try { speechSynthesis.cancel(); } catch (e) {}
    document.querySelectorAll(".play.on").forEach(function (b) { b.classList.remove("on"); });
    btn.classList.add("on");
    (function next(i) {
      if (my !== speakTok) return;
      if (i >= lines.length) { btn.classList.remove("on"); return; }
      var u = new SpeechSynthesisUtterance(lines[i]); u.lang = "zh-CN"; u.rate = 0.85;
      var v = zhVoice(); if (v) u.voice = v;
      u.onend = function () { setTimeout(function () { next(i + 1); }, 300); };
      u.onerror = function () { btn.classList.remove("on"); };
      try { speechSynthesis.speak(u); } catch (e) { btn.classList.remove("on"); }
    })(0);
  }

  /* ---------- vẽ đề ---------- */
  var secDone = {};
  function render() {
    var box = $("paper"); box.innerHTML = ""; secDone = {};
    var lastSec = "";
    parts.forEach(function (p, pi) {
      if (p.s !== lastSec) { lastSec = p.s; box.appendChild(mk("h2", "esec", SEC[p.s])); }
      var first = p.qs[0].n, last = p.qs[p.qs.length - 1].n;
      var card = mk("section", "epart");
      card.appendChild(mk("h3", "", "Câu " + first + "–" + last + ": " + p.t));
      if (p.g === "order") card.appendChild(mk("p", "esub", "Chạm vào từng từ theo thứ tự để ghép thành câu. Chạm lại để bỏ từ ra."));
      if (p.bank && p.bank.length && p.qs[0].bankQ) {
        var lg = mk("div", "legend" + (p.bankEmoji ? " big" : "") + (p.bankWide ? " wide" : ""));
        p.bank.forEach(function (b, i) { var it = mk("span", "lg" + (p.bankZh ? " zh" : "")); it.appendChild(mk("b", "", LET[i])); it.appendChild(document.createTextNode(" " + b)); lg.appendChild(it); });
        card.appendChild(lg);
      }
      p.qs.forEach(function (q) { card.appendChild(renderQ(q)); });
      box.appendChild(card);
    });
  }

  function renderQ(q) {
    var i = q.n - 1, el = mk("div", "eq"); el.id = "q" + q.n;
    var head = mk("div", "eqh"); head.appendChild(mk("span", "num", String(q.n)));
    if (q.audio) {
      var lines = Array.isArray(q.audio) ? q.audio : [q.audio];
      var b = mk("button", "play", "▶ Nghe"); b.type = "button"; b.onclick = function () { speakList(lines, b); };
      head.appendChild(b);
    }
    el.appendChild(head);
    if (q.passage) el.appendChild(mk("p", "epass zh", q.passage));
    if (q.passageNote) el.appendChild(mk("p", "esub", "Câu hỏi về đoạn văn ở trên."));
    if (q.big) el.appendChild(mk("div", "ebig", q.big));
    if (q.text) el.appendChild(mk("p", "etext" + (q.zhText ? " zh" : ""), q.text));
    if (q.sub) el.appendChild(mk("p", "esub", q.sub));
    if (q.type === "mc") {
      var ob = mk("div", "eopts" + (q.emojiOpts ? " emo" : "") + (q.bankQ ? " bk" : "") + (q.opts === TF ? " tfo" : ""));
      q.opts.forEach(function (o, k) {
        var b = mk("button", "eopt" + (q.zhOpts ? " zh" : "")); b.type = "button";
        b.textContent = q.bankQ ? LET[k] : (q.emojiOpts ? o : (q.opts === TF ? o : LET[k] + ". " + o));
        b.setAttribute("aria-pressed", "false");
        b.onclick = function () {
          if (submitted) return;
          answers[i] = k;
          Array.prototype.forEach.call(ob.children, function (c, x) { c.setAttribute("aria-pressed", x === k ? "true" : "false"); });
          updateCount();
        };
        ob.appendChild(b);
      });
      el.appendChild(ob);
    } else if (q.type === "order") {
      answers[i] = [];
      var tgt = mk("div", "otgt"), pool = mk("div", "opool");
      el.appendChild(mk("p", "esub", "Câu kết thúc bằng " + q.end));
      el.appendChild(tgt); el.appendChild(pool);
      var chips = q.tokens.map(function (t, k) {
        var c = mk("button", "otok zh", t); c.type = "button";
        c.onclick = function () {
          if (submitted) return;
          var at = answers[i].indexOf(k);
          if (at >= 0) { answers[i].splice(at, 1); pool.appendChild(c); } else { answers[i].push(k); tgt.appendChild(c); }
          updateCount();
        };
        pool.appendChild(c); return c;
      });
      q.chips = chips;
    } else if (q.type === "essay") {
      el.appendChild(mk("p", "etext", "Dùng các từ sau để viết một đoạn văn ngắn:"));
      el.appendChild(mk("p", "etext zh", q.words.map(function (w) { return w.hanzi; }).join("   ")));
      var ta = mk("textarea", "eta"); ta.rows = 5; ta.placeholder = "Viết ở đây (có thể gõ chữ Hán hoặc viết ra giấy)";
      el.appendChild(ta);
    }
    el.appendChild(mk("div", "ewhy hide"));
    return el;
  }

  function isAnswered(q, i) {
    if (q.type === "mc") return answers[i] !== null;
    if (q.type === "order") return answers[i].length === q.tokens.length;
    return true;
  }
  function gradable(q) { return q.type !== "essay"; }
  function updateCount() {
    var done = 0, tot = 0;
    flat.forEach(function (q, i) { if (!gradable(q)) return; tot++; if (isAnswered(q, i)) done++; });
    $("bdone").textContent = "Đã làm " + done + "/" + tot;
  }
  function fmt(sec) { var m = Math.floor(sec / 60), s = sec % 60; return m + ":" + (s < 10 ? "0" : "") + s; }
  function tick() {
    var left = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
    var t = $("btimer"); t.textContent = "⏱ " + fmt(left); t.classList.toggle("low", left <= 300);
    if (left <= 0) submit(true);
  }

  /* ---------- nộp bài và xem lại ---------- */
  function submit(auto) {
    if (submitted) return;
    submitted = true;
    if (timerId) { clearInterval(timerId); timerId = null; }
    try { speechSynthesis.cancel(); } catch (e) {}
    speakTok++;
    var sc = { L: [0, 0], R: [0, 0], W: [0, 0] };
    flat.forEach(function (q, i) {
      var el = $("q" + q.n), why = el.querySelector(".ewhy"), ok = null;
      if (gradable(q)) {
        if (q.type === "mc") {
          ok = answers[i] === q.a;
          Array.prototype.forEach.call(el.querySelectorAll(".eopt"), function (b, k) {
            b.disabled = true;
            if (k === q.a) b.classList.add("ok"); else if (k === answers[i]) b.classList.add("no");
          });
        } else if (q.type === "order") {
          ok = answers[i].map(function (k) { return q.tokens[k]; }).join("") === q.target;
          q.chips.forEach(function (c) { c.disabled = true; });
        }
        sc[q.part.s][1]++; if (ok) sc[q.part.s][0]++;
        el.classList.add(ok ? "right" : "wrong");
      } else el.querySelector(".eta").disabled = true;
      var t = (gradable(q) ? (ok ? "Đúng. " : (answers[i] === null || (q.type === "order" && !isAnswered(q, i)) ? "Chưa trả lời. " : "Sai. ")) : "") + (q.why || "");
      why.textContent = t; why.classList.remove("hide");
      if (q.script && q.script.zh && q.audio) {
        var s = mk("p", "escript"); s.textContent = "Lời nghe: " + q.script.zh + (q.script.py ? "  " + q.script.py : "") + (q.script.vi ? "  (" + q.script.vi + ")" : "");
        why.appendChild(s);
      }
    });
    var tot = 0, right = 0; ["L", "R", "W"].forEach(function (k) { tot += sc[k][1]; right += sc[k][0]; });
    var rows = [];
    ["L", "R", "W"].forEach(function (k) { if (sc[k][1]) rows.push(SEC[k].replace(/^Phần \d: /, "") + ": " + sc[k][0] + "/" + sc[k][1]); });
    $("sc").textContent = right + "/" + tot;
    $("scd").textContent = rows.join("  ·  ");
    var pct = tot ? Math.round(right * 100 / tot) : 0;
    $("scm").textContent = (auto ? "Hết giờ, bài đã được nộp. " : "") + "Tỷ lệ đúng " + pct + "%. Điểm này chỉ là số câu đúng, không quy đổi sang thang điểm chính thức.";
    try { var k = "hanzilinh_exambest_" + HL.series + HL.level, old = JSON.parse(localStorage.getItem(k) || "null"); if (!old || pct > old.pct) localStorage.setItem(k, JSON.stringify({ pct: pct, r: right, t: tot })); } catch (e) {}
    $("result").classList.remove("hide"); $("bar").classList.add("hide");
    window.scrollTo(0, 0);
  }

  /* ---------- khởi động ---------- */
  function start() {
    spec = (SPEC[HL.series] || {})[HL.level];
    buildTest(); submitted = false; render(); updateCount();
    $("setup").classList.add("hide"); $("result").classList.add("hide"); $("paper").classList.remove("hide"); $("bar").classList.remove("hide");
    if (cfgTime) { endAt = Date.now() + spec.min * 60000; $("btimer").classList.remove("hide"); tick(); timerId = setInterval(tick, 500); }
    else $("btimer").classList.add("hide");
    $("nospeech").classList.toggle("hide", canSpeak);
    window.scrollTo(0, 0);
  }

  var cfgTime = true;
  function loadJson(u) { return fetch(u).then(function (r) { if (!r.ok) throw new Error(u); return r.json(); }); }
  function loadAll() {
    var lv = HL.level, ser = HL.series, lvls = [lv];
    if (ser === "yct") lvls = []; for (var i = 1; ser === "yct" && i <= lv; i++) lvls.push(i);
    var vocabUrl = function (n) { return ser === "yct" ? "data/yct" + n + "-vocab.json" : "data/hsk" + n + "-v3-vocab.json"; };
    var p = lvls.map(function (n) { return loadJson(vocabUrl(n)); });
    p.push(loadJson("data/" + ser + lv + "-reading.json"));
    lvls.forEach(function (n) { p.push(loadJson("data/" + ser + n + "-dialogues.json")); });
    var lowerReq = [];
    if (ser === "hsk") for (var q = 1; q < lv; q++) lowerReq.push(loadJson("data/hsk" + q + "-v3-vocab.json"));
    return Promise.all(lowerReq).then(function (lo) { EXTRA = []; lo.forEach(function (x) { EXTRA = EXTRA.concat(x.words); }); return Promise.all(p); }).then(function (r) {
      var nv = lvls.length;
      D.words = []; for (var i = 0; i < nv; i++) D.words = D.words.concat(r[i].words);
      D.pass = r[nv].passages;
      D.pairs = []; D.lines = [];
      CORPUS = D.words.map(function (w) { return w.ex ? w.ex.zh : ""; }).join("|");
      var wl = D.words.filter(function (w) { return w.hanzi.length <= 4; }).sort(function (a, b) { return b.hanzi.length - a.hanzi.length; });
      for (var j = nv + 1; j < r.length; j++) r[j].dialogues.forEach(function (d) {
        d.lines.forEach(function (l, k) {
          CORPUS += "|" + l.zh;
          if (k + 1 < d.lines.length && isQ(l.zh)) D.pairs.push({ q: l, a: d.lines[k + 1], key: qkey(l.zh) });
          if (l.zh.length >= 4) {
            var hit = null;
            for (var m = 0; m < wl.length; m++) if (wl[m].hanzi.length >= (HL.series === "yct" ? 1 : 2) && l.zh.indexOf(wl[m].hanzi) >= 0) { hit = wl[m]; break; }
            if (hit) D.lines.push({ l: l, prev: k > 0 ? d.lines[k - 1] : null, w: hit });
          }
        });
      });
    });
  }

  function showSetup() {
    spec = (SPEC[HL.series] || {})[HL.level];
    var lab = HL.series === "yct" ? "YCT " + HL.level : "HSK " + HL.levelName(HL.level);
    $("title").textContent = "Luyện theo cấp độ: " + lab;
    document.title = "Luyện theo cấp độ " + lab + " - HanziLinh";
    HL.renderLevelChips("levelChips");
    if (!spec) { $("info").textContent = HL.series === "hsk" && HL.level === 7 ? "HSK 7–9 chưa có đề: các nguồn công bố về cấu trúc đề (số câu 91 hay 98) còn khác nhau nên mình chưa dựng. Bạn chọn HSK 1–6 hoặc YCT 1–2 nhé." : "Cấp độ này chưa có đề."; return; }
    $("info").textContent = spec.note;
    var tb = $("struct"); tb.innerHTML = "";
    var last = "", L = 0, R = 0, W = 0;
    spec.parts.forEach(function (p) {
      if (p.s !== last) { last = p.s; tb.appendChild(mk("li", "sh", SEC[p.s])); }
      tb.appendChild(mk("li", "", p.t + " (" + p.n + (p.g === "essay" ? " bài" : " câu") + ")"));
      if (p.s === "L") L += p.n; else if (p.s === "R") R += p.n; else if (p.g !== "essay") W += p.n;
    });
    $("setup").classList.remove("hide");
    $("tnote").textContent = "Thời gian làm bài: " + spec.min + " phút.";
    try { var b = JSON.parse(localStorage.getItem("hanzilinh_exambest_" + HL.series + HL.level) || "null"); $("best").textContent = b ? "Kết quả tốt nhất của bạn: " + b.r + "/" + b.t + " (" + b.pct + "%)" : ""; } catch (e) {}
    $("srcnote").textContent = spec.src === "official"
      ? "Cấu trúc các phần lấy từ đề mẫu chính thức của Hanban. Hình trong đề thật được thay bằng biểu tượng emoji, câu hỏi do HanziLinh tạo từ từ vựng, hội thoại và bài đọc của trang. Một số câu điền từ có thể có hơn một đáp án hợp lý; bài chỉ chấm theo từ trong câu gốc."
      : "Số câu từng phần lấy theo thông tin công bố về HSK 3.0. Các nguồn tôi tìm được không nêu dạng câu của từng phần, nên dạng câu ở đây là mô phỏng, không phải bản sao đề thật. Một số câu điền từ có thể có hơn một đáp án hợp lý; bài chỉ chấm theo từ trong câu gốc.";
    Array.prototype.forEach.call($("timeChips").children, function (c) {
      c.onclick = function () { cfgTime = c.getAttribute("data-v") === "on"; Array.prototype.forEach.call($("timeChips").children, function (x) { x.setAttribute("aria-pressed", x === c ? "true" : "false"); }); };
    });
    $("start").onclick = function () { $("start").disabled = true; $("start").textContent = "Đang tạo đề..."; start(); };
    $("start").disabled = true; $("start").textContent = "Đang tải dữ liệu...";
    loadAll().then(function () { $("start").disabled = false; $("start").textContent = "Bắt đầu làm bài"; })
      .catch(function () { $("info").textContent = "Không tải được dữ liệu. Bạn thử tải lại trang."; });
  }

  $("submit").onclick = function () { submit(false); };
  $("again").onclick = function () { location.reload(); };
  showSetup();
})();
