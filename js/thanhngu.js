(function () {
  var items = [], topic = "", kw = "";
  var $ = function (i) { return document.getElementById(i); };
  function mk(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
  function speak(t) {
    try {
      if (!window.speechSynthesis) return;
      var u = new SpeechSynthesisUtterance(t); u.lang = "zh-CN"; u.rate = 0.8;
      speechSynthesis.cancel(); speechSynthesis.speak(u);
    } catch (e) {}
  }
  function sayBtn(t) { var b = mk("button", "say", "▶ Nghe"); b.type = "button"; b.setAttribute("aria-label", "Nghe " + t); b.onclick = function () { speak(t); }; return b; }
  function norm(s) { return (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d"); }

  function renderTopics() {
    var box = $("topics"); box.textContent = "";
    var ts = [""]; items.forEach(function (i) { if (ts.indexOf(i.topic) < 0) ts.push(i.topic); });
    ts.forEach(function (t) {
      var b = mk("button", "chip", t || "Tất cả"); b.type = "button"; b.setAttribute("aria-pressed", String(t === topic));
      b.onclick = function () { topic = t; renderTopics(); renderList(); };
      box.appendChild(b);
    });
  }
  function match(i) {
    if (topic && i.topic !== topic) return false;
    if (!kw) return true;
    var k = norm(kw);
    return i.zh.indexOf(kw) >= 0 || norm(i.py).indexOf(k) >= 0 || norm(i.hv).indexOf(k) >= 0 || norm(i.vi).indexOf(k) >= 0 || norm(i.vn || "").indexOf(k) >= 0;
  }
  function renderList() {
    var ul = $("list"); ul.textContent = "";
    var r = items.filter(match);
    $("count").textContent = r.length + " thành ngữ";
    r.forEach(function (i) {
      var li = mk("li");
      li.appendChild(mk("span", "tp", i.topic));
      li.appendChild(mk("div", "h zh", i.zh));
      li.appendChild(mk("div", "p", i.py));
      li.appendChild(mk("p", "hv", "Hán Việt: " + i.hv));
      li.appendChild(mk("p", "m", i.vi));
      if (i.vn) li.appendChild(mk("p", "vn", "Tương đương tiếng Việt: " + i.vn));
      li.appendChild(sayBtn(i.zh));
      var ex = mk("div", "ex");
      ex.appendChild(mk("div", "zh", i.ex.zh));
      ex.appendChild(mk("div", "pp", i.ex.py));
      ex.appendChild(mk("div", "", i.ex.vi));
      ex.appendChild(sayBtn(i.ex.zh));
      li.appendChild(ex);
      if (i.story) {
        var d = mk("details"); d.appendChild(mk("summary", "", "Câu chuyện"));
        d.appendChild(mk("p", "", i.story)); li.appendChild(d);
      }
      ul.appendChild(li);
    });
  }

  // quiz
  var qs = [], qi = 0, score = 0;
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function startQuiz() {
    qs = shuffle(items).slice(0, 10); qi = 0; score = 0; showQ();
  }
  function showQ() {
    var box = $("quiz"); box.textContent = "";
    var b = mk("div", "qbox");
    if (qi >= qs.length) {
      b.appendChild(mk("h2", "", "Kết quả: " + score + "/" + qs.length));
      var again = mk("button", "btn2", "Làm lại"); again.type = "button"; again.onclick = startQuiz; b.appendChild(again);
      box.appendChild(b); return;
    }
    var q = qs[qi];
    b.appendChild(mk("div", "qmeta", "Câu " + (qi + 1) + "/" + qs.length + " · Chọn nghĩa đúng"));
    b.appendChild(mk("div", "qh zh", q.zh));
    b.appendChild(mk("div", "qp", q.py));
    var opts = shuffle([q].concat(shuffle(items.filter(function (i) { return i !== q; })).slice(0, 3)));
    var wrap = mk("div", "opts"), done = false, fb = mk("p", "qmeta", "");
    opts.forEach(function (o) {
      var bt = mk("button", "opt", o.vi); bt.type = "button";
      bt.onclick = function () {
        if (done) return; done = true;
        if (o === q) { score++; bt.className = "opt ok"; fb.textContent = "Đúng rồi."; }
        else {
          bt.className = "opt no"; fb.textContent = "Chưa đúng. Đáp án đúng đã được tô màu.";
          [].forEach.call(wrap.children, function (c, k) { if (opts[k] === q) c.className = "opt ok"; });
        }
        var nx = mk("button", "btn2", qi + 1 >= qs.length ? "Xem kết quả" : "Câu tiếp"); nx.type = "button";
        nx.onclick = function () { qi++; showQ(); }; b.appendChild(nx);
      };
      wrap.appendChild(bt);
    });
    b.appendChild(wrap); b.appendChild(fb); box.appendChild(b);
  }
  function tab(quiz) {
    $("tLearn").setAttribute("aria-pressed", String(!quiz)); $("tQuiz").setAttribute("aria-pressed", String(quiz));
    $("learn").classList.toggle("hide", quiz); $("quiz").classList.toggle("hide", !quiz);
    if (quiz) startQuiz();
  }
  $("tLearn").onclick = function () { tab(false); };
  $("tQuiz").onclick = function () { tab(true); };
  $("q").addEventListener("input", function () { kw = this.value.trim(); renderList(); });

  fetch("data/chengyu.json", { cache: "no-cache" }).then(function (r) { return r.json(); }).then(function (d) {
    items = d.items; $("note").textContent = d.note; renderTopics(); renderList();
  }).catch(function () { $("count").textContent = "Không tải được dữ liệu."; });
})();
