/* Trang chủ HanziLinh.
   Toàn bộ nội dung động được tạo bằng createElement + textContent, sự kiện gắn bằng addEventListener (không dùng HTML chuỗi). */
(function () {
  "use strict";
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null && text !== "") e.textContent = text;
    return e;
  }
  function $(id) { return document.getElementById(id); }
  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function jget(k, def) { try { var v = JSON.parse(get(k) || "null"); return v == null ? def : v; } catch (e) { return def; } }
  function visible(x) { return !!x && x.ready === true; } /* mục chưa sẵn sàng giữ trong cấu hình nhưng không hiện */
  var fmt = function (n) { return Number(n).toLocaleString("vi-VN"); };

  /* ================= Thẻ chữ ở đầu trang =================
     - Mỗi 2 giờ đổi sang một chữ mới, lấy từ đúng cấp độ người dùng đang học (theo "Tiếp tục học").
     - Ưu tiên chữ CHƯA đánh dấu "Đã thuộc"; khi đã thuộc hết thì ôn lại toàn bộ cấp.
     - Thứ tự xáo trộn cố định theo cấp, nên mỗi khung 2 giờ trên cùng một máy luôn ra cùng một chữ.
     - Thẻ tự lật mỗi 1 phút; bấm vào thẻ để lật ngay. */
  (function () {
    var card = $("fcard"); if (!card) return;
    var SLOT = 2 * 60 * 60 * 1000, AUTO = 60000;
    var cur = null, curSlot = -1, info = null;

    function slotNow() { return Math.floor(Date.now() / SLOT); }
    /* Cấp độ hiện tại: lấy từ trang học gần nhất; mặc định HSK 1 (chuẩn 3.0). */
    function currentLevel() {
      var r = { series: "hsk", level: 1, std: "3" };
      var last = safeLast();
      if (last) {
        var q = new URLSearchParams((last.u.split("?")[1] || ""));
        var lv = parseInt(q.get("level"), 10);
        if (q.get("series") === "yct") r.series = "yct";
        if (lv >= 1 && lv <= 9) r.level = lv;
        if (q.get("std") === "2") r.std = "2";
      } else if (book === "yct") r.series = "yct";
      var list = r.series === "yct" ? (typeof YCT_LEVELS !== "undefined" ? YCT_LEVELS : []) : LEVELS;
      var L = list.filter(visible).filter(function (l) { return l.id === r.level; })[0];
      if (!L) { r.level = 1; L = list.filter(visible)[0] || { id: 1 }; }
      if (r.series === "yct" || L.has2 === false) r.std = "3";
      r.name = r.series === "yct" ? "YCT " + r.level : "HSK " + (L.name || L.id);
      r.url = r.series === "yct" ? "data/yct" + r.level + "-vocab.json" : (r.std === "2" ? "data/hsk" + r.level + "-vocab.json" : "data/hsk" + r.level + "-v3-vocab.json");
      r.known = r.series === "yct" ? "hanzilinh_known_yct" + r.level : "hanzilinh_known_hsk" + r.level + (r.std === "2" ? "" : "_v3");
      r.href = "vocab.html?level=" + r.level + (r.series === "yct" ? "&series=yct" : "") + (r.std === "2" ? "&std=2" : "");
      return r;
    }
    /* Xáo trộn cố định (mulberry32) để thứ tự chữ không theo bảng chữ cái nhưng ổn định. */
    function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
    function seedOf(str) { var h = 2166136261; for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
    function keys(words) { var seen = {}; return words.map(function (w) { var k = seen[w.hanzi] ? w.hanzi + "#" + w.vi : w.hanzi; seen[w.hanzi] = 1; return k; }); }

    function show(w, meta) {
      cur = w;
      $("fHanzi").textContent = w.hanzi; $("fPinyin").textContent = w.pinyin; $("fMean").textContent = w.vi;
      $("fHanzi").classList.toggle("long", w.hanzi.length >= 3);
      $("fHanzi").classList.toggle("mid", w.hanzi.length === 2);
      var hasEx = !!(w.ex && w.ex.zh);
      $("fExWrap").hidden = !hasEx;
      if (hasEx) { $("fExZh").textContent = w.ex.zh; $("fExPy").textContent = w.ex.py || ""; $("fExVi").textContent = w.ex.vi || ""; }
      var parts = $("fParts"); parts.replaceChildren();
      (w.parts || []).forEach(function (p, i) {
        if (i) parts.appendChild(el("span", "plus", "+"));
        var s = el("span", "part"), b = el("b", "zh", p.ch); b.setAttribute("lang", "zh-CN");
        s.appendChild(b); s.appendChild(el("span", "", p.hv + " (" + p.vi + ")" + (p.radical ? ", bộ thủ" : "")));
        parts.appendChild(s);
      });
      $("fPartsWrap").hidden = !(w.parts && w.parts.length);
      $("fInfoWrap").hidden = hasEx; $("fBackMean").textContent = w.vi;
      $("fTag").textContent = meta ? "Chữ " + meta.name + " · " + (meta.review ? "ôn lại" : "chưa thuộc") : "Chữ của bạn hôm nay";
      var nx = $("fNext"); nx.replaceChildren();
      if (meta) {
        var t = new Date((slotNow() + 1) * SLOT);
        nx.appendChild(document.createTextNode("Chữ mới lúc " + String(t.getHours()).padStart(2, "0") + ":" + String(t.getMinutes()).padStart(2, "0") + " · "));
        var a = el("a", "", "Học " + meta.name); a.href = meta.href; nx.appendChild(a);
      }
      setFace(false);
    }
    function label() {
      if (!cur) return;
      var back = card.getAttribute("aria-pressed") === "true";
      card.setAttribute("aria-label", back
        ? "Mặt sau thẻ " + cur.hanzi + (cur.ex && cur.ex.zh ? ": ví dụ " + cur.ex.zh + ", " + (cur.ex.vi || "") : ": " + cur.vi) + ". Bấm để lật lại."
        : "Thẻ " + cur.hanzi + ", " + cur.pinyin + ", nghĩa " + cur.vi + ". Bấm để lật xem ví dụ.");
    }
    function setFace(back) {
      card.setAttribute("aria-pressed", back ? "true" : "false");
      card.classList.toggle("flipped", back);
      label();
    }
    function flip() { setFace(card.getAttribute("aria-pressed") !== "true"); }

    /* Chữ dự phòng khi chưa tải được dữ liệu. */
    if (typeof HERO_WORD !== "undefined") show(HERO_WORD, null);

    function pick() {
      var lv = currentLevel(), slot = slotNow();
      return fetch(lv.url).then(function (r) { if (!r.ok) throw new Error("data"); return r.json(); }).then(function (d) {
        var words = (d && Array.isArray(d.words)) ? d.words.filter(function (w) { return w && typeof w.hanzi === "string" && w.hanzi; }) : [];
        if (!words.length) return;
        var ks = keys(words), known = {}, kn = jget(lv.known, []);
        if (Array.isArray(kn)) kn.forEach(function (k) { known[k] = 1; });
        var order = words.map(function (_, i) { return i; }), rnd = rng(seedOf(lv.url));
        for (var i = order.length - 1; i > 0; i--) { var j = Math.floor(rnd() * (i + 1)), t = order[i]; order[i] = order[j]; order[j] = t; }
        var fresh = order.filter(function (i) { return !known[ks[i]]; });
        var review = !fresh.length, pool = review ? order : fresh;
        var w = words[pool[slot % pool.length]];
        curSlot = slot;
        show(w, { name: lv.name, href: lv.href, review: review });
      }).catch(function () { /* giữ chữ dự phòng */ });
    }
    Promise.resolve().then(pick); /* chạy sau khi trang chủ khởi tạo xong (tab giáo trình đã đọc) */

    var timer = 0;
    function schedule() { clearInterval(timer); timer = setInterval(function () { if (!document.hidden) flip(); }, AUTO); }
    card.addEventListener("click", function () { flip(); schedule(); });
    schedule();
    /* Đổi chữ khi sang khung 2 giờ mới (kiểm tra mỗi phút và khi quay lại tab). */
    function checkSlot() { if (curSlot !== -1 && slotNow() !== curSlot) pick(); }
    setInterval(checkSlot, 60000);
    document.addEventListener("visibilitychange", function () { if (!document.hidden) checkSlot(); });
  })();

  /* ================= Số liệu ở đầu trang (tính từ dữ liệu thật của trang) ================= */
  (function () {
    var ul = $("heroStats"); if (!ul) return;
    var maxWords = 0; LEVELS.filter(visible).forEach(function (l) { maxWords = Math.max(maxWords, l.words3 || l.words || 0); });
    var examLevels = LEVELS.filter(function (l) { return visible(l) && l.id <= 6; }).length +
      (typeof YCT_LEVELS !== "undefined" ? YCT_LEVELS.filter(function (l) { return visible(l) && l.id <= 2; }).length : 0);
    var nTools = TOOLS.filter(function (t) { return visible(t) && t.href; }).length + (typeof FUN !== "undefined" ? FUN.filter(function (t) { return visible(t) && t.href; }).length : 0);
    [[fmt(maxWords), "từ vựng HSK 3.0"], [fmt(examLevels * 10), "đề thi thử"], ["214", "bộ thủ"], [String(nTools), "công cụ học"]].forEach(function (x) {
      var li = el("li"); li.appendChild(el("b", "", x[0])); li.appendChild(el("span", "", x[1])); ul.appendChild(li);
    });
  })();

  /* ================= Thẻ cấp độ ================= */
  function levelCard(prefix, l, words) {
    var li = el("li"), a = el("a", "level");
    a.href = l.href;
    var head = el("span", "lhead");
    head.appendChild(el("span", "lv", prefix + " " + (l.name || l.id)));
    var zh = el("span", "zh", prefix + l.zh); zh.setAttribute("lang", "zh-CN"); head.appendChild(zh);
    head.appendChild(el("span", "state", "→")); head.lastChild.setAttribute("aria-hidden", "true");
    a.appendChild(head);
    a.appendChild(el("span", "words", words));
    li.appendChild(a);
    return li;
  }
  function hskWords(l) {
    if (l.words3 && l.has2 === false) return fmt(l.words3) + " từ" + (l.new3 ? ", gồm " + fmt(l.new3) + " từ mới" : "");
    if (l.words3) return fmt(l.words3) + " từ (HSK 3.0) · " + fmt(l.words) + " từ (HSK 2.0)";
    return fmt(l.words) + " từ";
  }
  var PANELS = {
    hsk: {
      lead: "Lộ trình HSK 3.0: cấp 1 đến 6 và cấp 7–9. Số từ là tổng số từ cần biết ở cấp đó. HSK 1 có thêm bản theo chuẩn HSK 2.0.",
      cards: function (ul) { LEVELS.filter(visible).forEach(function (l) { ul.appendChild(levelCard("HSK", l, hskWords(l))); }); }
    },
    yct: {
      lead: "YCT là kỳ thi tiếng Trung dành cho thiếu nhi. Số từ là tổng số từ cần biết ở cấp đó, theo bảng từ chính thức.",
      cards: function (ul) {
        if (typeof YCT_LEVELS === "undefined") return;
        YCT_LEVELS.filter(visible).forEach(function (l) { ul.appendChild(levelCard("YCT", l, fmt(l.words) + " từ" + (l.id > 1 ? ", gồm " + fmt(l.new) + " từ mới" : ""))); });
      }
    },
    boya: {
      lead: "Boya Hán ngữ (博雅汉语), bộ sơ cấp.",
      cards: function (ul) {
        if (typeof BOYA_LEVELS === "undefined") return;
        BOYA_LEVELS.filter(visible).forEach(function (l) { ul.appendChild(levelCard("", l, l.zh)); });
      }
    }
  };

  /* ================= Tabs giáo trình (chuẩn ARIA: tablist / tab / tabpanel) ================= */
  var books = (typeof BOOKS !== "undefined" ? BOOKS : []).filter(function (b) { return visible(b) && PANELS[b.id]; });
  var book = get("hanzilinh_book");
  if (!books.some(function (b) { return b.id === book; })) book = "hsk";
  var tablist = $("bookTabs"), panelBox = $("bookPanels"), tabs = [];
  books.forEach(function (b) {
    var t = el("button", "tab", b.name);
    t.type = "button"; t.id = "tab-" + b.id;
    t.setAttribute("role", "tab"); t.setAttribute("aria-controls", "panel-" + b.id); t.setAttribute("data-id", b.id);
    tablist.appendChild(t); tabs.push(t);
    var p = el("div", "tabpanel"); p.id = "panel-" + b.id;
    p.setAttribute("role", "tabpanel"); p.setAttribute("aria-labelledby", t.id); p.tabIndex = 0;
    p.appendChild(el("p", "lead", PANELS[b.id].lead));
    var ul = el("ul", "levels"); PANELS[b.id].cards(ul); p.appendChild(ul);
    panelBox.appendChild(p);
    t.addEventListener("click", function () { choose(b.id, false); });
  });
  tablist.addEventListener("keydown", function (e) {
    var i = tabs.indexOf(document.activeElement); if (i < 0) return;
    var n = e.key === "ArrowRight" ? i + 1 : e.key === "ArrowLeft" ? i - 1 : e.key === "Home" ? 0 : e.key === "End" ? tabs.length - 1 : null;
    if (n === null) return;
    e.preventDefault(); n = (n + tabs.length) % tabs.length;
    choose(tabs[n].getAttribute("data-id"), true);
  });
  function choose(id, focus) {
    book = id; set("hanzilinh_book", id);
    tabs.forEach(function (t) {
      var on = t.getAttribute("data-id") === id;
      t.setAttribute("aria-selected", on ? "true" : "false"); t.tabIndex = on ? 0 : -1;
      if (on && focus) t.focus();
    });
    books.forEach(function (b) { $("panel-" + b.id).hidden = b.id !== id; });
    /* Công cụ mở đúng giáo trình đang chọn */
    document.querySelectorAll("#tools a.tool").forEach(function (a) {
      var h = a.getAttribute("data-base"); if (!h) return;
      a.href = (id === "yct" && h.indexOf("level=") >= 0) ? h + "&series=yct" : h;
    });
  }

  /* ================= Công cụ học và Vui học ================= */
  /* Thẻ gọn: biểu tượng + tên. Mô tả hiện khi rê chuột (title) và được đọc cho trình đọc màn hình. */
  function toolCard(t) {
    var li = el("li"), a = el("a", "tool");
    a.href = t.href; a.setAttribute("data-base", t.href);
    if (t.desc) a.title = t.desc;
    var ic = el("span", "ic", t.ic); ic.setAttribute("aria-hidden", "true"); a.appendChild(ic);
    a.appendChild(el("span", "tname", t.name));
    if (t.desc) a.appendChild(el("span", "sr", ": " + t.desc));
    li.appendChild(a);
    return li;
  }
  var tl = $("tools");
  var shown = TOOLS.filter(function (t) { return visible(t) && t.href && !t.hidden; });
  var groups = (typeof TOOL_GROUPS !== "undefined" ? TOOL_GROUPS : []).concat([{ id: "", name: "Khác" }]);
  groups.forEach(function (g) {
    var list = shown.filter(function (t) { return g.id ? t.group === g.id : !groups.some(function (x) { return x.id && x.id === t.group; }); });
    if (!list.length) return;
    var box = el("div", "tgroup"), hid = "tg-" + (g.id || "khac");
    var h = el("h3", "tgh", g.name); h.id = hid; box.appendChild(h);
    var ul = el("ul", "tools"); ul.setAttribute("aria-labelledby", hid);
    list.forEach(function (t) { ul.appendChild(toolCard(t)); });
    box.appendChild(ul); tl.appendChild(box);
  });
  /* Vui học tiếng Trung: một nhóm cuối trong Công cụ học (giữ id "vui-hoc" để các liên kết cũ vẫn tới đúng chỗ). */
  var funList = typeof FUN !== "undefined" ? FUN.filter(function (t) { return visible(t) && t.href; }) : [];
  if (funList.length) {
    var fbox = el("div", "tgroup"); fbox.id = "vui-hoc";
    var fh = el("h3", "tgh", "Vui học"); fh.id = "tg-vuihoc"; fbox.appendChild(fh);
    var ful = el("ul", "tools"); ful.setAttribute("aria-labelledby", "tg-vuihoc");
    funList.forEach(function (t) { ful.appendChild(toolCard(t)); });
    fbox.appendChild(ful); tl.appendChild(fbox);
  }
  if (tabs.length) choose(book, false);

  /* ================= Tiếp tục học + tiến độ ================= */
  function safeLast() {
    var last = jget("hanzilinh_last", null);
    if (!last || typeof last !== "object") return null;
    if (window.HLBackup && !HLBackup.safeUrl(last.u)) return null;   /* chỉ nhận đường dẫn nội bộ hợp lệ */
    if (typeof last.n !== "string") return null;
    return { n: last.n.slice(0, 60), l: typeof last.l === "string" ? last.l.slice(0, 40) : "", u: last.u, t: Number(last.t) || 0 };
  }
  function ago(t) {
    var m = Math.max(0, Math.round((Date.now() - t) / 60000));
    return m < 60 ? "Cách đây " + Math.max(1, m) + " phút" : m < 1440 ? "Cách đây " + Math.round(m / 60) + " giờ" : "Cách đây " + Math.round(m / 1440) + " ngày";
  }
  function renderProgress() {
    var last = safeLast(), rb = $("resumeBody"); rb.replaceChildren();
    if (last) {
      rb.appendChild(el("p", "resume-t", last.n + (last.l ? ", " + last.l : "")));
      if (last.t) rb.appendChild(el("p", "muted", ago(last.t)));
      var row = el("div", "btnrow"), a = el("a", "mini", "Học tiếp"); a.href = last.u; row.appendChild(a); rb.appendChild(row);
      $("stripTxt").textContent = last.n + (last.l ? " · " + last.l : ""); $("stripGo").href = last.u;
    } else {
      rb.appendChild(el("p", "muted", "Bạn chưa học gì trên máy này. Chọn một cấp độ và mở Từ vựng để bắt đầu."));
      var r2 = el("div", "btnrow"), b = el("a", "mini", "Bắt đầu với HSK 1"); b.href = "vocab.html?level=1"; r2.appendChild(b); rb.appendChild(r2);
      $("stripTxt").textContent = "Bắt đầu với HSK 1"; $("stripGo").href = "vocab.html?level=1";
    }

    var pb = $("progressBody"), rows = 0, total = 0; pb.replaceChildren();
    function cnt(key) { var v = jget(key, []); return Array.isArray(v) ? v.length : 0; }
    function add(label, known, all, ex, lw, href) {
      total += known;
      if (!known && !ex && !lw) return; rows++;
      var r = el("div", "prow"), l = el("div", "pl");
      l.appendChild(el("b", "", label));
      l.appendChild(el("span", "", known + "/" + all + " từ" + (ex && typeof ex.pct === "number" ? " · đề thi " + ex.pct + "%" : "")));
      r.appendChild(l);
      var bar = el("div", "pbar"), i = el("i");
      bar.setAttribute("role", "progressbar"); bar.setAttribute("aria-label", label);
      bar.setAttribute("aria-valuemin", "0"); bar.setAttribute("aria-valuemax", String(all)); bar.setAttribute("aria-valuenow", String(Math.min(known, all)));
      i.style.width = Math.min(100, Math.round(known * 100 / all)) + "%"; bar.appendChild(i); r.appendChild(bar);
      if (lw && typeof lw.h === "string") {
        var c = el("p", "pcont"); c.appendChild(document.createTextNode("Từ cuối: "));
        var z = el("span", "zh", lw.h); z.setAttribute("lang", "zh-CN"); c.appendChild(z);
        c.appendChild(document.createTextNode(" (" + String(lw.p || "") + "), thẻ " + (Number(lw.i) || 0) + "/" + (Number(lw.n) || 0) + " "));
        var a2 = el("a", "plink", "Học tiếp"); a2.href = href; c.appendChild(a2); r.appendChild(c);
      }
      pb.appendChild(r);
    }
    LEVELS.filter(visible).forEach(function (l) { add("HSK " + (l.name || l.id), cnt("hanzilinh_known_hsk" + l.id + "_v3"), l.new3 || l.words3, jget("hanzilinh_exambest_hsk" + l.id, null), jget("hanzilinh_lastword_hsk" + l.id + "_v3", null), "vocab.html?level=" + l.id); });
    if (typeof YCT_LEVELS !== "undefined") YCT_LEVELS.filter(visible).forEach(function (l) { add("YCT " + l.id, cnt("hanzilinh_known_yct" + l.id), l.new, jget("hanzilinh_exambest_yct" + l.id, null), jget("hanzilinh_lastword_yct" + l.id, null), "vocab.html?series=yct&level=" + l.id); });
    if (!rows) pb.appendChild(el("p", "muted", "Chưa có số liệu. Ở trang Từ vựng, bấm \"Đã thuộc\" cho từ bạn nhớ, tiến độ sẽ hiện ở đây. Dữ liệu chỉ lưu trên máy này."));
    $("stripKnown").textContent = total ? "Đã thuộc " + fmt(total) + " từ" : "";
  }
  renderProgress();

  /* ================= Sao lưu / khôi phục ================= */
  var dlg = $("backup");
  function openBackup(e) {
    if (e) e.preventDefault();
    var r = window.HLBackup ? HLBackup.exportCode() : { code: "", count: 0 };
    $("bkOut").value = r.code; $("bkOutMsg").textContent = ""; $("bkInMsg").textContent = ""; $("bkIn").value = "";
    $("bkInfo").textContent = r.count ? "Có " + r.count + " mục tiến độ trên máy này. Chép mã dưới đây và dán ở máy kia." : "Máy này chưa có tiến độ để sao lưu.";
    if (r.tooBig) $("bkInfo").textContent += " Mã dài hơn 50 KB nên chỉ khôi phục được bằng file .txt.";
    if (typeof dlg.showModal === "function") dlg.showModal(); else dlg.setAttribute("open", "");
    $("bkClose").focus();
  }
  document.querySelectorAll("[data-open-backup]").forEach(function (b) { b.addEventListener("click", openBackup); });
  $("bkClose").addEventListener("click", function () { if (dlg.close) dlg.close(); else dlg.removeAttribute("open"); });
  dlg.addEventListener("click", function (e) { if (e.target === dlg && dlg.close) dlg.close(); }); /* bấm ra ngoài để đóng */
  $("bkCopy").addEventListener("click", function () {
    var t = $("bkOut").value; if (!t) return;
    var done = function () { $("bkOutMsg").textContent = "Đã chép mã."; };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(done, function () { $("bkOut").select(); $("bkOutMsg").textContent = "Hãy bấm giữ để chép mã đã chọn."; });
    else { $("bkOut").select(); $("bkOutMsg").textContent = "Hãy bấm giữ để chép mã đã chọn."; }
  });
  $("bkSave").addEventListener("click", function () {
    var t = $("bkOut").value; if (!t) return;
    var a = el("a"), url = URL.createObjectURL(new Blob([t], { type: "text/plain" }));
    a.href = url; a.download = "hanzilinh-sao-luu-" + new Date().toISOString().slice(0, 10) + ".txt";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
  });
  function restore(text) {
    var msg = $("bkInMsg"); msg.className = "bk-msg";
    if (!window.HLBackup) return;
    var p = HLBackup.parseCode(text);
    if (p.error) { msg.textContent = p.error; msg.classList.add("bad"); return; }
    var w = HLBackup.apply(p);
    if (w.error) { msg.textContent = w.error; msg.classList.add("bad"); return; }
    msg.textContent = "Đã khôi phục " + w.written + " mục tiến độ" + (p.skipped ? " (bỏ qua " + p.skipped + " mục không hợp lệ)" : "") + ".";
    msg.classList.add("good");
    renderProgress();
  }
  $("bkRestore").addEventListener("click", function () { restore($("bkIn").value); });
  $("bkFile").addEventListener("change", function () {
    var f = this.files && this.files[0]; this.value = "";
    if (!f) return;
    if (f.size > 51200) { $("bkInMsg").textContent = "File quá lớn (tối đa 50 KB)."; $("bkInMsg").className = "bk-msg bad"; return; }
    var r = new FileReader();
    r.addEventListener("load", function () { $("bkIn").value = String(r.result || ""); restore($("bkIn").value); });
    r.readAsText(f);
  });
})();
