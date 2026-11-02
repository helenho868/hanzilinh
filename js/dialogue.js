(function () {
  var $ = function (id) { return document.getElementById(id); };
  var data = null, cur = -1, role = "none", showPy = true, showVi = true, playing = false, token = 0;
  var PREF = "hanzilinh_dlg_prefs";
  try { var pr = JSON.parse(localStorage.getItem(PREF) || "{}"); if (pr.py === false) showPy = false; if (pr.vi === false) showVi = false; } catch (e) {}
  function savePrefs() { try { localStorage.setItem(PREF, JSON.stringify({ py: showPy, vi: showVi })); } catch (e) {} }
  function mk(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text) e.textContent = text; return e; }

  var canSpeak = !!window.speechSynthesis && typeof window.SpeechSynthesisUtterance !== "undefined";
  function zhVoice() {
    try { var vs = speechSynthesis.getVoices() || []; for (var k = 0; k < vs.length; k++) if (/^zh/i.test(vs[k].lang)) return vs[k]; } catch (e) {}
    return null;
  }
  function utter(text, onend) {
    var u = new SpeechSynthesisUtterance(text); u.lang = "zh-CN"; u.rate = 0.8;
    var v = zhVoice(); if (v) u.voice = v;
    if (onend) { u.onend = onend; u.onerror = onend; }
    return u;
  }
  function speakOne(text) { if (!canSpeak) { noSpeech(); return; } try { stopAll(); speechSynthesis.speak(utter(text)); } catch (e) {} }
  function stopAll() {
    token++; playing = false;
    try { speechSynthesis.cancel(); } catch (e) {}
    $("playAll").classList.remove("hide"); $("stopAll").classList.add("hide");
    document.querySelectorAll(".msg.cur").forEach(function (n) { n.classList.remove("cur"); });
  }
  function playAll() {
    if (!canSpeak) { noSpeech(); return; }
    if (cur < 0) return;
    stopAll(); playing = true; var my = token;
    $("playAll").classList.add("hide"); $("stopAll").classList.remove("hide");
    var lines = data.dialogues[cur].lines, msgs = document.querySelectorAll(".msg");
    (function next(i) {
      if (my !== token) return;
      if (i >= lines.length) { stopAll(); return; }
      document.querySelectorAll(".msg.cur").forEach(function (n) { n.classList.remove("cur"); });
      msgs[i].classList.add("cur"); msgs[i].scrollIntoView({ block: "nearest", behavior: "smooth" });
      try { speechSynthesis.speak(utter(lines[i].zh, function () { setTimeout(function () { next(i + 1); }, 350); })); } catch (e) { stopAll(); }
    })(0);
  }

  function renderList() {
    var ul = $("dlist"); ul.innerHTML = "";
    data.dialogues.forEach(function (d, i) {
      var li = mk("li"), b = mk("button", "dcard"); b.type = "button";
      b.appendChild(mk("span", "n", String(i + 1)));
      b.appendChild(mk("span", "t", d.title));
      b.appendChild(mk("span", "s", d.scene + " (" + d.lines.length + " câu)"));
      b.onclick = function () { openDialogue(i); };
      li.appendChild(b); ul.appendChild(li);
    });
  }

  function renderChat() {
    var d = data.dialogues[cur], chat = $("chat"); chat.innerHTML = "";
    d.lines.forEach(function (l) {
      var m = mk("div", "msg " + l.s + (role === l.s ? " covered" : ""));
      m.appendChild(mk("span", "who", "Vai " + l.s));
      m.appendChild(mk("span", "zh", l.zh));
      m.appendChild(mk("span", "py", l.py));
      m.appendChild(mk("span", "vi", l.vi));
      if (true) {
        var b = mk("button", "say", "Nghe"); b.type = "button";
        b.setAttribute("aria-label", "Nghe câu: " + l.zh);
        b.onclick = function (e) { e.stopPropagation(); speakOne(l.zh); };
        m.appendChild(b);
      }
      if (role === l.s) m.onclick = function () { m.classList.remove("covered"); m.onclick = null; };
      chat.appendChild(m);
    });
    chat.parentNode.classList.toggle("hidepy", !showPy);
    chat.parentNode.classList.toggle("hidevi", !showVi);
  }

  function openDialogue(i, noHash) {
    stopAll(); cur = i; role = "none";
    document.querySelectorAll("#roleChips .chip").forEach(function (b) { b.setAttribute("aria-pressed", b.getAttribute("data-v") === "none" ? "true" : "false"); });
    var d = data.dialogues[i];
    $("dtitle").textContent = (i + 1) + ". " + d.title; $("dscene").textContent = d.scene;
    $("listView").classList.add("hide"); $("dlgView").classList.remove("hide");
    $("prevD").disabled = i === 0; $("nextD").disabled = i === data.dialogues.length - 1;
    renderChat(); window.scrollTo(0, 0);
    if (!noHash) { try { history.replaceState(null, "", "#" + (i + 1)); } catch (e) {} }
  }
  function openList() {
    stopAll(); cur = -1; $("dlgView").classList.add("hide"); $("listView").classList.remove("hide");
    try { history.replaceState(null, "", location.pathname + location.search); } catch (e) {}
    window.scrollTo(0, 0);
  }

  $("back").onclick = openList;
  $("prevD").onclick = function () { if (cur > 0) openDialogue(cur - 1); };
  $("nextD").onclick = function () { if (cur < data.dialogues.length - 1) openDialogue(cur + 1); };
  $("tPy").onclick = function () { showPy = !showPy; this.setAttribute("aria-pressed", showPy); savePrefs(); renderChat(); };
  $("tVi").onclick = function () { showVi = !showVi; this.setAttribute("aria-pressed", showVi); savePrefs(); renderChat(); };
  document.querySelectorAll("#roleChips .chip").forEach(function (b) {
    b.onclick = function () {
      document.querySelectorAll("#roleChips .chip").forEach(function (x) { x.setAttribute("aria-pressed", "false"); });
      b.setAttribute("aria-pressed", "true"); role = b.getAttribute("data-v"); stopAll(); renderChat();
    };
  });
  $("playAll").onclick = playAll; $("stopAll").onclick = stopAll;
  function noSpeech() { var n = $("voiceNote"); if (!n) return; n.textContent = "Trình duyệt này không hỗ trợ phát âm. Nếu bạn đang mở link trong Messenger/Zalo, hãy bấm dấu ⋯ rồi chọn “Mở bằng trình duyệt” (Chrome) để nghe."; n.classList.remove("hide"); }
  $("tPy").setAttribute("aria-pressed", showPy); $("tVi").setAttribute("aria-pressed", showVi);

  HL.renderLevelChips("levelChips");
  $("title").textContent = "Hội thoại " + HL.label().replace(/ \(chuẩn.*\)/, "");
  document.title = $("title").textContent + " - HanziLinh";
  $("toVocab").href = "vocab.html?level=" + HL.level + "&std=3";
  fetch("data/hsk" + HL.level + "-dialogues.json")
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function (d) {
      data = d; renderList();
      $("info").textContent = d.count + " đoạn hội thoại, dùng từ vựng của cấp này trở xuống. Chọn một đoạn để đọc, nghe và tập vai.";
      $("listView").classList.remove("hide");
      var h = parseInt((location.hash || "").slice(1), 10);
      if (h >= 1 && h <= d.count) openDialogue(h - 1, true);
    })
    .catch(function () { $("info").textContent = "Cấp độ này chưa có hội thoại hoặc không tải được. Hãy thử tải lại trang."; });
})();
