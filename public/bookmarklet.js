(function () {
  if (window.__bookmarkletActive) return;
  window.__bookmarkletActive = true;

  var style = document.createElement("style");
  style.textContent =
    "#__bm-panel{all:initial;position:fixed;top:20px;right:20px;z-index:999999;width:360px;max-height:80vh;background:#fff;border-radius:12px;box-shadow:0 8px 32px rgba(0,0,0,.25);font-family:system-ui,sans-serif;direction:rtl;overflow:hidden;display:flex;flex-direction:column}#__bm-panel *{all:revert;box-sizing:border-box}#__bm-header{padding:16px 20px;background:#1e40af;color:#fff;font-size:16px;font-weight:700;display:flex;justify-content:space-between;align-items:center}#__bm-header button{background:none;border:none;color:#fff;font-size:22px;cursor:pointer;padding:0 4px}#__bm-body{padding:16px 20px;overflow-y:auto;flex:1}#__bm-body label{display:block;font-size:13px;font-weight:600;color:#374151;margin-bottom:4px}#__bm-body .bm-row{font-size:13px;padding:3px 0;display:flex;gap:8px}#__bm-body .bm-row .bm-label{color:#6b7280;min-width:65px}#__bm-body .bm-row .bm-value{color:#111827;word-break:break-word}#__bm-body .bm-mono{font-family:monospace;font-size:12px}#__bm-body textarea{width:100%;border:1px solid #d1d5db;border-radius:8px;padding:10px;font-size:13px;min-height:70px;resize:vertical;margin-top:8px}#__bm-body textarea:focus{outline:2px solid #3b82f6;border-color:transparent}#__bm-actions{display:flex;gap:8px;padding:12px 20px;border-top:1px solid #e5e7eb}#__bm-actions button{flex:1;padding:10px;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;border:none}#__bm-copy{background:#2563eb;color:#fff}#__bm-copy:hover{background:#1d4ed8}#__bm-close{background:#f3f4f6;color:#374151}#__bm-close:hover{background:#e5e7eb}";
    document.head.appendChild(style);

  var outline = document.createElement("div");
  outline.id = "__bm-outline";
  outline.style.cssText =
    "position:fixed;pointer-events:none;z-index:999998;border:2px dashed #ef4444;background:rgba(239,68,68,.08);display:none;transition:all .1s";
  document.body.appendChild(outline);

  var panel = document.createElement("div");
  panel.id = "__bm-panel";
  panel.style.display = "none";
  panel.innerHTML =
    '<div id="__bm-header"><span>🔍 فاحص العناصر</span><button id="__bm-hide">&times;</button></div><div id="__bm-body"></div><div id="__bm-actions"><button id="__bm-copy">📋 نسخ المعلومات</button><button id="__bm-close">إلغاء</button></div>';
  document.body.appendChild(panel);

  function buildSelector(el) {
    var parts = [],
      cur = el;
    while (cur && cur !== document.body && parts.length < 6) {
      var seg = cur.tagName.toLowerCase();
      if (cur.id) {
        seg = "#" + cur.id;
        parts.unshift(seg);
        break;
      }
      var cls = [];
      for (var i = 0; i < cur.classList.length; i++) {
        var c = cur.classList[i];
        if (!c.startsWith("_") && c.length < 30) cls.push(c);
        if (cls.length === 2) break;
      }
      if (cls.length) seg += "." + cls.join(".");
      parts.unshift(seg);
      cur = cur.parentElement;
    }
    return parts.join(" > ");
  }

  function getInfo(el) {
    return {
      tag: el.tagName.toLowerCase(),
      text: (el.textContent || "").trim().slice(0, 150),
      id: el.id || "",
      classes: (function () {
        var a = [];
        for (var i = 0; i < el.classList.length; i++) {
          var c = el.classList[i];
          if (!c.startsWith("_")) a.push(c);
        }
        return a.join(".");
      })(),
      selector: buildSelector(el),
      href: el.href || undefined,
      type: el.type || undefined,
      placeholder: el.placeholder || undefined,
      ariaLabel: el.getAttribute("aria-label") || undefined,
    };
  }

  function renderInfo(info) {
    var body = document.getElementById("__bm-body");
    var rows = [
      ["الوسم", "<" + info.tag + ">"],
      ["النص", info.text || "—"],
      ["ID", info.id || "—"],
      ["Classes", "." + (info.classes || "—")],
      ["Selector", info.selector],
    ];
    if (info.href) rows.push(["الرابط", info.href]);
    if (info.type) rows.push(["Type", info.type]);
    if (info.placeholder) rows.push(["Placeholder", info.placeholder]);
    if (info.ariaLabel) rows.push(["Aria-label", info.ariaLabel]);
    var html = rows
      .map(function (r) {
        return (
          '<div class="bm-row"><span class="bm-label">' +
          r[0] +
          ':</span><span class="bm-value' +
          (r[0] === "Selector" ? " bm-mono" : "") +
          '">' +
          r[1] +
          "</span></div>"
        );
      })
      .join("");
    html +=
      '<label for="__bm-note">صف التعديل المطلوب</label><textarea id="__bm-note" placeholder="مثال: غير النص إلى ...، أضف زر جديد" dir="rtl"></textarea>';
    body.innerHTML = html;
    panel.style.display = "flex";
  }

  function getModNote() {
    var ta = document.getElementById("__bm-note");
    return ta ? ta.value : "";
  }

  function buildCopyText(info) {
    var t =
      "=== Bookmarklet Inspector ===\nTag: " +
      info.tag +
      "\nText: " +
      (info.text || "—") +
      "\nID: " +
      (info.id || "—") +
      "\nClasses: " +
      (info.classes || "—") +
      "\nSelector: " +
      info.selector;
    if (info.href) t += "\nHref: " + info.href;
    if (info.type) t += "\nInput type: " + info.type;
    if (info.placeholder) t += "\nPlaceholder: " + info.placeholder;
    if (info.ariaLabel) t += "\nAriaLabel: " + info.ariaLabel;
    var note = getModNote();
    if (note) t += "\n\nModification note:\n" + note;
    return t;
  }

  var lastInfo = null;

  function onHover(e) {
    var el = e.target;
    var rect = el.getBoundingClientRect();
    outline.style.display = "block";
    outline.style.left = rect.left + "px";
    outline.style.top = rect.top + "px";
    outline.style.width = rect.width + "px";
    outline.style.height = rect.height + "px";
  }

  function onClick(e) {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    document.removeEventListener("mouseover", onHover, true);
    document.removeEventListener("click", onClick, true);
    outline.style.display = "none";
    lastInfo = getInfo(e.target);
    renderInfo(lastInfo);
  }

  document.addEventListener("mouseover", onHover, true);
  document.addEventListener("click", onClick, true);

  document.getElementById("__bm-hide").onclick = function () {
    panel.style.display = "none";
    outline.style.display = "none";
  };

  document.getElementById("__bm-close").onclick = function () {
    panel.style.display = "none";
    outline.style.display = "none";
  };

  document.getElementById("__bm-copy").onclick = function () {
    if (!lastInfo) return;
    var text = buildCopyText(lastInfo);
    navigator.clipboard.writeText(text);
    var btn = document.getElementById("__bm-copy");
    var orig = btn.textContent;
    btn.textContent = "✓ تم النسخ!";
    setTimeout(function () {
      btn.textContent = orig;
    }, 2000);
  };
})();
