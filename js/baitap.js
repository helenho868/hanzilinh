(function () {
  var $ = function (i) { return document.getElementById(i); };
  var SK = "hanzilinh_ta_key", BEST = "hanzilinh_ta_best_";
  var key = "", mod = null, submitted = false;
  function mk(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
  // chỉ cho phép thẻ <u> trong nội dung đề
  function rich(el, s) {
    String(s).split(/(<u>|<\/u>)/).reduce(function (cur, part) {
      if (part === "<u>") { var u = document.createElement("u"); el.appendChild(u); return u; }
      if (part === "</u>") return el;
      if (part) cur.appendChild(document.createTextNode(part)); return cur;
    }, el);
  }
  function b2u(s) { var b = atob(s), u = new Uint8Array(b.length); for (var i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u; }
  async function open(file, k) {
    var r = await fetch(file, { cache: "no-cache" }); if (!r.ok) throw new Error("fetch");
    var j = await r.json();
    var base = await crypto.subtle.importKey("raw", new TextEncoder().encode(k), "PBKDF2", false, ["deriveKey"]);
    var ak = await crypto.subtle.deriveKey({ name: "PBKDF2", salt: b2u(j.s), iterations: j.it, hash: "SHA-256" }, base, { name: "AES-GCM", length: 256 }, false, ["decrypt"]);
    var pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: b2u(j.i) }, ak, b2u(j.c));
    return JSON.parse(new TextDecoder().decode(pt));
  }
  function ss(f) { try { return f(); } catch (e) { return null; } }

  async function unlock(k, quiet) {
    var btn = $("unlockBtn"); btn.disabled = true; $("lockErr").textContent = "";
    try {
      if (!window.crypto || !crypto.subtle) throw new Error("nocrypto");
      var list = await open("data/baitap/manifest.enc", k);
      key = k; ss(function () { sessionStorage.setItem(SK, k); });
      showList(list);
    } catch (e) {
      ss(function () { sessionStorage.removeItem(SK); });
      if (!quiet) $("lockErr").textContent = e.message === "nocrypto" ? "Trình duyệt không hỗ trợ mở khóa (cần mở bằng https)." : "Key không đúng hoặc không tải được dữ liệu. Vui lòng thử lại.";
    }
    btn.disabled = false;
  }
  function showList(list) {
    $("lock").classList.add("hide"); $("run").classList.add("hide"); $("list").classList.remove("hide");
    var ul = $("mods"); ul.textContent = "";
    list.forEach(function (m) {
      var li = mk("li"), b = mk("button", "mod"); b.type = "button";
      b.appendChild(mk("b", "", m.title));
      b.appendChild(mk("span", "", m.desc + " (" + m.n + " câu tính điểm)"));
      var best = ss(function () { return localStorage.getItem(BEST + m.id); });
      if (best) b.appendChild(mk("span", "best", "Điểm cao nhất: " + best));
      b.onclick = function () { start(m); };
      li.appendChild(b); ul.appendChild(li);
    });
    window.scrollTo(0, 0);
  }
  async function start(m) {
    try { mod = await open("data/baitap/" + m.id + ".enc", key); } catch (e) { alert("Không tải được bài. Vui lòng thử lại."); return; }
    submitted = false; render(); $("list").classList.add("hide"); $("run").classList.remove("hide"); window.scrollTo(0, 0);
  }
  function norm(s) { return String(s).toLowerCase().replace(/[’‘`]/g, "'").replace(/[^a-z0-9' ]+/g, " ").replace(/\s+/g, " ").trim(); }
  function items() { var a = []; mod.sections.forEach(function (s) { s.items.forEach(function (i) { a.push(i); }); }); return a; }
  function kind(i) { return i.o ? "mc" : (i.a === "T" || i.a === "F") ? "tf" : "tx"; }
  function render() {
    var box = $("run"); box.textContent = "";
    box.appendChild(mk("h2", "", mod.title));
    var sc = mk("div", "score hide"); sc.id = "score"; box.appendChild(sc);
    mod.sections.forEach(function (s) {
      var sec = mk("div", "sec");
      sec.appendChild(mk("h2", "", s.t));
      if (s.instr) sec.appendChild(mk("p", "ins", s.instr));
      if (s.dict) sec.appendChild(mk("div", "dict", s.dict));
      if (s.passage) sec.appendChild(mk("div", "passage", s.passage));
      s.items.forEach(function (i) {
        var q = mk("div", "q"); i._el = q;
        var qt = mk("p", "qt"); qt.appendChild(mk("b", "", "Câu " + i.n + ".")); rich(qt, i.q); q.appendChild(qt);
        if (i.imgNote) q.appendChild(mk("p", "cap", i.imgNote));
        var k = kind(i);
        if (k === "mc") i.o.forEach(function (o, n) {
          var l = mk("label", "opt"), r = document.createElement("input"); r.type = "radio"; r.name = "q" + i.n; r.value = n;
          r.onchange = count; l.appendChild(r); var t = mk("span"); t.appendChild(mk("b", "", "ABCD"[n] + ". ")); rich(t, o); l.appendChild(t); q.appendChild(l); l._n = n;
        });
        else if (k === "tf") ["T", "F"].forEach(function (v) {
          var l = mk("label", "opt"), r = document.createElement("input"); r.type = "radio"; r.name = "q" + i.n; r.value = v; r.onchange = count;
          l.appendChild(r); l.appendChild(mk("span", "", v === "T" ? "True" : "False")); q.appendChild(l); l._n = v;
        });
        else if (i.a !== null) {
          var t = document.createElement("input"); t.type = "text"; t.autocomplete = "off"; t.autocapitalize = "off"; t.spellcheck = false; t.name = "q" + i.n; t.setAttribute("aria-label", "Câu " + i.n); t.oninput = count; q.appendChild(t);
        }
        sec.appendChild(q);
      });
      box.appendChild(sec);
    });
    var bar = mk("div", "bar"); var cnt = mk("span", "cnt"); cnt.id = "cnt"; bar.appendChild(cnt);
    var sub = mk("button", "btn", "Nộp bài"); sub.type = "button"; sub.id = "submit"; sub.onclick = submit; bar.appendChild(sub);
    var back = mk("button", "btn2", "Về danh sách"); back.type = "button"; back.onclick = function () { $("run").classList.add("hide"); $("list").classList.remove("hide"); refreshList(); }; bar.appendChild(back);
    box.appendChild(bar); count();
  }
  var cachedList = null;
  function refreshList() { open("data/baitap/manifest.enc", key).then(showList).catch(function () {}); }
  function val(i) {
    var q = i._el; if (i.a === null) return null;
    if (kind(i) === "tx") return q.querySelector("input[type=text]").value.trim();
    var c = q.querySelector("input:checked"); return c ? c.value : "";
  }
  function count() { if (submitted) return; var d = 0, t = 0; items().forEach(function (i) { if (i.a === null) return; t++; if (val(i)) d++; }); $("cnt").textContent = "Đã trả lời " + d + "/" + t; }
  function isRight(i, v) {
    var k = kind(i);
    if (k === "mc") return String(v) === String(i.a);
    if (k === "tf") return v === i.a;
    var n = norm(v); return i.a.some(function (a) { return norm(a) === n; });
  }
  function ansText(i) {
    var k = kind(i);
    if (k === "mc") return "ABCD"[i.a] + ". " + i.o[i.a].replace(/<\/?u>/g, "");
    if (k === "tf") return i.a === "T" ? "True" : "False";
    return i.a[0];
  }
  function submit() {
    var all = items(), un = all.filter(function (i) { return i.a !== null && !val(i); }).length;
    if (un && !confirm("Còn " + un + " câu chưa trả lời. Bạn vẫn muốn nộp bài?")) return;
    submitted = true; var ok = 0, tot = 0;
    all.forEach(function (i) {
      var q = i._el, fb = mk("div", "fb");
      if (i.a === null) { fb.appendChild(mk("span", "tag", "Không tính điểm. ")); fb.appendChild(document.createTextNode(i.e)); q.appendChild(fb); return; }
      tot++; var v = val(i), good = v !== "" && isRight(i, v);
      if (good) ok++;
      q.classList.add(good ? "ok" : "bad"); fb.classList.add(good ? "good" : "bad");
      var k = kind(i);
      q.querySelectorAll("input").forEach(function (x) { x.disabled = true; });
      if (k !== "tx") q.querySelectorAll("label.opt").forEach(function (l) {
        if (String(l._n) === String(i.a)) l.classList.add("right"); else if (String(l._n) === String(v)) l.classList.add("wrong");
      });
      if (good) {
        fb.appendChild(mk("span", "tag", "Đúng."));
        var d = mk("details"); d.appendChild(mk("summary", "", "Xem giải thích")); d.appendChild(mk("div", "", i.e)); fb.appendChild(d);
      } else {
        fb.appendChild(mk("span", "tag", v ? "Chưa đúng. " : "Chưa trả lời. "));
        fb.appendChild(document.createTextNode("Đáp án đúng: " + ansText(i) + ". "));
        fb.appendChild(mk("div", "", "Giải thích: " + i.e));
      }
      q.appendChild(fb);
    });
    var s10 = tot ? Math.round(ok / tot * 100) / 10 : 0, sc = $("score");
    sc.classList.remove("hide"); sc.textContent = "";
    sc.appendChild(mk("div", "big", ok + "/" + tot + " câu đúng"));
    sc.appendChild(mk("div", "", "Điểm quy đổi (thang 10): " + s10));
    sc.appendChild(mk("div", "", "Kéo xuống để xem từng câu: câu sai có đáp án và lời giải thích."));
    var prev = ss(function () { return parseFloat(localStorage.getItem(BEST + mod.id)); });
    if (isNaN(prev) || ok / tot * 10 > prev) ss(function () { localStorage.setItem(BEST + mod.id, String(s10)); });
    $("submit").classList.add("hide"); $("cnt").textContent = "Đã nộp bài";
    var again = mk("button", "btn", "Làm lại"); again.type = "button"; again.onclick = function () { submitted = false; render(); window.scrollTo(0, 0); };
    $("cnt").parentNode.insertBefore(again, $("cnt").nextSibling);
    window.scrollTo(0, 0);
  }

  $("lockForm").addEventListener("submit", function (e) { e.preventDefault(); unlock($("key").value.trim()); });
  $("relock").onclick = function () {
    key = ""; mod = null; ss(function () { sessionStorage.removeItem(SK); });
    $("list").classList.add("hide"); $("run").classList.add("hide"); $("lock").classList.remove("hide"); $("key").value = "";
  };
  var saved = ss(function () { return sessionStorage.getItem(SK); });
  if (saved) unlock(saved, true);
})();
