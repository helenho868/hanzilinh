(function () {
  var $ = function (id) { return document.getElementById(id); };
  var params = new URLSearchParams(location.search);
  var level = parseInt(params.get("level"), 10) || 1;
  var KEY = "hanzilinh_known_hsk" + level;

  var all = [], deck = [], ci = 0, known = {}, onlyNew = false;

  try { (JSON.parse(localStorage.getItem(KEY) || "[]")).forEach(function (k) { known[k] = 1; }); } catch (e) {}
  function save() { try { localStorage.setItem(KEY, JSON.stringify(Object.keys(known))); } catch (e) {} }
  function shuffle(a) {
    a = a.slice();
    for (var k = a.length - 1; k > 0; k--) { var j = Math.floor(Math.random() * (k + 1)); var t = a[k]; a[k] = a[j]; a[j] = t; }
    return a;
  }
  function knownCount() { return all.filter(function (w) { return known[w.hanzi]; }).length; }

  /* ---- Thẻ ---- */
  function card() {
    if (!deck.length) {
      $("fz").textContent = "完";
      $("fp").textContent = "";
      $("fv").textContent = "Bạn đã thuộc hết các từ";
      $("fc").classList.add("flip");
      $("fcount").textContent = "Không còn thẻ";
      $("fknown").textContent = "Đã thuộc " + knownCount() + " / " + all.length;
      return;
    }
    var d = deck[ci];
    $("fz").textContent = d.hanzi;
    $("fp").textContent = d.pinyin;
    $("fv").textContent = d.vi;
    $("fc").classList.remove("flip");
    $("fcount").textContent = "Thẻ " + (ci + 1) + " / " + deck.length;
    $("fknown").textContent = "Đã thuộc " + knownCount() + " / " + all.length;
  }
  function go(n) { if (!deck.length) return; ci = (ci + n + deck.length) % deck.length; card(); }
  function rebuild(keepShuffle) {
    var base = onlyNew ? all.filter(function (w) { return !known[w.hanzi]; }) : all;
    deck = keepShuffle ? shuffle(base) : base.slice();
    ci = 0; card();
  }
  var shuffled = false;

  $("fc").onclick = function () { this.classList.toggle("flip"); };
  $("nxt").onclick = function () { go(1); };
  $("prev").onclick = function () { go(-1); };
  $("yes").onclick = function () {
    if (!deck.length) return;
    known[deck[ci].hanzi] = 1; save();
    if (onlyNew) { deck.splice(ci, 1); if (ci >= deck.length) ci = 0; card(); } else { go(1); }
    renderList();
  };
  $("no").onclick = function () {
    if (!deck.length) return;
    delete known[deck[ci].hanzi]; save(); go(1); renderList();
  };
  $("shuf").onclick = function () { shuffled = true; rebuild(true); };
  $("onlyNew").onclick = function () {
    onlyNew = !onlyNew; this.setAttribute("aria-pressed", onlyNew); rebuild(shuffled);
  };
  if (!("speechSynthesis" in window)) { $("spk").classList.add("hide"); }
  $("spk").onclick = function () {
    if (!deck.length) return;
    try {
      var u = new SpeechSynthesisUtterance(deck[ci].hanzi);
      u.lang = "zh-CN"; u.rate = 0.8;
      speechSynthesis.cancel(); speechSynthesis.speak(u);
    } catch (e) {}
  };

  /* ---- Danh sách ---- */
  function norm(s) {
    return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d");
  }
  function renderList() {
    var q = norm($("q").value.trim());
    var ul = $("list"); ul.innerHTML = "";
    var shown = all.filter(function (w) {
      return !q || w.hanzi.indexOf(q) >= 0 || norm(w.pinyin).indexOf(q) >= 0 || norm(w.vi).indexOf(q) >= 0;
    });
    if (!shown.length) {
      var e = document.createElement("li"); e.className = "empty"; e.textContent = "Không tìm thấy từ nào.";
      ul.appendChild(e); return;
    }
    shown.forEach(function (w) {
      var li = document.createElement("li");
      if (known[w.hanzi]) li.className = "known";
      [["h", w.hanzi], ["p", w.pinyin], ["m", w.vi]].forEach(function (x) {
        var s = document.createElement("span"); s.className = x[0]; s.textContent = x[1]; li.appendChild(s);
      });
      ul.appendChild(li);
    });
  }
  $("q").oninput = renderList;

  /* ---- Tab ---- */
  function tab(n) {
    $("p1").classList.toggle("hide", n !== 1);
    $("p2").classList.toggle("hide", n !== 2);
    $("t1").setAttribute("aria-selected", n === 1);
    $("t2").setAttribute("aria-selected", n === 2);
  }
  $("t1").onclick = function () { tab(1); };
  $("t2").onclick = function () { tab(2); };

  /* ---- Tải dữ liệu ---- */
  $("title").textContent = "Từ vựng HSK " + level;
  document.title = "Từ vựng HSK " + level + " - HanziLinh";
  fetch("data/hsk" + level + "-vocab.json")
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function (d) {
      all = d.words;
      $("info").textContent = d.count + " từ, theo chuẩn " + d.standard + ". Tiến độ được lưu trên trình duyệt của bạn.";
      rebuild(false); renderList();
    })
    .catch(function () {
      $("info").textContent = "Chưa có dữ liệu cho cấp độ này hoặc không tải được. Hãy thử tải lại trang.";
      $("p1").classList.add("hide"); document.querySelector(".tabs").classList.add("hide");
    });
})();
