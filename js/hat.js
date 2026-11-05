/* Trang Hát tiếng Trung: danh sách video YouTube (có phụ đề) trong data/songs.json.
   Mỗi bài: { "url": "link YouTube hoặc mã video", "title": "...", "level": "HSK 1" (tùy chọn), "note": "..." (tùy chọn) } */
(function () {
  var $ = function (id) { return document.getElementById(id); };
  function mk(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text) e.textContent = text; return e; }
  var songs = [], tag = "";

  /* Lấy mã video từ link youtube.com/watch?v=, youtu.be/, /shorts/, /embed/ hoặc chính mã 11 ký tự. */
  function vid(u) {
    u = String(u || "").trim();
    var m = u.match(/^[A-Za-z0-9_-]{11}$/) || u.match(/[?&]v=([A-Za-z0-9_-]{11})/) || u.match(/youtu\.be\/([A-Za-z0-9_-]{11})/) || u.match(/\/(?:shorts|embed|live)\/([A-Za-z0-9_-]{11})/);
    return m ? (m[1] || m[0]) : "";
  }

  function play(s, scroll) {
    var id = s.id;
    $("yt").src = "https://www.youtube-nocookie.com/embed/" + id + "?autoplay=1&cc_load_policy=1&hl=vi&rel=0&playsinline=1&modestbranding=1";
    $("ptitle").textContent = s.title;
    $("pnote").textContent = s.note || "";
    $("pyt").href = "https://www.youtube.com/watch?v=" + id;
    $("player").classList.remove("hide");
    document.querySelector(".frame").classList.toggle("vertical", !!s.vertical);
    document.querySelectorAll(".song").forEach(function (b) { b.classList.toggle("on", b.getAttribute("data-id") === id); });
    try { history.replaceState(null, "", "?v=" + id); } catch (e) {}
    if (scroll) $("player").scrollIntoView({ behavior: "smooth", block: "start" });
  }
  function stop() {
    $("yt").src = "about:blank"; $("player").classList.add("hide");
    document.querySelectorAll(".song.on").forEach(function (b) { b.classList.remove("on"); });
    try { history.replaceState(null, "", location.pathname); } catch (e) {}
  }

  function list() {
    var ul = $("songs"); ul.innerHTML = "";
    var shown = songs.filter(function (s) { return !tag || s.level === tag; });
    shown.forEach(function (s) {
      var li = mk("li"), b = mk("button", "song"); b.type = "button"; b.setAttribute("data-id", s.id);
      var th = mk("span", "th"), img = document.createElement("img");
      img.src = "https://i.ytimg.com/vi/" + s.id + "/mqdefault.jpg"; img.alt = ""; img.loading = "lazy"; th.appendChild(img); th.appendChild(mk("i", "", "▶"));
      var tx = mk("span", "tx"); tx.appendChild(mk("span", "tt", s.title));
      if (s.level) tx.appendChild(mk("span", "tg", s.level));
      if (s.note) tx.appendChild(mk("span", "nt", s.note));
      b.appendChild(th); b.appendChild(tx); b.onclick = function () { play(s, true); };
      li.appendChild(b); ul.appendChild(li);
    });
    $("empty").classList.toggle("hide", shown.length > 0);
    if (!shown.length) $("empty").textContent = songs.length ? "Không có video nào ở mục này." : "Các video hát đang được chuẩn bị. Bạn quay lại sau nhé.";
  }

  function tags() {
    var box = $("tags"); box.innerHTML = "";
    var set = [];
    songs.forEach(function (s) { if (s.level && set.indexOf(s.level) < 0) set.push(s.level); });
    if (set.length < 2) return;
    [""].concat(set).forEach(function (t) {
      var c = mk("button", "chip", t || "Tất cả"); c.type = "button"; c.setAttribute("aria-pressed", t === tag ? "true" : "false");
      c.onclick = function () { tag = t; tags(); list(); };
      box.appendChild(c);
    });
  }

  $("close").onclick = stop;
  fetch("data/songs.json").then(function (r) { return r.json(); }).then(function (d) {
    songs = (d.songs || []).map(function (s) { return { id: vid(s.url || s.id), vertical: /\/shorts\//.test(String(s.url || "")) || s.vertical === true, title: s.title || "Video hát", level: s.level || "", note: s.note || "" }; }).filter(function (s) { return s.id; });
    tags(); list();
    var q = new URLSearchParams(location.search).get("v");
    if (q) { var f = songs.filter(function (s) { return s.id === q; })[0]; if (f) play(f, false); }
  }).catch(function () { $("empty").textContent = "Không tải được danh sách video. Bạn thử tải lại trang."; });
})();
